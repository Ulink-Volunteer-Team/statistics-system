import DatabaseWrapper from "../utils/sqlite-wrapper";

export class ParticipantsDBManager {
    db: DatabaseWrapper;
    readonly tableName = "participants";
    constructor(db: DatabaseWrapper) {
        this.db = db;
        this.db.db.run(`
        CREATE TABLE ${this.tableName} (
            StudentID INTEGER NOT NULL,
            EventID INTEGER NOT NULL,
            PRIMARY KEY (StudentID, EventID),
            FOREIGN KEY (StudentID) REFERENCES students(id),
            FOREIGN KEY (EventID) REFERENCES recruitment(id)
        );`);
    }

    addRecord(studentID: string, eventID: string) {
        return this.db.insert(this.tableName, [{ StudentID: studentID, EventID: eventID }]);
    }

    getRecordsStudentByEvent(eventID: string) {
        return this.db.select(this.tableName, ["StudentID"], [{
            key: "EventID",
            operator: "=",
            compared: eventID,
            logicalOperator: "AND"
        }]);
    }

    getRecordsEventByStudent(studentID: string) {
        return this.db.select(this.tableName, ["EventID"], [{
            key: "StudentID",
            operator: "=",
            compared: studentID,
            logicalOperator: "AND"
        }]);
    }
}

export default ParticipantsDBManager;
