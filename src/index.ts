import ConfigProvider from './utils/config-provider';
import express from 'express';
import bodyParser from 'body-parser';
import rateLimit from "express-rate-limit";
import { IpFilter } from "express-ipfilter"
import z from "zod";
import cors from "cors";
import pino from "pino";
import pinoHttp, { HttpLogger } from "pino-http";
import pinoPretty, { PinoPretty } from "pino-pretty";

import serverRoutes from '@/api/index';
import SessionManger from './libs/session-manager';
import AuthenticationManager from './libs/authentication-manager';
import StudentDBManager from './libs/student-db-manager';
import RecruitmentDBManager from './libs/recruitment-db-manager';
import EventDBManager from './libs/event-db-manager';

import DeathEvent from "./utils/death-event";
import DatabaseWrapper from "./utils/sqlite-wrapper";

import { StaticProvider } from './utils/static-provider';

function initLogger(config: ConfigType) {
	const pinoHttpConfig = {
		autoLogging: false,
		quietReqLogger: config.LOGGER_PRETTY_PRINT,
		quietResLogger: config.LOGGER_PRETTY_PRINT
	};
	const pinoPrettyConfig: PinoPretty.PrettyOptions = {
		colorize: true,
		colorizeObjects: true,
		translateTime: true,
	}

	const pinoPrettyInst = pinoPretty(pinoPrettyConfig);
	const loggerHttp = config.LOGGER_PRETTY_PRINT ? pinoHttp(pinoHttpConfig, pinoPrettyInst) : pinoHttp(pinoHttpConfig)
	const logger = config.LOGGER_PRETTY_PRINT ? pino(pinoPrettyInst) : pino();

	return { logger, loggerHttp };
}

function initConfig() {
	const configSchema = z.object({
		DB_NAME: z.string(),
		DB_DIR: z.string(),
		STATIC_DIR: z.string(),

		SERVER_PORT: z.number(),
		TRUST_PROXY: z.boolean(),
		PROXY_IP_ADDRESS: z.array(z.string()),

		ENABLE_RATE_LIMIT: z.boolean().optional(),
		RATE_LIMIT_PER_MIN: z.number(),
		BANNED_IP: z.array(z.string()),

		TOKEN_SECRET_KEY: z.string(),
		TOKEN_SALT_ROUND: z.number(),
		TOKEN_EXPIRES_IN: z.string(),

		TURNSTILE_SECRET_KEY: z.string().optional(),
		TURNSTILE_REQUIRED: z.boolean().optional(),

		LOGGER_PRETTY_PRINT: z.boolean().optional(),
	}).refine(data => !data.TURNSTILE_REQUIRED || !!data.TURNSTILE_SECRET_KEY, {
		message: "TURNSTILE_SECRET_KEY is required when Cloudflare Turnstile is enabled",
		path: ["TURNSTILE_SECRET_KEY"],
	});

	const defaultConfigs: z.infer<typeof configSchema> = {
		DB_NAME: "database",
		DB_DIR: "./",
		STATIC_DIR: "./static",

		SERVER_PORT: 3000,
		TRUST_PROXY: false,
		PROXY_IP_ADDRESS: [],

		ENABLE_RATE_LIMIT: true,
		RATE_LIMIT_PER_MIN: 100,
		BANNED_IP: [],

		TOKEN_SECRET_KEY: "secret",
		TOKEN_SALT_ROUND: 12,
		TOKEN_EXPIRES_IN: "1d",

		TURNSTILE_SECRET_KEY: "secret",
		TURNSTILE_REQUIRED: true,

		LOGGER_PRETTY_PRINT: false
	}
	return {
		promise: new ConfigProvider(configSchema, defaultConfigs).getConfig(process.env.SERVER_CONFIG_FILE || "config.yml"),
		schema: configSchema
	}
}

type ConfigType = Required<z.infer<Awaited<ReturnType<typeof initConfig>>["schema"]>>;

function attachRoutes(app: express.Application, logger: pino.Logger, sessionManager: SessionManger, studentDBManager: StudentDBManager, authenticationManager: AuthenticationManager, recruitmentDBManager: RecruitmentDBManager, eventsDBManager: EventDBManager, database: DatabaseWrapper) {
	serverRoutes.forEach(({ name, handler }) => {
		app.post(`/${name}`, (req, res) => {
			const url = req.originalUrl.split("/").pop();
			handler(req, res, sessionManager, {
				studentDBManager,
				authenticationManager,
				recruitmentDBManager,
				eventsDBManager,
				database,
			})
				.catch(e => {
					req.log.error({ handled: false, msg: `Unhandled error: ${String(e)}` });
				})
				.then(() => {
					req.log.info({ msg: "Request handled", requestedApi: url });
				});
		});
		logger.info(`Route "${name}" is ready`);
	});
}

function initManagers(db: DatabaseWrapper, config: ConfigType) {
	return Promise.all([
		new Promise<StudentDBManager>((resolve, reject) => {
			const studentDBManager = new StudentDBManager(db, () => resolve(studentDBManager), reject);
		}),
		new Promise<AuthenticationManager>((resolve, reject) => {
			const authenticationManager = new AuthenticationManager(db, {
				secretKey: config.TOKEN_SECRET_KEY,
				saltRounds: config.TOKEN_SALT_ROUND,
				expiresIn: config.TOKEN_EXPIRES_IN,
				turnstileSecretKey: config.TURNSTILE_SECRET_KEY,
				turnstileRequired: config.TURNSTILE_REQUIRED
			}, () => resolve(authenticationManager), reject);
		}),
		new Promise<RecruitmentDBManager>((resolve, reject) => {
			const recruitmentDBManager = new RecruitmentDBManager(db, () => resolve(recruitmentDBManager), reject);
		})
	]);
}

function initExpress(config: ConfigType, logger: pino.Logger, loggerHttp: HttpLogger) {
	const configBannedIPs = config.BANNED_IP;
	const bannedIPs = (Array.isArray(configBannedIPs) ? configBannedIPs : []) as string[];
	const ipFilter = IpFilter(bannedIPs, { mode: 'deny' });

	logger.info("Server is starting...");
	const app = express()
		.use(bodyParser.json())
		.use(loggerHttp)
		.use(ipFilter)
		.use(cors());

	if (config.TRUST_PROXY) {
		app.set('trust proxy', config.PROXY_IP_ADDRESS);
	}

	if (config.ENABLE_RATE_LIMIT) {
		const limiter = rateLimit({
			windowMs: 60000,
			limit: config.RATE_LIMIT_PER_MIN,
			message: 'Too many requests from this IP, please try again later.'
		});
		app.use(limiter);
	}
	return app;
}

function main(config: ConfigType, logger: pino.Logger, loggerHttp: HttpLogger) {
	return new Promise<void>((resolve, reject) => {
		try {
			const deathEvent = new DeathEvent(logger);
			deathEvent.addJob(() => {
				logger.info("Shutting down server...");
				return true;
			}, "Msg");

			const db = new DatabaseWrapper(config.DB_NAME, config.DB_DIR, deathEvent, logger);
			const port = config.SERVER_PORT;
			const sessionManager = new SessionManger();

			const app = initExpress(config, logger, loggerHttp);

			initManagers(db, config)
				.then(([studentDBManager, authenticationManager, recruitmentDBManager]) => {
					const eventsDBManager = new EventDBManager(db, studentDBManager, recruitmentDBManager);
					attachRoutes(app, logger, sessionManager, studentDBManager, authenticationManager, recruitmentDBManager, eventsDBManager, db);
					app.listen(port, '0.0.0.0', async () => {
						await (new StaticProvider(app, config.STATIC_DIR, logger)).serve();
						logger.info(`Server is running at port ${port}`);
						resolve();
					});
				});
		} catch (e) {
			reject(e);
		}
	});
}


const { promise: configPromise } = initConfig()

configPromise
	.then((config: ConfigType) => {
		const { logger, loggerHttp } = initLogger(config);
		logger.info({
			msg: "Config is ready",
			// filter out the secret key
			...config,
			TOKEN_SECRET_KEY: "********",
			TURNSTILE_SECRET_KEY: "********",
		})

		main(config, logger, loggerHttp)
			.then(() => {
				logger.info("Server is ready");
			})
			.catch(e => {
				logger.error("Fail to start server");
				console.error(e);
			});
	})
	.catch((err: z.ZodError | string) => {
		if (typeof err == "string") {
			console.error(`Fail on loading the config: ${err}`);
		} else {
			console.error(
				"Fail to get all the fields for the config\n" +
				err.issues.map(issue => {
					return `  ${issue.path.join(".")}: ${issue.message}`;
				}).join("\n")
			);
		}
	});
