import ON_DEATH from "death";
import express from 'express';
import bodyParser from 'body-parser';
import pinoHttp from "pino-http";
import pinoPretty, { PinoPretty } from "pino-pretty";

import serverRoutes from './libs/server-apis';
import SessionManger from './libs/session-manager';
import AuthenticationManager from './libs/authentication-manager';
import StudentDBManager from './libs/student-db-manager';
import DatabaseWrapper from "./libs/sqlite-wrapper";

ON_DEATH(() => {
    console.log("\nShutting down server ...");
    process.exit(0);
});

const port = parseInt(process.env.PORT || "3000");
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
const logger = pinoHttp(pinoHttpConfig, pinoPretty(pinoPrettyConfig))

const db = new DatabaseWrapper("database", "./", { info: console.log, error: console.error });
const sessionManager = new SessionManger();
const studentDBManager = new StudentDBManager(db);
const authenticationManager = new AuthenticationManager(db);

const app = express()
    .use(bodyParser.json())
    .use(logger);

Object.entries(serverRoutes).forEach(([apiName, route]) => {
    app.post(`/${apiName}`, (req, res) => {
        route(req, res, sessionManager, studentDBManager, authenticationManager)
            .catch(e => {
                req.log.error({handled: false, msg: `Unhandled error: ${String(e)}`});
            });
    });
});

// Start server
app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running at ${port}`);
});
