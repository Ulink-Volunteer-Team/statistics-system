import express from 'express';
import bodyParser from 'body-parser';
import pino from "pino";
import pinoHttp from "pino-http";
import pinoPretty, { PinoPretty } from "pino-pretty";

import serverRoutes from './libs/server-apis';
import SessionManger from './libs/session-manager';
import AuthenticationManager from './libs/authentication-manager';
import StudentDBManager from './libs/student-db-manager';
import RecruitmentDBManager from './libs/recruitment-db-manager';
import ParticipantsDBManager from './libs/participants-db-manager';

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

const deathEvent = new DeathEvent(logger);
deathEvent.addJob(() => {logger.info("Shutting down server..."); return true;}, "");

const db = new DatabaseWrapper("database", "./", deathEvent, logger);
const port = parseInt(process.env.PORT || "3000");
const sessionManager = new SessionManger();
const app = express()
    .use(bodyParser.json())
    .use(loggerHttp);

Promise.all([
    new Promise<StudentDBManager>((resolve) => {
        const studentDBManager = new StudentDBManager(db, () => {
            resolve(studentDBManager);
        });
    }), 
    new Promise<AuthenticationManager>((resolve) => {
        const authenticationManager = new AuthenticationManager(db, () => {
            resolve(authenticationManager);
        });
    }),
    new Promise<RecruitmentDBManager>((resolve) => {
        const recruitmentDBManager = new RecruitmentDBManager(db, () => {
            resolve(recruitmentDBManager);
        });
    })
]).then((managers) => {
    const [studentDBManager, authenticationManager, recruitmentDBManager] = managers;
    const participantsDBManager = new ParticipantsDBManager(db);
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
