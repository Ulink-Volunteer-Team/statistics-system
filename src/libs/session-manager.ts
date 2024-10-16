import crypto from 'crypto';
import { v7 as uuidV7 } from "uuid";
import { encryptRsa } from './my-crypto';

type SessionInstanceType = {
    id: string;
    ip: string;
    key: string;
    token: string;
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
            token: '',
            key,
            userPublicKey,
            setupTime
        });
        return id;
    }
}