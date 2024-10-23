import ON_DEATH from "death";
import express from 'express';
import bodyParser from 'body-parser';
import pino from "pino";
import pinoHttp from "pino-http";
import pinoPretty, { PinoPretty } from "pino-pretty";

import serverRoutes from './libs/server-apis';
import SessionManger from './libs/session-manager';
import AuthenticationManager from './libs/authentication-manager';
import StudentDBManager from './libs/student-db-manager';

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
const pinoPrettyInst = pinoPretty(pinoPrettyConfig);
const loggerHttp = pinoHttp(pinoHttpConfig, pinoPrettyInst)
const logger = pino(pinoPrettyInst);


const deathEvent = new DeathEvent();
ON_DEATH(async () => {
    logger.info("Shutting DOWN server ...");
    await deathEvent.prepareToDie();
    logger.info("Server has been shut down");
    process.exit(0);
});

const port = parseInt(process.env.PORT || "3000");

const db = new DatabaseWrapper("database", "./", deathEvent, logger);
const sessionManager = new SessionManger();
const app = express()
    .use(bodyParser.json())
    .use(loggerHttp);

let studentDBReady = new Promise<StudentDBManager>((resolve) => {
    const studentDBManager = new StudentDBManager(db, () => {
        resolve(studentDBManager);
    });
});

let authenticationManagerReady = new Promise<AuthenticationManager>((resolve) => {
    const authenticationManager = new AuthenticationManager(db, () => {
        resolve(authenticationManager);
    });
});

Promise.all([studentDBReady, authenticationManagerReady]).then(([studentDBManager, authenticationManager]) => {
    Object.entries(serverRoutes).forEach(([apiName, route]) => {
        app.post(`/${apiName}`, (req, res) => {
            const url = req.originalUrl.split("/").pop();
            route(req, res, sessionManager, studentDBManager, authenticationManager)
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
});
