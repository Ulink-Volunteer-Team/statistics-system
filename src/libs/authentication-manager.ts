import { DatabaseWrapper } from '../utils/sqlite-wrapper';
import bcrypt from 'bcrypt-fast';
import * as jwt from 'jsonwebtoken';

type UserAccountType = {
    id: string;
    password: string;
    permissions: string;
}

const SECRET_KEY = String(process.env.SIGN_KEY);

export class AuthenticationManager {
    db: DatabaseWrapper;
    private static SALT_ROUNDS = 12;
    tableName = "authentication";

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
        if (!this.haveUser(id)) return Promise.reject(`Cannot find user ${id}.`);
        if (!this.haveMatchingUser(id, password)) Promise.reject(`Wrong password`);

        const token = this.generateToken(id);
        return token;
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
        if (!this.haveUser(id)) {
            return Promise.reject(`User "${id}" does not exist`);
        }

        const hashedPassword = await this.generateHash(password);

        this.db.update(
            this.tableName, 
            { password: hashedPassword },
            [{ key: 'id', operator: '=', compared: id, logicalOperator: 'AND' }]
        );
    }

    /**
     * Adds a new user to the database with a hashed password.
     * @param id The id to add
     * @param password The plain-text password
     */
    async addUser(id: string, password: string, permissions: string): Promise<void> {
        if (await this.haveUser(id)) {
            return Promise.reject(`User "${id}" already exists`);
        }

        const hashedPassword = await this.generateHash(password);

        this.db.insert(this.tableName, [{ id: id, password: hashedPassword, permissions }]);
    }

    async getUserPermissions(id: string): Promise<string> {
        const users = await this.db.select<UserAccountType>(this.tableName, ["*"], [{ key: 'id', operator: '=', compared: id, logicalOperator: 'AND' }]);
        if(!users) return Promise.reject(`User "${id}" does not exist`);
        return Promise.resolve(users[0].permissions);
    }

    /**
     * Deletes a user from the database.
     * @param id The id to delete
     */
    deleteUser(id: string): void {
        if (!this.haveUser(id)) {
            throw new Error(`User "${id}" does not exist`);
        }

        this.db.delete(this.tableName, [{ key: 'id', operator: '=', compared: id, logicalOperator: 'AND' }]);
    }
}

export default AuthenticationManager;
