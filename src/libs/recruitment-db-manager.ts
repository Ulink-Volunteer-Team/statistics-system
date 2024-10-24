import DatabaseWrapper from "../utils/sqlite-wrapper";
import { v4 as uuidV4 } from "uuid";

type RecruitmentDataType = {
    id?: string;
    department: string;
    formFilledBy: string;
    eventName: string;
    dateTime: string;
    volunteerHours: string;
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
            eventDateTime: {
                type: "TEXT",
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

    addRecruitment(recruitment: RecruitmentDataType) {
        return this.db.insert("recruitment", [{
            ...recruitment,
            id: uuidV4()
        }]);
    }

    fuzzySearch(fields: ("department" | "formFilledBy" | "eventName")[], search: string[]) {
        return this.db.select<RecruitmentDataType>("recruitment", ["*"], fields.map((_, i) => ({
            key: fields[i],
            operator: "LIKE",
            compared: `%${search[i]}%`,
            logicalOperator: "AND"
        })));
    }

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
