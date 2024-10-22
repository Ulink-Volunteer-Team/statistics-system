import ON_DEATH from "death";
import express from 'express';
import bodyParser from 'body-parser';
import { API } from './libs/server-apis';
import { SessionManger } from './libs/session-manager';
import { AuthenticationManager } from './libs/authentication-manager';
import { StudentDBManager } from './libs/student-db-manager';
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
const API_VERSION = "0.0.1";

app.use(bodyParser.json());

// Handshake route
app.post('/handshake', (req, res) => API.handshakeHandler(req, res, sessionManager, API_VERSION));

// Sign-in route
app.post('/sign-in', (req, res) => API.signInHandler(req, res, sessionManager, authenticationManager));

// Sign-up route
app.post('/sign-up', (req, res) => API.signUpHandler(req, res, sessionManager, authenticationManager));

// Close session route
app.post('/close', (req, res) => API.closeSessionHandler(req, res, sessionManager));

// Get students route
app.post('/get-students', (req, res) => API.getStudentsHandler(req, res, sessionManager, studentDBManager, authenticationManager));

// Add student route
app.post('/add-student', (req, res) => API.addStudentHandler(req, res, sessionManager, studentDBManager, authenticationManager));

// Add students in bulk route
app.post('/add-student-bulk', (req, res) => API.addStudentBulkHandler(req, res, sessionManager, studentDBManager, authenticationManager));

// Get students in bulk route
app.post("/get-students", (req, res) => API.getStudentsHandler(req, res, sessionManager, studentDBManager, authenticationManager));

// Start server
app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running at ${port}`);
});
