import { APIHandlerConstructor } from "./base";
import { z } from "zod";

export const signIn = APIHandlerConstructor(
    "sign-in",
    z.object({
        id: z.string(),
        password: z.string(),
    }),
    (async ({ id, password }, dataSource, sessionID, sessionUserIDMap) => {
        const token = await dataSource.authenticationManager.login(id, password);
        sessionUserIDMap.set(sessionID, id);
        return { token };
    })
);

export const signUp = APIHandlerConstructor(
    "sign-up",
    z.object({
        id: z.string(),
        password: z.string(),
        permissions: z.string(),
    }),
    (async ({ id, password, permissions }, dataSource, sessionID, sessionUserIDMap) => {
        return new Promise((resolve, reject) => {
            dataSource.authenticationManager.addUser(id, password, permissions)
                .then(() => {
                    sessionUserIDMap.set(sessionID, id);
                    resolve();
                })
                .catch((e) => reject(e));
        });
    })
);

export const signOut = APIHandlerConstructor(
    "sign-out",
    z.object({
        id: z.string(),
    }),
    (async (_1, _2, sessionID, sessionUserIDMap) => {
        sessionUserIDMap.delete(sessionID);
    })
);

export default [
    signIn,
    signUp,
    signOut
]
