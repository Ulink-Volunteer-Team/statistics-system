import DatabaseWrapper from "../utils/sqlite-wrapper";
import StudentDBManager from "./student-db-manager";
import RecruitmentDBManager from "./recruitment-db-manager";

export class EventDBManager {
    db: DatabaseWrapper;
    studentDB: StudentDBManager;
    recruitmentDB: RecruitmentDBManager;
    readonly tableName = "event";
    constructor(db: DatabaseWrapper, studentDB: StudentDBManager, recruitmentDB: RecruitmentDBManager) {
        this.db = db;
        this.studentDB = studentDB;
        this.recruitmentDB = recruitmentDB;
        this.db.db.run(`
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
            StudentID INTEGER NOT NULL,
            EventID INTEGER NOT NULL,
            PRIMARY KEY (StudentID, EventID),
            FOREIGN KEY (StudentID) REFERENCES ${this.studentDB.tableName}(id),
            FOREIGN KEY (EventID) REFERENCES ${this.recruitmentDB.tableName}(id)
        );`);
        this.db.logger.info(`EventDBManager: ready at table "${this.tableName}"`);
    }

    async addRecord(studentID: string, eventID: string) {
        const haveStudent = await this.studentDB.haveStudentID(studentID);
        const haveEvent = await this.recruitmentDB.haveRecruitment(eventID);
        if(!haveStudent) return Promise.reject(`Student with id "${studentID}" does not exist`);
        if(!haveEvent) return Promise.reject(`Event with id "${eventID}" does not exist`);
        return await this.db.insert(this.tableName, [{ StudentID: studentID, EventID: eventID }]);
    }
    

    async getStudentIDsByEventID(eventID: string) {
        if(!(await this.recruitmentDB.haveRecruitment(eventID))) return Promise.reject(`Event with id "${eventID}" does not exist`);
        return (await this.db.select<{StudentID: string}>(this.tableName, ["StudentID"], [{
            key: "EventID",
            operator: "=",
            compared: eventID,
            logicalOperator: "AND"
        }])).map(item => item.StudentID);
    }

    async getEventIDsByStudentID(studentID: string) {
        if(!(await this.studentDB.haveStudentID(studentID))) return Promise.reject(`Student with id "${studentID}" does not exist`);
        return (await this.db.select<{EventID: string}>(this.tableName, ["EventID"], [{
            key: "StudentID",
            operator: "=",
            compared: studentID,
            logicalOperator: "AND"
        }])).map(item => item.EventID);
    }
}

export default EventDBManager;
