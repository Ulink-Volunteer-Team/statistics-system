import { Request, Response } from 'express';
import SessionManger, { handshake } from './session-manager';
import AuthenticationManager from './authentication-manager';
import RecruitmentDBManager from './recruitment-db-manager';
import StudentDBManager from './student-db-manager';
import EventDBManager from './event-db-manager';
import { z } from "zod";
import * as schema from './api-schema';
import { Logger } from 'pino';

export type RouteDataAccessType = {
    studentDBManager: StudentDBManager,
    authenticationManager: AuthenticationManager,
    recruitmentDBManager: RecruitmentDBManager,
    eventsDBManager: EventDBManager
}

type ServerRouteType = (req: Request, res: Response, sessionManager: SessionManger, dataSource: RouteDataAccessType) => Promise<void>;

const sessionUserIDMap = new Map<string, string>();
export const API_VERSION = "0.0.1";

type ServerRouteResolveType = {
    [key: string]: unknown
}

/**
 * A template function for handling API requests with session and token validation.
 *
 * @param req - The request object from the client.
 * @param res - The response object to send data back to the client.
 * @param sessionManager - Manages sessions for the API requests.
 * @param authenticationManager - Manages user authentication and token verification.
 * @param name - The name of the API endpoint being handled.
 * @param apiSchema - Zod schema to validate and parse request data.
 * @param logger - Logger instance for logging request handling information.
 * @param handler - Async function to process the validated request data.
 *
 * @template PayloadType - The type of the payload expected in the request, validated using the provided Zod schema.
 *
 * @returns A promise that resolves when the request has been handled and a response has been sent.
 */
export const handleApiRequest = async <PayloadType extends z.ZodType>(
    req: Request,
    res: Response,
    sessionManager: SessionManger,
    authenticationManager: AuthenticationManager,
    name: string,
    apiSchema: PayloadType,
    logger: Logger,
    handler: (args: z.infer<PayloadType>) => Promise<ServerRouteResolveType | void>
) => {
    const sessionID = req.body.session;
    if (!sessionID) {
        res.status(400).json({
            success: false,
            msg: "Missing session ID"
        });
        return;
    }
    if (!sessionManager.haveSession(sessionID)) {
        res.status(401).json({
            success: false,
            msg: "Invalid session ID"
        })
    }

    try {
        const details = schema.checkSchema(sessionManager.decryptClientData<z.infer<PayloadType>>(req.body.data, sessionID), apiSchema);
        if (details.token !== undefined) unwrapForInvalidToken(sessionID, details.token, authenticationManager);

        const resolved = await handler(details)

        res.status(200).json({
            data: sessionManager.encryptClientData({ ...resolved }, sessionID),
            success: true,
        });
        logger.info(`Successfully handled route "${name}"`);
    } catch (e) {
        res.status(400).json({
            success: false,
            msg: `Errors in "${name}": ${String(e)}`
        });
        logger.warn(`Error occurred when handling route "${name}": ${String(e)}`);
    }
}

/**
 * Verifies the token for the given session ID. If the token is invalid or missing or the session ID is missing or invalid, an error is thrown.
 * @param sessionID The session ID to verify the token for
 * @param token The token to verify
 * @param authenticationManager The authentication manager to use for the verification
 * @throws {Error} If the token is invalid or missing or the session ID is missing or invalid
 */
const unwrapForInvalidToken = (sessionID: string | undefined, token: string | undefined, authenticationManager: AuthenticationManager) => {
    if (!sessionID) throw new Error('Missing session ID');
    if (!token) throw new Error('Missing token');

    const userId = sessionUserIDMap.get(sessionID);
    if (!userId) throw new Error('Fail to find the session user');

    if (!authenticationManager.verifyToken(userId, token)) throw new Error('Invalid token');
}

/**
 * Rejects an API request, logs the warning, and sends a JSON response with an error message.
 *
 * @param msg - The error message to include in the response.
 * @param req - The request object, used for logging.
 * @param res - The response object, used to send the error response.
 * @param code - The HTTP status code for the response. Defaults to 400.
 */
const rejectRequest = (msg: string, req: Request, res: Response, code = 400) => {
    req.log.warn({ handled: true, msg, sessionID: req.body.session });
    res.status(code).json({
        success: false,
        msg
    });
}

export const serverRoutes: Record<string, ServerRouteType> = {
    "handshake": async (req: Request, res: Response, sessionManager: SessionManger) => {
        const userPublicKey = req.body.userPublicKey;
        const ip = req.ip;

        if (!userPublicKey) {
            const msg = "Missing user's public key";
            req.log.warn({ handled: true, msg, ip });
            res.status(401).json({
                success: false,
                msg
            });
        }

        const { data, id } = handshake(sessionManager, userPublicKey, ip || "");
        res.status(200).json({
            success: true,
            api_version: API_VERSION,
            data
        });
        req.log.info({ handled: true, msg: "Handshake success", ip, sessionId: id });
    },

    "sign-in": async (req, res, sessionManager, dataSource) => {
        await handleApiRequest(req, res, sessionManager, dataSource.authenticationManager, "sign-in", schema.api_signInSchema, req.log, async ({ id, password }) => {
            const token = await dataSource.authenticationManager.login(id, password);
            sessionUserIDMap.set(req.body.session, id);
            return { token }
        });
    },

    "sign-up": async (req, res, sessionManager, dataSource) => {
        await handleApiRequest(req, res, sessionManager, dataSource.authenticationManager, "sign-up", schema.api_signUpSchema, req.log, async ({ id, password, permissions }) => {
            return new Promise((resolve, reject) => {
                dataSource.authenticationManager.addUser(id, password, permissions)
                    .then(() => resolve())
                    .catch((e) => reject(e));
            });
        });
    },

    "close-session": async (req, res, sessionManager) => {
        try {
            sessionManager.closeSession(req.body.session);
            res.status(200).json({
                success: true
            });
            req.log.info({ handled: true, msg: "Close session success", sessionID: req.body.session });
        } catch (e) {
            const msg = `Error during close session: ${String(e)}`;
            req.log.warn({ handled: true, msg, sessionID: req.body.session });
            rejectRequest(msg, req, res);
        }
    },

    "get-students": async (req, res, sessionManager, dataSource) => {
        await handleApiRequest(req, res, sessionManager, dataSource.authenticationManager, "get-students", schema.api_getStudentsSchema, req.log, async ({ limit }) => {
            return { students: await dataSource.studentDBManager.getStudents(limit || 10, 0) };
        });
    },

    "add-student": async (req: Request, res, sessionManager, dataSource) => {
        const { authenticationManager, studentDBManager } = dataSource;
        await handleApiRequest(req, res, sessionManager, authenticationManager, "add-student", schema.api_addStudentSchema, req.log, async ({ student }) => {
            await studentDBManager.addStudent({
                id: student.id,
                name: student.name
            });
        });
    },

    "add-student-bulk": async (req, res, sessionManager, dataSource) => {
        const { authenticationManager, studentDBManager } = dataSource;

        await handleApiRequest(req, res, sessionManager, authenticationManager, "add-student-bulk", schema.api_addStudentBulkSchema, req.log, async ({ students }) => {
            await studentDBManager.addStudentsBulk(students);
        });
    },

    "fuzzy-search-student": async (req, res, sessionManager, dataSource) => {
        const { authenticationManager, studentDBManager } = dataSource;

        await handleApiRequest(req, res, sessionManager, authenticationManager, "fuzzy-search-student", schema.api_fuzzySearchStudentSchema, req.log, async ({ queryName }) => {
            return { students: await studentDBManager.fuzzySearchStudent(queryName) };
        });
    },

    "update-student": async (req, res, sessionManager, dataSource) => {
        const { authenticationManager, studentDBManager } = dataSource;

        await handleApiRequest(req, res, sessionManager, authenticationManager, "update-student", schema.api_addStudentSchema, req.log, async ({ student }) => {
            await studentDBManager.updateStudent(student.id, student.name);
        });
    },

    "delete-student": async (req, res, sessionManager, dataSource) => {
        const { authenticationManager, studentDBManager } = dataSource;

        await handleApiRequest(req, res, sessionManager, authenticationManager, "delete-student", schema.api_deleteStudentSchema, req.log, async ({ id }) => {
            await studentDBManager.removeStudent(id);
        });
    },

    "add-recruitment": async (req, res, sessionManager, dataSource) => {
        const { authenticationManager, recruitmentDBManager } = dataSource;

        await handleApiRequest(req, res, sessionManager, authenticationManager, "add-recruitment", schema.api_addRecruitmentSchema, req.log, async ({ recruitment }) => {
            await recruitmentDBManager.addRecruitment(recruitment);
        });
    },

    "get-recruitment": async (req, res, sessionManager, dataSource) => {
        await handleApiRequest(req, res, sessionManager, dataSource.authenticationManager, "get-recruitment", schema.api_getRecruitmentSchema, req.log, async ({ id }) => {
            return { recruitment: await dataSource.recruitmentDBManager.getRecruitment(id) };
        });
    },

    "update-recruitment": async (req, res, sessionManager, dataSource) => {
        await handleApiRequest(req, res, sessionManager, dataSource.authenticationManager, "update-recruitment", schema.api_updateRecruitmentSchema, req.log, async ({ recruitment }) => {
            if (!recruitment.id) return Promise.reject("Missing recruitment id");
            await dataSource.recruitmentDBManager.updateRecruitment(recruitment.id, recruitment);
        });
    },

    "delete-recruitment": async (req, res, sessionManager, dataSource) => {
        await handleApiRequest(req, res, sessionManager, dataSource.authenticationManager, "delete-recruitment", schema.api_deleteRecruitmentSchema, req.log, async ({ id }) => {
            await dataSource.recruitmentDBManager.removeRecruitment(id);
        });
    },

    "add-volunteer-to-event": async (req, res, sessionManager, dataSource) => {
        const { authenticationManager, eventsDBManager } = dataSource;

        await handleApiRequest(req, res, sessionManager, authenticationManager, "add-volunteer-to-event", schema.api_addVolunteerToEventSchema, req.log, async ({ eventID, studentID }) => {
            await eventsDBManager.addRecord(studentID, eventID);
        });
    },

    "add-volunteer-to-event-bulk": async (req, res, sessionManager, dataSource) => {
        const { authenticationManager, eventsDBManager } = dataSource;

        await handleApiRequest(req, res, sessionManager, authenticationManager, "add-volunteer-to-event-bulk", schema.api_addVolunteerToEventBulkSchema, req.log, async ({ eventID, studentIDs }) => {
            for (const id of studentIDs) {
                await eventsDBManager.addRecord(id, eventID);
            }
        });
    },

    "get-volunteers-from-event": async (req, res, sessionManager, dataSource) => {
        const { authenticationManager, eventsDBManager } = dataSource;

        await handleApiRequest(req, res, sessionManager, authenticationManager, "get-volunteers-from-event", schema.api_getVolunteersFromEventSchema, req.log, async ({ eventID }) => {
            return { volunteers: await eventsDBManager.getStudentIDsByEventID(eventID) };
        });
    },

    "get-events-from-volunteer": async (req, res, sessionManager, dataSource) => {
        const { authenticationManager, eventsDBManager } = dataSource;

        await handleApiRequest(req, res, sessionManager, authenticationManager, "get-events-from-volunteer", schema.api_getEventsFromVolunteerSchema, req.log, async ({ studentID }) => {
            return { events: await eventsDBManager.getEventIDsByStudentID(studentID) };
        })
    },

    "get-student-volunteer-time": async (req, res, sessionManager, dataSource) => {
        const { authenticationManager, eventsDBManager } = dataSource;

        await handleApiRequest(req, res, sessionManager, authenticationManager, "get-student-volunteer-time", schema.api_getStudentVolunteerTime, req.log, async ({ studentID, beginTime }) => {
            return { hours: await eventsDBManager.calculateVolunteerHour(studentID, beginTime) };
        })
    },
}

export default serverRoutes;
