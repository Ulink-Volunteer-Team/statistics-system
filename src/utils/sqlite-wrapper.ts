import { Database, SQLite3Error, QueryOptions, QueryResult, RunResult, Statement } from 'node-sqlite3-wasm';
import process from 'node:process';
import DeathEvent from './death-event';

export type AvailableDataTypeType = string | number | boolean | null;

export type WhereConditionItemType = {
    /** The column name */
    key: string;
    /** The comparison operator */
    operator: "=" | ">" | "<" | ">=" | "<=" | "!=" | "LIKE";
    /** The compared value */
    compared: AvailableDataTypeType;
    /** The logical operator. it will be ignored if its item comes first in the expression */
    logicalOperator: "AND" | "OR";
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
const checkSqlQueryIdentifierName = (characters: string) => {
    const allowedChars = /^[a-zA-Z0-9_]+$/;
    const singleStar = /\*$/;
    return allowedChars.test(characters) || singleStar.test(characters);
}

export class DatabaseWrapper {
    private db: Database;
    private tables: { [key: string]: TableFrameInitType } = {};
    private dbPath: string;
    private logger: Logger;
    cacheRecordMaximum: number = 512;
    private cachedStatements: Map<string, Statement> = new Map();
    private deathEvent: DeathEvent;

    /**
     * @param dbName The name of the database file, without extension.
     * @param dbDirectory Optional: directory path where the DB file will be saved.
     * @param logger Optional: logger for debugging.
     */
    constructor(dbName: string, dbDirectory: string = "./", deathEvent: DeathEvent, logger: Logger = { info: console.log, error: console.error }) {
        if (!global.process) {
            throw new Error("This method can only be used in Node.js");
        }
        if (!checkSqlQueryIdentifierName(dbName)) throw new Error(`Invalid characters in db name: ${dbName}`);

        this.dbPath = `${dbDirectory}${dbDirectory.endsWith("/") ? "" : "/"}${dbName}.db`;
        this.logger = logger;
        this.deathEvent = deathEvent;

        try {
            this.db = new Database(this.dbPath);
            this.logger.info(`DatabaseWrapper: Prepared database at ${this.dbPath}`);
        } catch (error) {
            this.logger.error(`DatabaseWrapper: Failed to prepare database: ${(error as SQLite3Error).message}`);
            throw new Error(`Failed to prepare database: ${(error as SQLite3Error).message}`);
        }

        this.deathEvent.addHandler(this.close.bind(this));
    }

    /**
     * @param tableName The name of the table.
     * @param frame An object where the keys are the column names and the values are the data types.
     * @description Creates a new table with the specified columns.
     */
    prepareTable(tableName: string, frame: TableFrameInitType) {
        return new Promise<void>((resolve, reject) => {
            if (!checkSqlQueryIdentifierName(tableName)) reject(`Invalid characters in table name: ${tableName}`);

            const command = `CREATE TABLE IF NOT EXISTS ${tableName} (\n${Object.keys(frame).map(key => {
                if (!DataTypeItems.includes(frame[key].type)) {
                    reject(`Invalid data type: ${frame[key]}`);
                }
                return `${key} ${frame[key].type}${frame[key].notNull ? " NOT NULL" : ""}${frame[key].primaryKey ? " PRIMARY KEY" : ""}${frame[key].defaultValue !== undefined ? ` DEFAULT ${JSON.stringify(frame[key].defaultValue)}` : ""}`;
            }).join(",\n")}\n)`;

            try { this.db.run(command); }
            catch (error) {
                this.logger.error(`DatabaseWrapper: Failed get table prepared due to: ${(error as SQLite3Error).message}`);
                reject(`Failed get table prepared due to: ${(error as SQLite3Error).message}`);
            }
            this.tables[tableName] = frame; // Store table schema for later use
            this.logger.info(`DatabaseWrapper: Table "${tableName}" ready`);
            resolve()
        });
    }

    deleteTable(tableName: string) {
        return new Promise<void>((resolve, reject) => {
            if(!this.tables[tableName]) reject(`Table ${tableName} does not exist`);
            if(!checkSqlQueryIdentifierName(tableName)) reject(`Invalid characters in table name: ${tableName}`);
            try {
                this.db.run(`DROP TABLE IF EXISTS ${tableName}`);
                delete this.tables[tableName];
                this.logger.info(`DatabaseWrapper: Table "${tableName}" deleted`);
                resolve();
            } catch (error) {
                this.logger.error(`DatabaseWrapper: Failed to delete table: ${(error as SQLite3Error).message}`);
                reject(`Failed to delete table: ${(error as SQLite3Error).message}`);
            }
        });
    }

    private retrieveCache(query: string): Statement | undefined { 
        return this.cachedStatements.get(query);
    }

    private recordCache(query: string, statement: Statement) {
        this.cachedStatements.set(query, statement);
    }

    private freeCache() {
        this.cachedStatements.forEach((statement) => statement.finalize());
        this.cachedStatements.clear();
    }

    private cacheSizeGuard(){
        if(this.cachedStatements.size > this.cacheRecordMaximum){
            this.freeCache();
        }
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
                const cached = this.retrieveCache(query);
                if (cached) return resolve(cached.run(params));

                const statement = this.db.prepare(query);
                const result = statement.run(params);

                this.cacheSizeGuard();
                this.recordCache(query, statement);
                // statement.finalize(); // must be added to prevent memory leak
                resolve(result);
            } catch (error) {
                this.logger.error(`DatabaseWrapper: Failed to run query: ${(error as SQLite3Error).message}`);
                reject(`SQL error: ${(error as SQLite3Error).message}`);
            }
        });
    }

    private runQuery<T extends QueryResult = any>(query: string, params: AvailableDataTypeType[] = [], options: QueryOptions = {}) {
        return new Promise<T[]>((resolve, reject) => {
            try {
                const cached = this.retrieveCache(query);
                if (cached) return resolve(cached.all(params, options) as T[]);

                const statement = this.db.prepare(query);
                const result = statement.all(params, options);

                this.cacheSizeGuard();
                this.recordCache(query, statement);
                //statement.finalize(); // must be added to prevent memory leak
                resolve(result as T[]);
            } catch (error) {
                this.logger.error(`DatabaseWrapper: Failed to run query: ${(error as SQLite3Error).message}`);
                reject(`SQL error: ${(error as SQLite3Error).message}`);
            }
        })
    }

    private getConditionStr(conditions: WhereConditionItemType[]) {
        if (conditions.length === 0) return "";
        return ` WHERE ${conditions.map((condition, index) => {
            if (!checkSqlQueryIdentifierName(condition.key)) throw new Error(`Invalid characters in column name: ${condition.key}`);
            return ` ${index >= 1 ? condition.logicalOperator : ""} ${condition.key} ${condition.operator} ?`;
        }).join(" AND ")}`;
    }

    /**
     * Fetches data from the specified table based on the given conditions.
     * 
     * @param tableName The name of the table to query from.
     * @param conditions An array of conditions to filter the data by.
     * @returns An array of objects representing the fetched data.
     * @throws If there is an error fetching the filtered data.
     */
    select<T extends QueryResult = any>(tableName: string, columns: string[], conditions: WhereConditionItemType[] = [], limit: number = 0, offset = 0) {
        return new Promise<T[]>((resolve, reject) => {
            if(!this.tables[tableName]) reject(`Table ${tableName} not found.`);
            if (!checkSqlQueryIdentifierName(tableName)) reject(`Invalid characters in table name: ${tableName}`);
            columns.forEach(c => {
                if(!checkSqlQueryIdentifierName(c)) reject(`Invalid characters in column name: ${c}`);
            })

            let queryStr = `SELECT ${columns.join(",")} FROM ${tableName}`;
            const param = conditions.map(condition => condition.compared);

            if (conditions.length > 0) queryStr += this.getConditionStr(conditions);
            if (limit > 0) {
                queryStr += ` LIMIT ?`;
                param.push(limit);
            }
            if (offset > 0) {
                queryStr += ` OFFSET ?`;
                param.push(offset);
            }
            
            this.runQuery<T>(queryStr, param)
                .then(result => resolve(result))
                .catch(error => {
                    const msg = `Failed to fetch filtered data from ${tableName}: ${(error as SQLite3Error).message}`;
                    this.logger.error("DatabaseWrapper: " + msg);
                    reject(msg);
                });
        })
    }


    /**
     * @description Inserts a new row into the table.
     * @param dataFrame An object with the column names as keys and the values to insert as values.
     * @throws If there is an error inserting the data.
     */
    insert(tableName: string, dataFrame: TableFrameDataType[]) {
        return new Promise<RunResult>((resolve, reject) => {
            if (!this.tables[tableName]) reject(`Table ${tableName} does not exist`);
            if (!checkSqlQueryIdentifierName(tableName)) reject(`Invalid characters in table name: ${tableName}`);

            const queryStr = `INSERT INTO ${tableName} (${Object.keys(dataFrame[0]).map(key => {
                if (!checkSqlQueryIdentifierName(key)) reject(`Invalid characters in column name: ${key}`);
                return key;
            }).join(", ")}) VALUES `;

            const valuesStr = dataFrame.map(item => {
                return `(${(new Array(Object.keys(item).length)).fill("?").join(", ")})`;
            }).join(", ");

            this.runCommand(queryStr + valuesStr, dataFrame.map(item => Object.values(item)).flat())
                .then(result => resolve(result))
                .catch(error => {
                    const msg = `Database error in table "${tableName}": ${(error as SQLite3Error).message}`;
                    this.logger.error("DatabaseWrapper: " + msg);
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
            if(!checkSqlQueryIdentifierName(tableName)) reject(`Invalid characters in table name: ${tableName}`);

            const keys = Object.keys(dataFrame);
            const values = Object.values(dataFrame);

            const queryStr = `UPDATE ${tableName} SET ${keys.map(key => {
                if (!checkSqlQueryIdentifierName(key)) reject(`Invalid characters in column name: ${key}`);
                return `${key} = ?`;
            }).join(", ")}` + this.getConditionStr(conditions);

            this.runCommand(queryStr, values.concat(conditions.map(c => c.compared)))
                .then(result => resolve(result))
                .catch(error => {
                    const msg = `Failed to update data in ${tableName}: ${(error as SQLite3Error).message}`;
                    this.logger.error("DatabaseWrapper: " + msg);
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
            if(!checkSqlQueryIdentifierName(tableName)) reject(`Invalid characters in table name: ${tableName}`);

            const queryStr = `DELETE FROM ${tableName}` + this.getConditionStr(conditions);

            this.runCommand(queryStr, conditions.map(c => c.compared))
                .then(result => resolve(result))
                .catch(error => {
                    const msg = `Failed to delete data from ${tableName}: ${(error as SQLite3Error).message}`;
                    this.logger.error("DatabaseWrapper: " + msg);
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
            this.logger.error(`DatabaseWrapper: Failed to begin transaction: ${(error as SQLite3Error).message}`);
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
            this.logger.error(`DatabaseWrapper: Failed to commit transaction: ${(error as SQLite3Error).message}`);
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
            this.logger.error(`DatabaseWrapper: Failed to rollback transaction: ${(error as SQLite3Error).message}`);
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
            this.freeCache();
            this.db.close();
            this.logger.info(`DatabaseWrapper: Closed database connection to "${this.dbPath}"`);
            return true
        } catch (error) {
            this.logger.error(`DatabaseWrapper: Failed to close database: ${(error as SQLite3Error).message}`);
            return false;
        }
    }
}

export default DatabaseWrapper;
