import DatabaseWrapper from "../utils/sqlite-wrapper";
import { RunResult } from "node-sqlite3-wasm";
import { v4 as uuidV4 } from "uuid";

export type RecruitmentDataType = {
    id: string;
    department: string;
    formFilledBy: string;
    eventName: string;
    eventTime: number;
    volunteerHours: number;
    additionalNotes: string;
}

export class RecruitmentDBManager {
    private db: DatabaseWrapper;
    readonly tableName = "recruitment";
    /**
     * Constructs a new RecruitmentDBManager instance.
     * @param db The DatabaseWrapper instance to be used for database operations.
     * @param initCallback An optional callback function to be called after the database table is prepared.
     */
    constructor(db: DatabaseWrapper, initCallback?: () => void) {
        this.db = db;
        db.prepareTable(this.tableName, {
            id: {
                type: "TEXT",
                primaryKey: true
            },
            department: {
                type: "TEXT",
                notNull: true
            },
            formFilledBy: {
                type: "TEXT",
                notNull: true
            },
            eventName: {
                type: "TEXT",
                notNull: true
            },
            eventTime: {
                type: "INTEGER",
                notNull: true
            },
            volunteerHours: {
                type: "INTEGER",
                notNull: true
            },
            additionalNotes: {
                type: "TEXT",
                notNull: true
            }
        }).then(() => {
            if (initCallback) initCallback();
        });
    }

    /**
     * Adds new recruitments to the database.
     * @param recruitments An array of partial RecruitmentDataType objects to be inserted. The id field is automatically generated.
     * @returns The result of the insert command.
     */
    async addRecruitments(recruitments: Partial<RecruitmentDataType>[]) {
        return await this.db.insert("recruitment", recruitments.map(recruitment => ({
            id: uuidV4(),
            department: "",
            formFilledBy: "",
            eventName: "",
            eventTime: Date.parse("1970-01-01"),
            volunteerHours: 0,
            additionalNotes: "",
            ...recruitment,
        })));
    }

    /**
     * Gets a recruitment by id.
     * @param id The id of the recruitment.
     * @returns The recruitment with the given id, or undefined if it does not exist.
     */
    async getRecruitmentByID(id: string) {
        return (await this.db.select<RecruitmentDataType>("recruitment", ["*"], [{
            key: "id",
            operator: "=",
            compared: id,
            logicalOperator: "AND"
        }]))[0];
    }

    /**
     * Checks if a recruitment with the given id exists in the database.
     * @param id The id to check
     * @returns Whether a recruitment with the given id exists
     */
    async haveRecruitmentWithID(id: string) {
        return (await this.db.select<RecruitmentDataType>("recruitment", ["id"], [{
            key: "id",
            operator: "=",
            compared: id,
            logicalOperator: "AND"
        }])).length > 0;
    }

    /**
     * Updates the recruitment data for multiple records.
     * 
     * @param records An array of partial RecruitmentDataType objects containing the fields to update.
     * @returns A single RunResult object representing the result of the update command.
     * @throws If any of the recruitments with the given id do not exist.
     */
    async updateRecruitments(records: Partial<RecruitmentDataType>[]): Promise<RunResult> {
        const promises: Promise<RunResult>[] = [];
        const warnings: string[] = [];
        for (const record of records) {
            if (!record.id) warnings.push(`Missing id in record ${JSON.stringify(record)}`);
            else if (!await this.haveRecruitmentWithID(record.id)) warnings.push(`Recruitment with id "${record.id}" does not exist`);
            else {
                const newRecruitment = {
                    ...(await this.getRecruitmentByID(record.id)),
                    ...record
                };
                promises.push(this.db.update("recruitment", newRecruitment, [{
                    key: "id",
                    operator: "=",
                    compared: record.id,
                    logicalOperator: "AND"
                }]));
            }
        }
        const results = await Promise.all(promises);
        if (warnings.length > 0) return Promise.reject(warnings.join("\n"));
        return {
            changes: results.reduce((acc, r) => acc + r.changes, 0),
            lastInsertRowid: results[results.length - 1].lastInsertRowid,
        };
    }

    /**
     * Searches for recruitments based on the given fields and search strings.
     * The search strings are matched using the LIKE operator with the % wildcard.
     * The search results are AND'd together.
     * @param fields The fields to search in. Allowed values are "department", "formFilledBy", and "eventName".
     * @param search The search strings to match.
     * @returns An array of RecruitmentDataType objects that match the search criteria.
     */
    async getRecruitmentsByFuzzySearch(fields: ("department" | "formFilledBy" | "eventName")[], search: string[]) {
        return await this.db.select<RecruitmentDataType>("recruitment", ["*"], fields.map((_, i) => ({
            key: fields[i],
            operator: "LIKE",
            compared: `%${search[i]}%`,
            logicalOperator: "AND"
        })));
    }

    /**
     * Deletes recruitments from the database by their IDs.
     * @param ids The IDs of the recruitments to delete.
     * @returns The result of the delete command.
     * @throws If any recruitment with the given id does not exist.
     */
    async removeRecruitments(ids: string[]): Promise<RunResult> {
        const promises: Promise<RunResult>[] = [];
        const warnings: string[] = []
        for (const id of ids) {
            if (!(await this.haveRecruitmentWithID(id))) warnings.push(`Recruitment with id "${id}" does not exist`);
            else promises.push(this.db.delete("recruitment", [{
                key: "id",
                operator: "=",
                compared: id,
                logicalOperator: "AND"
            }]));
        }
        const results = await Promise.all(promises);
        if (warnings.length > 0) return Promise.reject(warnings.join("\n"));
        return {
            changes: results.reduce((acc, r) => acc + r.changes, 0),
            lastInsertRowid: results[results.length - 1].lastInsertRowid,
        };
    }
}

export default RecruitmentDBManager;
