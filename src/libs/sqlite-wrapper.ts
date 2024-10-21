import { Database, SQLite3Error, QueryOptions, QueryResult, RunResult } from 'node-sqlite3-wasm';
import process from 'node:process';

export type AvailableDataTypeType = string | number | boolean | null;

export type WhereConditionItemType = {
    /** The column name */
    key: string;
    /** The comparison operator */
    operator: "=" | ">" | "<" | ">=" | "<=" | "!=" | "LIKE";
    /** The compared value */
    compared: AvailableDataTypeType;
}

export type Logger = {
    info: (message: string) => void;
    error: (message: string) => void;
};

export type DataTypesSqlType = "NULL" | "INTEGER" | "REAL" | "TEXT" | "BOOLEAN";
export const DataTypeItems = ["NULL", "INTEGER", "REAL", "TEXT", "BOOLEAN"];

export type TableFrameInitType = {
    [key: string]: {
        /** Data type of the column, in SQLite */
        type: DataTypesSqlType;
        /** Whether the column is a primary key */
        primaryKey?: boolean;
        /** Whether the column is not null */
        notNull?: boolean;
        /** The default value of the column */
        defaultValue?: string | number | boolean | null;
    }
}

export type TableFrameDataType = {
    [key: string]: string | number | boolean | null;
}

/** constrain the characters to prevent the injection attack */
const allowedCharacters = (characters: string) => {
    const allowedChars = /^[a-zA-Z0-9_]+$/;
    return allowedChars.test(characters);
}

/** Throw an error if the string contains invalid characters */
const unwrapForCharacterIssue = (str: string, logger: Logger) => {
    if (!allowedCharacters(str)) {
        logger.error(`Invalid characters in: ${str}`);
        throw new Error(`Invalid characters in: ${str}`);
    }
}

export class DatabaseWrapper {
    private db: Database;
    private tables: { [key: string]: TableFrameInitType } = {};
    private dbPath: string;
    private logger: Logger;

    /**
     * @param name The name of the database file, without extension.
     * @param frame An object where the keys are the column names and the values are the data types.
     * @param dbDirectory Optional: the directory path where the DB file will be saved.
     * @description Creates a new SQLite database and a table with the given columns. The table will be created only if it doesn't exist already.
     */
    /**
     * @param dbName The name of the database file, without extension.
     * @param dbDirectory Optional: directory path where the DB file will be saved.
     * @param logger Optional: logger for debugging.
     */
    constructor(dbName: string, dbDirectory: string = "./", logger: Logger = { info: console.log, error: console.error }) {
        if (!global.process) {
            throw new Error("This method can only be used in Node.js");
        }
        if (!allowedCharacters(dbName)) throw new Error(`Invalid characters in db name: ${dbName}`);

        this.dbPath = `${dbDirectory}${dbDirectory.endsWith("/") ? "" : "/"}${dbName}.db`;
        this.logger = logger;

        try {
            this.db = new Database(this.dbPath);
            this.logger.info(`Initialized database at ${this.dbPath}`);
        } catch (error) {
            this.logger.error(`Failed to initialize database: ${(error as SQLite3Error).message}`);
            throw new Error(`Failed to initialize database: ${(error as SQLite3Error).message}`);
        }

        process.on("exit", () => this.close());
    }

    /**
     * @param tableName The name of the table.
     * @param frame An object where the keys are the column names and the values are the data types.
     * @description Creates a new table with the specified columns.
     */
    prepareTable(tableName: string, frame: TableFrameInitType) {
        return new Promise<void>((resolve, reject) => {
            if (!allowedCharacters(tableName)) reject(`Invalid characters in table name: ${tableName}`);

            const command = `CREATE TABLE IF NOT EXISTS ${tableName} (\n${Object.keys(frame).map(key => {
                if (!DataTypeItems.includes(frame[key].type)) {
                    reject(`Invalid data type: ${frame[key]}`);
                }
                return `${key} ${frame[key].type}${frame[key].notNull ? " NOT NULL" : ""}${frame[key].primaryKey ? " PRIMARY KEY" : ""}${frame[key].defaultValue !== undefined ? ` DEFAULT ${JSON.stringify(frame[key].defaultValue)}` : ""}`;
            }).join(",\n")}\n)`;

            try { this.db.run(command); }
            catch (error) {
                this.logger.error(`Failed to create table: ${(error as SQLite3Error).message}`);
                reject(`Failed to create table: ${(error as SQLite3Error).message}`);
            }
            this.tables[tableName] = frame; // Store table schema for later use
            this.logger.info(`Table ${tableName} created`);
            resolve()
        });
    }

    /**
     * @description Runs a SQL query with the given parameters.
     * @param query The SQL query to run.
     * @param params An array of parameters to pass to the query.
     * @returns The result of the query.
     * @throws If there is an error running the query.
     */
    private runCommand(query: string, params: any[] = []) {
        return new Promise<RunResult>((resolve, reject) => {
            try {
                const statement = this.db.prepare(query);
                const result = statement.run(params);
                statement.finalize(); // must be added to prevent memory leak
                resolve(result);
            } catch (error) {
                this.logger.error(`Failed to run query: ${(error as SQLite3Error).message}`);
                reject(`SQL error: ${(error as SQLite3Error).message}`);
            }
        });
    }

    private runQuery<T extends QueryResult = any>(query: string, params: AvailableDataTypeType[] = [], options: QueryOptions = {}) {
        return new Promise<T[]>((resolve, reject) => {
            try {
                const statement = this.db.prepare(query);
                const result = statement.all(params, options);
                statement.finalize(); // must be added to prevent memory leak
                resolve(result as T[]);
            } catch (error) {
                this.logger.error(`Failed to run query: ${(error as SQLite3Error).message}`);
                reject(`SQL error: ${(error as SQLite3Error).message}`);
            }
        })
    }

    /**
     * Fetches data from the specified table based on the given conditions.
     * 
     * @param tableName The name of the table to query from.
     * @param conditions An array of conditions to filter the data by.
     * @returns An array of objects representing the fetched data.
     * @throws If there is an error fetching the filtered data.
     */
    select<T extends QueryResult = any>(tableName: string, conditions: WhereConditionItemType[] = [], limit: number = 0) {
        return new Promise<T[]>((resolve, reject) => {
            if(!this.tables[tableName]) reject(`Table ${tableName} not found.`);
            if (!allowedCharacters(tableName)) reject(`Invalid characters in table name: ${tableName}`);

            let queryStr = `SELECT * FROM ${tableName}`;
            if (conditions.length > 0) {
                queryStr += ` WHERE ${conditions.map(condition => {
                    if (!allowedCharacters(condition.key)) reject(`Invalid characters in column name: ${condition.key}`);
                    return `${condition.key} ${condition.operator} ?`;
                }).join(" AND ")}`;
            }

            if (limit > 0) queryStr += ` LIMIT ${limit}`;

            const param = conditions.map(condition => condition.compared);
            this.runQuery<T>(queryStr, param)
                .then(result => resolve(result))
                .catch(error => {
                    const msg = `Failed to fetch filtered data from ${tableName}: ${(error as SQLite3Error).message}`;
                    this.logger.error(msg);
                    reject(msg);
                });
        })
    }


    /**
     * @description Inserts a new row into the table.
     * @param frame An object with the column names as keys and the values to insert as values.
     * @throws If there is an error inserting the data.
     */
    insert(tableName: string, frame: TableFrameDataType) {
        return new Promise<RunResult>((resolve, reject) => {
            if (!this.tables[tableName]) reject(`Table ${tableName} does not exist`);
            if (!allowedCharacters(tableName)) reject(`Invalid characters in table name: ${tableName}`);

            const keys = Object.keys(frame);
            const values = Object.values(frame);

            const queryStr = `INSERT INTO ${tableName} (${keys.map(key => {
                if (!allowedCharacters(key)) reject(`Invalid characters in column name: ${key}`);
                return key;
            }).join(", ")}) VALUES (${keys.map(() => "?").join(", ")})`;

            this.runCommand(queryStr, values)
                .then(result => resolve(result))
                .catch(error => {
                    const msg = `Database error in table "${tableName}": ${(error as SQLite3Error).message}`;
                    this.logger.error(msg);
                    reject(msg);
                });
        });
    }

    /**
     * @description Updates rows in the specified table where the conditions are met.
     * @param tableName The name of the table to update.
     * @param dataFrame An object representing the column names and the new values to update.
     * @param conditions An array of conditions to determine which rows to update.
     * @throws If there is an error updating the data.
     */
    update(tableName: string, dataFrame: TableFrameDataType, conditions: WhereConditionItemType[]) {
        return new Promise<RunResult>((resolve, reject) => {
            if (!this.tables[tableName]) reject(`Table ${tableName} does not exist`);
            if(!allowedCharacters(tableName)) reject(`Invalid characters in table name: ${tableName}`);

            const keys = Object.keys(dataFrame);
            const values = Object.values(dataFrame);

            const queryStr = `UPDATE ${tableName} SET ${keys.map(key => {
                if (!allowedCharacters(key)) reject(`Invalid characters in column name: ${key}`);
                return `${key} = ?`;
            }).join(", ")} WHERE ${conditions.map(condition => {
                if (!allowedCharacters(condition.key)) reject(`Invalid characters in column name: ${condition.key}`);
                return `${condition.key} ${condition.operator} ?`;
            }).join(" AND ")}`;

            this.runCommand(queryStr, values.concat(conditions.map(c => c.compared)))
                .then(result => resolve(result))
                .catch(error => {
                    const msg = `Failed to update data in ${tableName}: ${(error as SQLite3Error).message}`;
                    this.logger.error(msg);
                    reject(msg);
                });
        });
    }


    /**
     * Deletes rows from the specified table where the conditions are met.
     * 
     * @param tableName The name of the table to delete from.
     * @param conditions An array of conditions to determine which rows to delete.
     * @throws If there is an error deleting the data.
     */
    delete(tableName: string, conditions: WhereConditionItemType[]) {
        return new Promise<RunResult>((resolve, reject) => {
            if(!this.tables[tableName]) reject(`Table ${tableName} does not exist`);
            if(!allowedCharacters(tableName)) reject(`Invalid characters in table name: ${tableName}`);

            const queryStr = `DELETE FROM ${tableName} WHERE ${conditions.map(condition => {
                if (!allowedCharacters(condition.key)) reject(`Invalid characters in column name: ${condition.key}`);
                return `${condition.key} ${condition.operator} ?`;
            }).join(" AND ")}`;

            this.runCommand(queryStr, conditions.map(c => c.compared))
                .then(result => resolve(result))
                .catch(error => {
                    const msg = `Failed to delete data from ${tableName}: ${(error as SQLite3Error).message}`;
                    this.logger.error(msg);
                    reject(msg);
                });
        })
    }

    /**
     * Begins a new transaction.
     * 
     * This method will throw an error if a transaction is already in progress.
     * 
     * @throws If there is an error beginning the transaction.
     */

    beginTransaction() {
        try {
            this.db.run("BEGIN TRANSACTION");
        } catch (error) {
            this.logger.error(`Failed to begin transaction: ${(error as SQLite3Error).message}`);
            throw new Error(`Failed to begin transaction: ${(error as SQLite3Error).message}`);
        }
    }

    /**
     * Commits the current transaction.
     * 
     * This method will throw an error if no transaction is in progress.
     * 
     * @throws If there is an error committing the transaction.
     */
    commitTransaction() {
        try {
            this.db.run("COMMIT");
        } catch (error) {
            this.logger.error(`Failed to commit transaction: ${(error as SQLite3Error).message}`);
            throw new Error(`Failed to commit transaction: ${(error as SQLite3Error).message}`);
        }
    }

    /**
     * Rolls back the current transaction.
     * 
     * This method will throw an error if no transaction is in progress.
     * 
     * @throws If there is an error rolling back the transaction.
     */
    rollbackTransaction() {
        try {
            this.db.run("ROLLBACK");
        } catch (error) {
            this.logger.error(`Failed to rollback transaction: ${(error as SQLite3Error).message}`);
            throw new Error(`Failed to rollback transaction: ${(error as SQLite3Error).message}`);
        }
    }

    /**
     * Closes the database.
     * 
     * @throws If there is an error closing the database.
     */
    close() {
        try {
            this.db.close();
            this.logger.info(`Closed database connection to ${this.dbPath}`);
        } catch (error) {
            this.logger.error(`Failed to close database: ${(error as SQLite3Error).message}`);
            throw new Error(`Failed to close database: ${(error as SQLite3Error).message}`);
        }
    }
}

export default DatabaseWrapper;
