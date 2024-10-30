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

    async getRecruitment(id: string) {
        return (await this.db.select<RecruitmentDataType>("recruitment", ["*"], [{
            key: "id",
            operator: "=",
            compared: id,
            logicalOperator: "AND"
        }]))[0];
    }

    async haveRecruitment(id: string) {
        return (await this.db.select<RecruitmentDataType>("recruitment", ["id"], [{
            key: "id",
            operator: "=",
            compared: id,
            logicalOperator: "AND"
        }])).length > 0;
    }

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

    async fuzzySearch(fields: ("department" | "formFilledBy" | "eventName")[], search: string[]) {
        return await this.db.select<RecruitmentDataType>("recruitment", ["*"], fields.map((_, i) => ({
            key: fields[i],
            operator: "LIKE",
            compared: `%${search[i]}%`,
            logicalOperator: "AND"
        })));
    }

    async removeRecruitment(id: string) {
        return await this.db.delete("recruitment", [{
            key: "id",
            operator: "=",
            compared: id,
            logicalOperator: "AND"
        }]);
    }
}

export default RecruitmentDBManager;
