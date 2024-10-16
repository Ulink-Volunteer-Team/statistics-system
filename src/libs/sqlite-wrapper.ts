import { Database } from 'node-sqlite3-wasm';

export type WhereConditionItemType = {
    /** The column name */
    key: string;
    /** The comparison operator */
    operator: "=" | ">" | "<" | ">=" | "<=" | "!=" | "LIKE";
    /** The compared value */
    compared: string | number | boolean;
}

export type DataTypes = "NULL" | "INTEGER" | "REAL" | "TEXT" | "BOOLEAN";
export const DataTypeItems = ["NULL", "INTEGER", "REAL", "TEXT", "BOOLEAN"];

export type TableFrameInitType = {
    [key: string]: {
        /** Data type of the column, in SQLite */
        type: DataTypes;
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

export const allowedCharacters = (characters: string) => {
    const allowedChars = /^[a-zA-Z0-9_]+$/;
    return allowedChars.test(characters);
}

export class DatabaseWrapper {
    private db: Database;
    private name: string;
    private dbPath: string;

    /**
     * @param name The name of the database file, without extension.
     * @param frame An object where the keys are the column names and the values are the data types.
     * @param dbDirectory Optional: the directory path where the DB file will be saved.
     * @description Creates a new SQLite database and a table with the given columns. The table will be created only if it doesn't exist already.
     */
    constructor(name: string, frame: TableFrameInitType, dbDirectory: string = "./") {
        if (!global.process) {
            throw new Error("This method can only be used in Node.js");
        }
        if (!allowedCharacters(name)) {
            throw new Error(`Invalid characters in table name: ${name}`);
        }

        this.name = name;
        this.dbPath = `${dbDirectory}${dbDirectory[dbDirectory.length - 1] === "/" ? "" : "/"}${name}.db`;

        try {
            this.db = new Database(this.dbPath);
        } catch (error) {
            throw new Error(`Failed to initialize database: ${error.message}`);
        }

        // Build CREATE TABLE command
        const command = `CREATE TABLE IF NOT EXISTS ${name} (\n${Object.keys(frame).map(key => {
            if (!allowedCharacters(key)) {
                throw new Error(`Invalid characters in column name: ${key}`);
            }
            if (!DataTypeItems.includes(frame[key].type)) {
                throw new Error(`Invalid data type: ${frame[key]}`);
            }
            return `\t${key} ${frame[key].type}${frame[key].notNull ? " NOT NULL" : ""}${frame[key].primaryKey ? " PRIMARY KEY" : ""}${frame[key].defaultValue !== undefined ? ` DEFAULT ${JSON.stringify(frame[key].defaultValue)}` : ""}`;
        }).join(",\n")}\n)`;

        try {
            this.db.run(command);
        } catch (error) {
            throw new Error(`Failed to create table: ${error.message}`);
        }

        if (global.process) {
            process.on('exit', () => this.close());
        }
    }

    /**
     * @description Runs a SQL query with the given parameters.
     * @param query The SQL query to run.
     * @param params An array of parameters to pass to the query.
     * @returns The result of the query.
     * @throws If there is an error running the query.
     */
    private prepareQuery(query: string, params: any[] = []) {
        try {
            const statement = this.db.prepare(query);
            return statement.run(params);
        } catch (error) {
            throw new Error(`SQL error: ${error.message}`);
        }
    }

    /**
     * @description Fetches all data from the table.
     * @returns The result of the query as an array of objects.
     * @throws If there is an error running the query.
     */
    selectAll<T = any>() {
        try {
            const query = this.db.prepare(`SELECT * FROM ${this.name}`);
            const result = query.all();
            query.finalize();
            return result as T[];
        } catch (error) {
            throw new Error(`Failed to fetch all data: ${error.message}`);
        }
    }

    /**
     * Fetches data from the table based on the specified conditions.
     * 
     * @param conditions An array of conditions to filter the data by.
     * @returns An array of objects representing the fetched data.
     * @throws If there is an error fetching the filtered data.
     */
    selectWhere<T = any>(conditions: WhereConditionItemType[]) {
        const queryStr = `SELECT * FROM ${this.name} WHERE ${conditions.map(condition => {
            if (!allowedCharacters(condition.key)) {
                throw new Error(`Invalid characters in column name: ${condition.key}`);
            }
            return `${condition.key} ${condition.operator} ?`;
        }).join(" AND ")}`;

        try {
            const query = this.db.prepare(queryStr);
            const result = query.all(conditions.map(condition => condition.compared));
            query.finalize();
            return result as T[];
        } catch (error) {
            throw new Error(`Failed to fetch filtered data: ${error.message}`);
        }
    }

    /**
     * @description Inserts a new row into the table.
     * @param frame An object with the column names as keys and the values to insert as values.
     * @throws If there is an error inserting the data.
     */
    insert(frame: { [key: string]: string | number | boolean | null }) {
        const keys = Object.keys(frame);
        const values = Object.values(frame);

        const queryStr = `INSERT INTO ${this.name} (${keys.map(key => {
            if (!allowedCharacters(key)) {
                throw new Error(`Invalid characters in column name: ${key}`);
            }
            return key;
        }).join(", ")}) VALUES (${keys.map(() => "?").join(", ")})`;

        try {
            this.prepareQuery(queryStr, values);
        } catch (error) {
            throw new Error(`Failed to insert data: ${error.message}`);
        }
    }

    /**
     * @description Updates rows in the table where the specified conditions are met.
     * @param dataFrame An object representing the column names and the new values to update.
     * @param conditions An array of conditions to determine which rows to update.
     * @throws If there is an error updating the data.
     */
    update(dataFrame: TableFrameDataType, conditions: WhereConditionItemType[]) {
        const keys = Object.keys(dataFrame);
        const values = Object.values(dataFrame);

        const queryStr = `UPDATE ${this.name} SET ${keys.map(key => {
            if (!allowedCharacters(key)) {
                throw new Error(`Invalid characters in column name: ${key}`);
            }
            return `${key} = ?`;
        }).join(", ")} WHERE ${conditions.map(condition => {
            if (!allowedCharacters(condition.key)) {
                throw new Error(`Invalid characters in column name: ${condition.key}`);
            }
            return `${condition.key} ${condition.operator} ?`;
        }).join(" AND ")}`;

        try {
            this.prepareQuery(queryStr, values.concat(conditions.map(c => c.compared)));
        } catch (error) {
            throw new Error(`Failed to update data: ${error.message}`);
        }
    }

    /**
     * Deletes rows from the table where the specified conditions are met.
     * 
     * @param conditions An array of conditions to determine which rows to delete.
     * @throws If there is an error deleting the data.
     */
    delete(conditions: WhereConditionItemType[]) {
        const queryStr = `DELETE FROM ${this.name} WHERE ${conditions.map(condition => {
            if (!allowedCharacters(condition.key)) {
                throw new Error(`Invalid characters in column name: ${condition.key}`);
            }
            return `${condition.key} ${condition.operator} ?`;
        }).join(" AND ")}`;

        try {
            this.prepareQuery(queryStr, conditions.map(c => c.compared));
        } catch (error) {
            throw new Error(`Failed to delete data: ${error.message}`);
        }
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
            throw new Error(`Failed to begin transaction: ${error.message}`);
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
            throw new Error(`Failed to commit transaction: ${error.message}`);
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
            throw new Error(`Failed to rollback transaction: ${error.message}`);
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
            console.log(`Closed database: ${this.dbPath}`);
        } catch (error) {
            console.error(`Error closing database: ${error.message}`);
        }
    }
}
