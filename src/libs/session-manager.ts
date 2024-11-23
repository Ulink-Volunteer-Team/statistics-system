import crypto from 'crypto';
import {v7 as uuidV7} from "uuid";
import {decryptAes256, encryptAes256, encryptRsa} from '../utils/my-crypto';

type SessionInstanceType = {
    id: string;
    ip: string;
    key: string;
    userPublicKey?: string;
    setupTime: number;
    secure: boolean;
}

type ClientDataType = {
    [key: string]: unknown;
}

export function handshake(manager: SessionManger, ip: string, secure: boolean, userPublicKey?: string){
    if(!secure && !userPublicKey) throw new Error('Session must be encrypted, whether use the public key or use https (secure: true)');
    const id = manager.createSession(ip, secure, userPublicKey);
    return {
        data: secure ? JSON.stringify({id}) : encryptRsa(JSON.stringify({id, key: manager.getSessionKey(id)}), userPublicKey!),
        id
    };
}

export class SessionManger {
    readonly sessions: Map<string, SessionInstanceType>;
    constructor(){
        this.sessions = new Map();
    }

    /**
     * Creates a new session and stores it in the sessions map.
     * Returns the unique session ID generated for the session.
     * 
     * If the session is not encrypted, and the public key is not provided, an error is thrown.
     * 
     * @param ip - The IP address of the client initiating the session.
     * @param userPublicKey - The public key of the user for secure communication.
     * @returns The unique session ID generated for the session.
     */
    createSession(ip: string, secure = false, userPublicKey?: string) {
        if(!secure && !userPublicKey) {
            throw new Error('Session must be encrypted, whether use the public key or use https (secure: true)');
        }
        const id = uuidV7();
        const key = secure ? "" : crypto.randomBytes(32).toString('hex').concat(crypto.randomBytes(16).toString('hex')); // key-iv
        const setupTime = Date.now();
        this.sessions.set(id, {
            id,
            ip,
            key,
            userPublicKey,
            setupTime,
            secure
        });
        return id;
    }

    /**
     * Checks if a session with the given ID exists in the sessions map.
     * Returns true if the session exists, false otherwise.
     * @param id - The ID of the session to check.
     * @returns Whether the session exists.
     */
    haveSession(id: string) {
        try{
            return this.sessions.has(id);
        }
        catch {
            return false;
        }
    }

    /**
     * Gets the session data by ID.
     * 
     * @param id - The ID of the session to retrieve.
     * @returns The session data if found, otherwise throws an error.
     */
    getSessionData(id: string) {
        const session = this.sessions.get(id);
        if (!session) throw new Error("Fail to find the details of session " + id);
        return session;
    }

    /**
     * Retrieves the encryption key of a session by its ID.
     * 
     * @param id - The ID of the session to retrieve the key for.
     * @returns The encryption key if the session exists, undefined otherwise.
     */
    getSessionKey(id: string) {
        const session = this.sessions.get(id);
        return session?.key;
    }

    /**
     * Decrypts the given data using the key of the given session ID.
     * 
     * @param data - The encrypted data to decrypt.
     * @param sessionID - The ID of the session to retrieve the key for.
     * @returns The decrypted data if the session exists, throws an error otherwise.
     */
    decryptClientData<T extends ClientDataType = ClientDataType>(data: string, sessionID: string) {
        if (!this.haveSession(sessionID)) throw new Error("Fail to find the details of session " + sessionID);
        if (this.sessions.get(sessionID)!.secure) {
            console.warn(`[SessionManager] Session ${sessionID} is encrypted, and it is not necessary to call decryptClientData.`);
            return JSON.parse(data);
        }
        const key = this.getSessionKey(sessionID);
        if (!key) throw new Error("Fail to find the details of session " + sessionID);
        try {
            const plain = decryptAes256(data, key);
            return JSON.parse(plain) as Partial<T>;
        }
        catch (e) {
            throw new Error("Fail to get the decrypted data: " + String(e));
        }
    }

    /**
     * Encrypts the given data using the key of the given session ID.
     * If the session is not found, it throws an error.
     * If the session is secure, it does not encrypt the data.
     * 
     * @param data - The data to encrypt.
     * @param sessionID - The ID of the session to retrieve the key for.
     * @returns The encrypted data if the session exists, throws an error otherwise.
     */
    encryptClientData<T extends ClientDataType = ClientDataType>(data: T, sessionID: string) {
        const session = this.sessions.get(sessionID);
        if (!session) throw new Error("Fail to find the details of session " + sessionID);
        if(session.secure) {
            console.warn(`[SessionManager] Session ${sessionID} is encrypted, and it is not necessary to call encryptClientData.`);
            return JSON.stringify(data);
        }
        try {
            return encryptAes256(JSON.stringify(data), session.key);
        }
        catch (e) {
            throw new Error("Fail to get the encrypted data: " + String(e));
        }
    }

    /**
     * Closes a session by removing it from the session map.
     * 
     * @param id - The ID of the session to close.
     */
    closeSession(id: string) {
        this.sessions.delete(id);
    }
}

export default SessionManger;
