import ON_DEATH from "death";
import express from 'express';
import DatabaseWrapper from "./libs/sqlite-wrapper";
import bodyParser from 'body-parser';
import { handshake, SessionManger } from './libs/session-manager';
import { AuthenticationManager } from './libs/authentication-manager';
import { StudentDBManager } from './libs/student-db-manager';

ON_DEATH(() => {
    console.log("Shutting down server ...");
    process.exit(0);
});

const db = new DatabaseWrapper("database", "./", { info: console.log, error: console.error });
const sessionManager = new SessionManger();
const studentDBManager = new StudentDBManager(db);
const authenticationManager = new AuthenticationManager(db);

const sessionUserIDMap = new Map<string, string>();

const app = express();
const port = parseInt(process.env.PORT || "3000");
const API_VERSION = "0.0.1";

app.use(bodyParser.json());

app.post('/handshake', (req, res) => {
    const userPublicKey = req.body.userPublicKey;
    const ip = req.body.ip;
    res.status(200).json({
        success: true,
        api_version: API_VERSION,
        data: handshake(sessionManager, userPublicKey, ip)
    });
});

app.post('/sign-in', async (req, res) => {
    try {
        const { id, password } = sessionManager.decryptClientData(req.body.data, req.body.session);
        if (!id || !password) throw new Error('Missing id or password');
        const token = await authenticationManager.login(id, password);
        sessionUserIDMap.set(req.body.session, id);
        res.status(200).json({
            success: true,
            data: sessionManager.encryptClientData({ token }, req.body.session)
        });
    }
    catch (e) {
        console.log(e);
        res.status(401).json({
            success: false,
            msg: String(e)
        });
    }
});

app.post('/sign-up', async (req, res) => {
    try {
        const { username, password, permissions } = sessionManager.decryptClientData(req.body.data, req.body.session);
        if (!username || !password || !permissions) throw new Error('Something is missing');
        await authenticationManager.addUser(username, password, permissions);
        res.status(200).json({
            success: true
        });
    }
    catch (e) {
        console.log(e);
        res.status(401).json({
            success: false,
            msg: String(e)
        });
    }
});

app.post('/close', (req, res) => {
    sessionManager.closeSession(req.body.session);
    res.status(200).json({
        success: true
    });
});

app.post('/get-students', (req, res) => {
    try {
        const sessionID = req.body.session;
        if (!sessionID) throw new Error('Missing session');
        const { token, limit } = sessionManager.decryptClientData(req.body.data, sessionID);

        const userId = sessionUserIDMap.get(sessionID);
        if (!userId) throw new Error('Fail to find the session user');

        if (!token) throw new Error('Missing token');
        if (!authenticationManager.verifyToken(userId, token)) throw new Error('Invalid token');


        const students = studentDBManager.getStudents(limit || 10);
        res.status(200).json({
            success: true,
            data: sessionManager.encryptClientData(JSON.stringify(students), sessionID)
        });
    }
    catch (e) {
        console.log(e);
        res.status(401).json({
            success: false
        });
    }
});

app.post('/add-student', (req, res) => {
    try {
        const sessionID = req.body.session;
        if (!sessionID) throw new Error('Missing session');
        const { token, student } = sessionManager.decryptClientData(req.body.data, sessionID);

        const userId = sessionUserIDMap.get(sessionID);
        if (!userId) throw new Error('Fail to find the session user');

        if (!token) throw new Error('Missing token');
        if (!authenticationManager.verifyToken(userId, token)) throw new Error('Invalid token');

        if (!student.id) throw new Error('Missing id');
        if (!student.name) throw new Error('Missing name');

        studentDBManager.addStudent({
            id: student.id,
            name: student.name
        });
        res.status(200).json({
            success: true
        });
    }
    catch (e) {
        console.log(e);
        res.status(401).json({
            success: false
        });
    }
});


app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running at ${port}`);
});
