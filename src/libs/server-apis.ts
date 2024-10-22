import { Request, Response } from 'express';
import SessionManger, { handshake } from './session-manager';
import AuthenticationManager from './authentication-manager';
import StudentDBManager from './student-db-manager';

const sessionUserIDMap = new Map<string, string>();
export const API_VERSION = "0.0.1";

export const serverRoutes = {
    "handshake": async (req: Request, res: Response, sessionManager: SessionManger, _1: StudentDBManager, _2: AuthenticationManager) => {
        const userPublicKey = req.body.userPublicKey;
        const ip = req.body.ip;
        res.status(200).json({
            success: true,
            api_version: API_VERSION,
            data: handshake(sessionManager, userPublicKey, ip)
        });
    },

    "sign-in": async (req: Request, res: Response, sessionManager: SessionManger, _: StudentDBManager, authenticationManager: AuthenticationManager) => {
        try {
            const { id, password }: { id: string, password: string } = sessionManager.decryptClientData(req.body.data, req.body.session);
            if (!id || !password) throw new Error('Missing id or password');
            const token = await authenticationManager.login(id, password);
            sessionUserIDMap.set(req.body.session, id);
            res.status(200).json({
                success: true,
                data: sessionManager.encryptClientData({ token }, req.body.session)
            });
        } catch (e) {
            console.log(e);
            res.status(401).json({
                success: false,
                msg: String(e)
            });
        }
    },

    "sign-up": async (req: Request, res: Response, sessionManager: SessionManger, _: StudentDBManager, authenticationManager: AuthenticationManager) => {
        try {
            const { username, password, permissions }: { username: string, password: string, permissions: string } = sessionManager.decryptClientData(req.body.data, req.body.session);
            if (!username || !password || !permissions) throw new Error('Something is missing');
            await authenticationManager.addUser(username, password, permissions);
            res.status(200).json({
                success: true
            });
        } catch (e) {
            console.log(e);
            res.status(401).json({
                success: false,
                msg: String(e)
            });
        }
    },

    "close-session": async (req: Request, res: Response, sessionManager: SessionManger, _1: StudentDBManager, _2: AuthenticationManager) => {
        sessionManager.closeSession(req.body.session);
        res.status(200).json({
            success: true
        });
    },

    "get-students": async (req: Request, res: Response, sessionManager: SessionManger, studentDBManager: StudentDBManager, authenticationManager: AuthenticationManager) => {
        try {
            const sessionID = req.body.session;
            if (!sessionID) throw new Error('Missing session');
            const { token, limit } = sessionManager.decryptClientData(req.body.data, sessionID);

            const userId = sessionUserIDMap.get(sessionID);
            if (!userId) throw new Error('Fail to find the session user');

            if (!token) throw new Error('Missing token');
            if (!authenticationManager.verifyToken(userId, token)) throw new Error('Invalid token');

            const students = await studentDBManager.getStudents(limit || 10, 0);
            res.status(200).json({
                success: true,
                data: sessionManager.encryptClientData({students}, sessionID)
            });
        } catch (e) {
            console.log(e);
            res.status(401).json({
                success: false
            });
        }
    },

    "add-student": async (req: Request, res: Response, sessionManager: SessionManger, studentDBManager: StudentDBManager, authenticationManager: AuthenticationManager) => {
        try {
            const sessionID = req.body.session;
            if (!sessionID) throw new Error('Missing session');
            const { token, student } = sessionManager.decryptClientData(req.body.data, sessionID);

            const userId = sessionUserIDMap.get(sessionID);
            if (!userId) throw new Error('Fail to find the session user');

            if (!token) throw new Error('Missing token');
            if (!authenticationManager.verifyToken(userId, token)) throw new Error('Invalid token');

            if (!student.id || !student.name) throw new Error('Missing id or name');

            await studentDBManager.addStudent({
                id: student.id,
                name: student.name
            });

            res.status(200).json({
                success: true
            });
        } catch (e) {
            console.log(e);
            res.status(401).json({
                success: false,
                msg: String(e)
            });
        }
    },

    "add-student-bulk": async (req: Request, res: Response, sessionManager: SessionManger, studentDBManager: StudentDBManager, authenticationManager: AuthenticationManager) => {
        try {
            const sessionID = req.body.session;
            if (!sessionID) throw new Error('Missing session');
            const { token, students } = sessionManager.decryptClientData(req.body.data, sessionID);

            const userId = sessionUserIDMap.get(sessionID);
            if (!userId) throw new Error('Fail to find the session user');

            if (!token) throw new Error('Missing token');
            if (!authenticationManager.verifyToken(userId, token)) throw new Error('Invalid token');

            if (!Array.isArray(students)) throw new Error('Invalid students data format');

            students.forEach((student, index) => {
                if (!student.id || !student.name) {
                    throw new Error(`Missing id or name at instance ${index}`);
                }
            });

            await studentDBManager.addStudentsBulk(students);

            res.status(200).json({
                success: true
            });
        } catch (e) {
            console.log(e);
            res.status(400).json({
                success: false,
                msg: String(e)
            });
        }
    },

    "fuzzy-search-student": async (req: Request, res: Response, sessionManager: SessionManger, studentDBManager: StudentDBManager, authenticationManager: AuthenticationManager) => {
        try {
            const sessionID = req.body.session;
            if (!sessionID) throw new Error('Missing session');
            const { token, queryName } = sessionManager.decryptClientData(req.body.data, sessionID);

            const userId = sessionUserIDMap.get(sessionID);
            if (!userId) throw new Error('Fail to find the session user');

            if (!token) throw new Error('Missing token');
            if (!authenticationManager.verifyToken(userId, token)) throw new Error('Invalid token');

            if(!queryName) throw new Error('Missing query name');

            const students = await studentDBManager.fuzzySearchStudent(queryName);

            res.status(200).json({
                success: true,
                data: sessionManager.encryptClientData({students}, sessionID)
            });
        } catch (e) {
            console.log(e);
            res.status(400).json({
                success: false,
                msg: String(e)
            });
        }
    }
}

export default serverRoutes;
