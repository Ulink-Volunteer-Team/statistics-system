import ConfigProvider from './utils/config-provider';
import express from 'express';
import bodyParser from 'body-parser';
import rateLimit from "express-rate-limit";
import { IpFilter } from "express-ipfilter"
import z from "zod";
import pino from "pino";
import pinoHttp from "pino-http";
import pinoPretty, { PinoPretty } from "pino-pretty";

import serverRoutes from './libs/server-apis';
import SessionManger from './libs/session-manager';
import AuthenticationManager from './libs/authentication-manager';
import StudentDBManager from './libs/student-db-manager';
import RecruitmentDBManager from './libs/recruitment-db-manager';
import EventDBManager from './libs/event-db-manager';

import DeathEvent from "./utils/death-event";
import DatabaseWrapper from "./utils/sqlite-wrapper";

const pinoHttpConfig = {
    autoLogging: false,
    quietReqLogger: true,
    quietResLogger: true
};
const pinoPrettyConfig: PinoPretty.PrettyOptions = {
    colorize: true,
    colorizeObjects: true,
    translateTime: true,
}

const configSchema = z.object({
    DB_NAME: z.string(),
    DB_DIR: z.string(),

    SERVER_PORT: z.string(),

    IP_MAX_PER_MIN: z.number(),
    BANNED_IP: z.array(z.string()),
});

const pinoPrettyInst = pinoPretty(pinoPrettyConfig);
const loggerHttp = pinoHttp(pinoHttpConfig, pinoPrettyInst)
const logger = pino(pinoPrettyInst);

const deathEvent = new DeathEvent(logger);
deathEvent.addJob(() => {
    logger.info("Shutting down server...");
    return true;
}, "Msg");

async function main(config: z.infer<typeof configSchema>) {
    const db = new DatabaseWrapper(config.DB_NAME, config.DB_DIR, deathEvent, logger);
    const port = config.SERVER_PORT;
    const sessionManager = new SessionManger();

    const limiter = rateLimit({
        windowMs: 60000,
        max: config.IP_MAX_PER_MIN,
        message: 'Too many requests from this IP, please try again later.'
    });

    const configBannedIPs = config.BANNED_IP;
    const bannedIPs = (Array.isArray(configBannedIPs) ? configBannedIPs : []) as string[]
    const ipFilter = IpFilter(bannedIPs, { mode: 'deny' })


    const app = express()
        .use(bodyParser.json())
        .use(loggerHttp)
        .use(limiter)
        .use(ipFilter);

    const [studentDBManager, authenticationManager, recruitmentDBManager] = await Promise.all([
        new Promise<StudentDBManager>((resolve) => {
            const studentDBManager = new StudentDBManager(db, () => resolve(studentDBManager));
        }),
        new Promise<AuthenticationManager>((resolve) => {
            const authenticationManager = new AuthenticationManager(db, () => resolve(authenticationManager));
        }),
        new Promise<RecruitmentDBManager>((resolve) => {
            const recruitmentDBManager = new RecruitmentDBManager(db, () => resolve(recruitmentDBManager));
        })
    ]);

    const eventsDBManager = new EventDBManager(db, studentDBManager, recruitmentDBManager);
    Object.entries(serverRoutes).forEach(([apiName, route]) => {
        app.post(`/${apiName}`, (req, res) => {
            const url = req.originalUrl.split("/").pop();
            route(req, res, sessionManager, {
                studentDBManager,
                authenticationManager,
                recruitmentDBManager,
                eventsDBManager
            })
                .catch(e => {
                    req.log.error({ handled: false, msg: `Unhandled error: ${String(e)}` });
                })
                .then(() => {
                    req.log.info({ msg: "Request handled", requestedApi: url });
                })
        });
    });

    app.listen(port, '0.0.0.0', () => {
        logger.info(`Server is ready at port ${port}`);
    });
}

new ConfigProvider(configSchema).getConfig("config.yml")
    .then(main)
    .catch((err: z.ZodError) => {
        logger.error(
            "Fail to get all the fields for the config\n" +
            err.issues.map(issue => {
                return `  ${issue.path.join(".")}: ${issue.message}`;
            }).join("\n")
        );
    });