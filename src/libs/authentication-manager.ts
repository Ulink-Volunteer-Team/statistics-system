import { DatabaseWrapper } from './sqlite-wrapper';
import bcrypt from 'bcrypt-fast';

type UserAccountType = {
    username: string;
    password: string;
}

export class AuthenticationManager {
    db: DatabaseWrapper;
    private static SALT_ROUNDS = 12;

    constructor() {
        this.db = new DatabaseWrapper('user_auth', {
            id: {
                type: "TEXT",
                primaryKey: true
            },
            password: {
                type: "TEXT",
                notNull: true
            }
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
     * Checks if a user exists with the matching username and password.
     * @param username The username to authenticate
     * @param password The plain-text password to check
     * @returns Whether a matching user is found
     */
    async haveMatchingUser(username: string, password: string): Promise<boolean> {
        const result = this.db.selectWhere<UserAccountType>([{ key: 'id', operator: '=', compared: username }]);
        if (result.length === 0) return false;

        const user = result[0];

        return await this.verifyHash(password, user.password);
    }

    /**
     * Checks if a user with the given username exists in the database.
     * @param username The username to check
     * @returns Whether the user exists
     */
    haveUser(username: string): boolean {
        const result = this.db.selectWhere<UserAccountType>([{ key: 'id', operator: '=', compared: username }]);
        return result.length > 0;
    }

    /**
     * Updates the password for a given user.
     * @param username The username whose password to update
     * @param password The new plain-text password
     */
    async updatePassword(username: string, password: string): Promise<void> {
        if (!this.haveUser(username)) {
            throw new Error(`User "${username}" does not exist`);
        }

        const hashedPassword = await this.generateHash(password);
        
        this.db.update(
            { password: hashedPassword }, 
            [{ key: 'id', operator: '=', compared: username }]
        );
    }

    /**
     * Adds a new user to the database with a hashed password.
     * @param username The username to add
     * @param password The plain-text password
     */
    async addUser(username: string, password: string): Promise<void> {
        if (this.haveUser(username)) {
            throw new Error(`User "${username}" already exists`);
        }

        const hashedPassword = await this.generateHash(password);

        this.db.insert({ id: username, password: hashedPassword });
    }

    /**
     * Deletes a user from the database.
     * @param username The username to delete
     */
    deleteUser(username: string): void {
        if (!this.haveUser(username)) {
            throw new Error(`User "${username}" does not exist`);
        }

        this.db.delete([{ key: 'id', operator: '=', compared: username }]);
    }
}
