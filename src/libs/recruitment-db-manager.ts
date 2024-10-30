import DatabaseWrapper from "../utils/sqlite-wrapper";
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
     * Adds a new recruitment to the database.
     * @param recruitment A partial RecruitmentDataType object to be inserted. The id field is automatically generated.
     * @returns The result of the insert command.
     */
    async addRecruitment(recruitment: Partial<RecruitmentDataType>) {
        return await this.db.insert("recruitment", [{
            id: uuidV4(),
            department: "",
            formFilledBy: "",
            eventName: "",
            eventTime: Date.parse("1970-01-01"),
            volunteerHours: 0,
            additionalNotes: "",
            ...recruitment,
        }]);
    }

    /**
     * Gets a recruitment by id.
     * @param id The id of the recruitment.
     * @returns The recruitment with the given id, or undefined if it does not exist.
     */
    async getRecruitment(id: string) {
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
    async haveRecruitment(id: string) {
        return (await this.db.select<RecruitmentDataType>("recruitment", ["id"], [{
            key: "id",
            operator: "=",
            compared: id,
            logicalOperator: "AND"
        }])).length > 0;
    }

    /**
     * Updates the recruitment data for a given id.
     * 
     * @param id The id of the recruitment to update.
     * @param recruitment A partial RecruitmentDataType object containing the fields to update.
     * @returns The result of the update command.
     * @throws If the recruitment with the given id does not exist.
     */
    async updateRecruitment(id: string, recruitment: Partial<RecruitmentDataType>) {
        if(!await this.haveRecruitment(id)) return Promise.reject(`Recruitment with id "${id}" does not exist`);
        const newRecruitment = {
            ...(await this.getRecruitment(id)),
            ...recruitment
        };
        return await this.db.update("recruitment", newRecruitment, [{
            key: "id",
            operator: "=",
            compared: id,
            logicalOperator: "AND"
        }]);
    }

    /**
     * Searches for recruitments based on the given fields and search strings.
     * The search strings are matched using the LIKE operator with the % wildcard.
     * The search results are AND'd together.
     * @param fields The fields to search in. Allowed values are "department", "formFilledBy", and "eventName".
     * @param search The search strings to match.
     * @returns An array of RecruitmentDataType objects that match the search criteria.
     */
    async fuzzySearch(fields: ("department" | "formFilledBy" | "eventName")[], search: string[]) {
        return await this.db.select<RecruitmentDataType>("recruitment", ["*"], fields.map((_, i) => ({
            key: fields[i],
            operator: "LIKE",
            compared: `%${search[i]}%`,
            logicalOperator: "AND"
        })));
    }

    /**
     * Deletes a recruitment from the database.
     * @param id The id of the recruitment to delete.
     * @returns The result of the delete command.
     * @throws If the recruitment with the given id does not exist.
     */
    removeRecruitment(id: string) {
        return this.db.delete("recruitment", [{
            key: "id",
            operator: "=",
            compared: id,
            logicalOperator: "AND"
        }]);
    }
}

export default RecruitmentDBManager;
