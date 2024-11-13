import {DatabaseWrapper} from '../utils/sqlite-wrapper';
import bcrypt from 'bcrypt-fast';
import * as jwt from 'jsonwebtoken';

type UserAccountType = {
    id: string;
    password: string;
    permissions: string;
}

const SECRET_KEY = String(process.env.SIGN_KEY);
const SALT_ROUNDS = Number(process.env.SALT_ROUNDS || "12");

export class AuthenticationManager {
    db: DatabaseWrapper;
    private static SALT_ROUNDS = SALT_ROUNDS;
    readonly tableName = "authentication";

    /**
     * Constructs a new AuthenticationManager instance.
     * @param db The DatabaseWrapper instance to be used for database operations.
     * @param initCallback A callback function to be called after the database table is ready.
     */
    constructor(db: DatabaseWrapper, initCallback?: () => void) {
        this.db = db;
        this.db.prepareTable(this.tableName, {
            id: {
                type: "TEXT",
                primaryKey: true
            },
            password: {
                type: "TEXT",
                notNull: true
            },
            permissions: {
                type: "TEXT",
                notNull: true
            }
        }).then(() => {
            if(initCallback) initCallback();
        });
    }

    /**
     * Generates a hash from the password using bcrypt
     * @param password The plain-text password
     * @returns Hashed password
     */
    async generateHash(password: string) {
        return bcrypt.hash(password, AuthenticationManager.SALT_ROUNDS);
    }

    /**
     * Verifies if the given password matches the given hash.
     * @param password The plain-text password to verify
     * @param hash The hash to compare against
     * @returns Whether the password matches the hash
     */
    async verifyHash(password: string, hash: string) {
        return bcrypt.verify(password, hash);
    }

    /**
     * Checks if a user exists with the matching id and password.
     * @param id The id to authenticate
     * @param password The plain-text password to check
     * @returns Whether a matching user is found
     */
    async haveMatchingUser(id: string, password: string): Promise<boolean> {
        const result = await this.db.select<UserAccountType>(this.tableName, ["*"], [{ key: 'id', operator: '=', compared: id, logicalOperator: 'AND' }]);
        if (result.length === 0) return false;

        const user = result[0];

        return await this.verifyHash(password, user.password);
    }

    /**
    * Login a user, returns the token
    * @param id The id to login
    * @param password The corresponding password
    * @returns Token generated, expires in 1 day
    */
    async login(id: string, password: string): Promise<string> {
        if (!await this.haveUser(id)) return Promise.reject(`Cannot find user ${id}.`);
        if (!await this.haveMatchingUser(id, password)) await Promise.reject(`Wrong password`);

        return this.generateToken(id);
    }

    /**
     * Generates a JWT token for the user with the given payload.
     * @param payload The payload (id) to sign
     * @param expiresIn The expiration time for the token (default 1 day)
     * @returns The generated token
     */
    generateToken(payload: string, expiresIn = '1d'): string {
        return jwt.sign({ id: payload }, SECRET_KEY, { expiresIn });
    }


    /**
     * Verifies that a given token matches the given payload （the id).
     * @param payload The expected payload of the token
     * @param token The token to verify
     * @returns Whether the token matches the payload
     */
    verifyToken(payload: string, token: string): boolean {
        try {
            const tokenContent = jwt.verify(token, SECRET_KEY) as jwt.JwtPayload;
            return (payload === tokenContent.id && tokenContent.exp! > (Date.now() / 1000));
        }
        catch {
            return false;
        }
    }

    /**
     * Checks if a user with the given id exists in the database.
     * @param id The id to check
     * @returns Whether the user exists
     */
    async haveUser(id: string): Promise<boolean> {
        const result = await this.db.select<UserAccountType>(this.tableName, ["*"], [{ key: 'id', operator: '=', compared: id, logicalOperator: 'AND' }]);
        return result.length > 0;
    }

    /**
     * Updates the password for a given user.
     * @param id The id whose password to update
     * @param password The new plain-text password
     */
    async updatePassword(id: string, password: string): Promise<void> {
        if (!await this.haveUser(id)) {
            return Promise.reject(`User "${id}" does not exist`);
        }

        const hashedPassword = await this.generateHash(password);

        await (this.db.update(
            this.tableName,
            {password: hashedPassword},
            [{key: 'id', operator: '=', compared: id, logicalOperator: 'AND'}]
        ));
    }

    /**
     * Adds a new user to the database with a hashed password.
     * @param id The id to add
     * @param password The plain-text password
     * @param permissions The permission of the user (not implemented)
     */
    async addUser(id: string, password: string, permissions: string): Promise<void> {
        if (await this.haveUser(id)) {
            return Promise.reject(`User "${id}" already exists`);
        }

        const hashedPassword = await this.generateHash(password);

        await this.db.insert(this.tableName, [{id: id, password: hashedPassword, permissions}]);
    }

    /**
     * Retrieves the permissions of a user
     * @param id The id of the user whose permissions to retrieve
     * @returns The permission of the user, or a rejected promise if the user does not exist
     */
    async getUserPermissions(id: string): Promise<string> {
        const users = await this.db.select<UserAccountType>(this.tableName, ["*"], [{ key: 'id', operator: '=', compared: id, logicalOperator: 'AND' }]);
        if(!users) return Promise.reject(`User "${id}" does not exist`);
        return Promise.resolve(users[0].permissions);
    }

    /**
     * Deletes a user from the database.
     * @param id The id to delete
     */
    async deleteUser(id: string): Promise<void> {
        if (!await this.haveUser(id)) {
            throw new Error(`User "${id}" does not exist`);
        }

        await this.db.delete(this.tableName, [{ key: 'id', operator: '=', compared: id, logicalOperator: 'AND' }]);
    }
}

export default AuthenticationManager;
