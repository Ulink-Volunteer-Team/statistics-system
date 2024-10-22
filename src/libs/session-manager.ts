import crypto from 'crypto';
import { v7 as uuidV7 } from "uuid";
import { encryptRsa, decryptAes256, encryptAes256 } from './my-crypto';

type SessionInstanceType = {
    id: string;
    ip: string;
    key: string;
    userPublicKey: string;
    setupTime: number;
}

export function handshake(manager: SessionManger, userPublicKey: string, ip: string){
    const id = manager.createSession(ip, userPublicKey);
    const key = manager.sessions.get(id)!.key;
    return encryptRsa(JSON.stringify({id, key}), userPublicKey);
}

export class SessionManger {
    sessions: Map<string, SessionInstanceType>;
    constructor(){
        this.sessions = new Map();
    }

    createSession(ip: string, userPublicKey: string){
        const id = uuidV7();
        const key = crypto.randomBytes(32).toString('hex').concat(crypto.randomBytes(16).toString('hex')); // key-iv
        const setupTime = Date.now();
        this.sessions.set(id, {
            id,
            ip,
            key,
            userPublicKey,
            setupTime
        });
        return id;
    }

    getSessionData(id: string) {
        const session = this.sessions.get(id);
        if (!session) throw new Error("Fail to find the details of session " + id);
        return session;
    }

    getSessionKey(id: string) {
        const session = this.sessions.get(id);
        return session?.key;
    }

    decryptClientData(data: string, sessionID: string) {
        const session = this.sessions.get(sessionID);
        if (!session) throw new Error("Fail to find the details of session " + sessionID);
        try {
            const plain = decryptAes256(data, session.key);
            return JSON.parse(plain);
        }
        catch (e) {
            throw new Error("Fail to get the decrypted data: " + String(e));
        }
    }

    encryptClientData(data: any, sessionID: string) {
        const session = this.sessions.get(sessionID);
        if (!session) throw new Error("Fail to find the details of session " + sessionID);
        try {
            const encrypted = encryptAes256(JSON.stringify(data), session.key);
            return encrypted;
        }
        catch (e) {
            throw new Error("Fail to get the encrypted data: " + String(e));
        }
    }

    closeSession(id: string) {
        this.sessions.delete(id);
    }
}

export default SessionManger;
