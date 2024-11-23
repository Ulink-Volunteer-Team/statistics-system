import SessionManger, { handshake as handshakeBase } from '@/libs/session-manager';
import AuthenticationManager from '@/libs/authentication-manager';
import RecruitmentDBManager from '@/libs/recruitment-db-manager';
import StudentDBManager from '@/libs/student-db-manager';
import EventDBManager from '@/libs/event-db-manager';
import { Request, Response } from 'express';
import { z } from 'zod';

const disableCustomEncryptionLayer = true;

export type RouteDataAccessType = {
    studentDBManager: StudentDBManager,
    authenticationManager: AuthenticationManager,
    recruitmentDBManager: RecruitmentDBManager,
    eventsDBManager: EventDBManager
}

export type ServerRouteType = (req: Request, res: Response, sessionManager: SessionManger, dataSource: RouteDataAccessType) => Promise<void>;

const sessionUserIDMap = new Map<string, string>();
export const API_VERSION = "0.0.2";

export type ServerRouteResolveType = {
    [key: string]: unknown
}

type RouteHandlerType<T extends z.ZodType> = (args: z.infer<T>, dataSource: RouteDataAccessType, sessionID: string, sessionUserIDMap: Map<string, string>) => Promise<ServerRouteResolveType | void>;

/**
 * Constructs a server route handler for API requests with validation and processing.
 *
 * @param name - The name of the API endpoint, must match /^[a-zA-Z0-9_-]+$/ regex.
 * @param schema - Zod schema to validate and parse request data for the endpoint.
 * @param handler - Async function to process the validated request data and return a result.
 *
 * @template T - The type of the payload expected in the request, validated using the provided Zod schema.
 *
 * @returns An object containing the name of the endpoint and a handler function that processes API requests.
 *          The handler function validates the request, manages session and token validation, and processes the request data.
 */
export function APIHandlerConstructor<T extends z.ZodType>(name: string, schema: T, handler: RouteHandlerType<T>) {
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) throw new Error("Invalid route name");
    return {
        name,
        handler:
            (async (req: Request, res: Response, sessionManager: SessionManger, dataSource: RouteDataAccessType) => {
                await handleApiRequest(
                    req,
                    res,
                    sessionManager,
                    dataSource,
                    name,
                    schema,
                    handler
                )
            })
    }
}

/**
 * A template function for handling API requests with session and token validation.
 *
 * @param req - The request object from the client.
 * @param res - The response object to send data back to the client.
 * @param sessionManager - The session manager object to manage sessions.
 * @param dataSource - The data source object containing the necessary data for the API request.
 * @param name - The name of the API endpoint being handled.
 * @param apiSchema - Zod schema to validate and parse request data.
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
    dataSource: RouteDataAccessType,
    name: string,
    apiSchema: PayloadType,
    handler: RouteHandlerType<PayloadType>
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
        const details = checkSchema(
            disableCustomEncryptionLayer 
                ? req.body?.data
                : sessionManager.decryptClientData<z.infer<PayloadType>>(req.body.data, sessionID),
            apiSchema
        );
        if (details.token !== undefined) unwrapForInvalidToken(sessionID, details.token, dataSource.authenticationManager);

        const resolved = await handler(details, dataSource, sessionID, sessionUserIDMap);

        res.status(200).json({
            data: disableCustomEncryptionLayer
                ? resolved || {}
                : sessionManager.encryptClientData({ ...resolved }, sessionID),
            success: true,
        });
        req.log.info({msg: `Successfully handled route "${name}"`, sessionID, handled: true, secure: disableCustomEncryptionLayer});
    } catch (e) {
        res.status(400).json({
            success: false,
            msg: `Errors in "${name}": ${String(e)}`
        });
        req.log.warn({msg: `Error occurred when handling route "${name}": ${String(e)}`, sessionID, handled: false, secure: disableCustomEncryptionLayer});
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
    req.log.warn({ handled: true, msg, sessionID: req.body.session, secure: disableCustomEncryptionLayer });
    res.status(code).json({
        success: false,
        msg
    });
}

export function getErrorMsg(error: z.ZodError) {
    return "API schema validation failed:\n" + error.issues.map(issue => {
        return `${issue.path.join(".")} ${issue.message}`;
    }).join("\n");
}

/**
 * Checks if the given data matches the schema. If the data is valid, it
 * will be returned as the type specified in the schema. If the data is
 * invalid, an error will be thrown with the validation error message.
 *
 * @param data The data to validate
 * @param schema The schema to validate against
 * @returns The validated data, or throws an error if the data is invalid
 */
export function checkSchema<T extends z.ZodType<unknown>>(data: unknown, schema: T) {
    const result = schema.safeParse(data);
    if (result.success) {
        return result.data as (T extends z.ZodType<infer T> ? T : never);
    } else {
        throw new Error(getErrorMsg(result.error));
    }
}

/**
 * Handles a handshake request.
 *
 * @param req - The request object from the client.
 * @param res - The response object to send data back to the client.
 * @param sessionManager - Manages sessions for the API requests.
 *
 * @returns A promise that resolves when the request has been handled and a response has been sent.
 */
export async function handshake(req: Request, res: Response, sessionManager: SessionManger) {
    const userPublicKey = req.body.userPublicKey;
    const ip = req.ip;

    if (!userPublicKey && !disableCustomEncryptionLayer) {
        const msg = "Missing user's public key";
        rejectRequest(msg, req, res);
        return;
    }

    try {
        const { data, id } = handshakeBase(sessionManager, ip || "", disableCustomEncryptionLayer, userPublicKey);
        res.status(200).json({
            success: true,
            api_version: API_VERSION,
            data: disableCustomEncryptionLayer ? JSON.parse(data) : data
        });
        req.log.info({ handled: true, msg: "Handshake success", ip, sessionId: id, secure: disableCustomEncryptionLayer });
    }
    catch (e) {
        rejectRequest(String(e), req, res);
    }
}

export async function closeSession(req: Request, res: Response, sessionManager: SessionManger) {
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
}