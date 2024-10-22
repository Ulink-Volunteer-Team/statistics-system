import ON_DEATH from "death";
import express from 'express';
import bodyParser from 'body-parser';
import serverRoutes from './libs/server-apis';
import SessionManger from './libs/session-manager';
import AuthenticationManager from './libs/authentication-manager';
import StudentDBManager from './libs/student-db-manager';
import DatabaseWrapper from "./libs/sqlite-wrapper";

ON_DEATH(() => {
    console.log("\nShutting down server ...");
    process.exit(0);
});

const db = new DatabaseWrapper("database", "./", { info: console.log, error: console.error });
const sessionManager = new SessionManger();
const studentDBManager = new StudentDBManager(db);
const authenticationManager = new AuthenticationManager(db);

const app = express();
const port = parseInt(process.env.PORT || "3000");

app.use(bodyParser.json());

Object.keys(serverRoutes).forEach(api => {
    app.post(`/${api}`, (req, res) => {
        serverRoutes[api as keyof typeof serverRoutes](req, res, sessionManager, studentDBManager, authenticationManager)
        .catch(e => {
            console.log(`Unhandled error: ${String(e)}`);
        });
    });
})

// Start server
app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running at ${port}`);
});
