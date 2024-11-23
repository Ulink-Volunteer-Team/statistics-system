import DatabaseWrapper from "../utils/sqlite-wrapper";
import StudentDBManager from "./student-db-manager";
import RecruitmentDBManager from "./recruitment-db-manager";

import { RunResult } from "node-sqlite3-wasm";

export class EventDBManager {
    db: DatabaseWrapper;
    studentDB: StudentDBManager;
    recruitmentDB: RecruitmentDBManager;
    readonly tableName = "event";
    /**
     * Constructs a new EventDBManager instance.
     * @param db The DatabaseWrapper instance to be used for database operations.
     * @param studentDB The StudentDBManager instance to be used for student database operations.
     * @param recruitmentDB The RecruitmentDBManager instance to be used for recruitment database operations.
     */
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

    /**
     * Adds a record to the Event table representing the given student volunteering for the given event.
     * @param studentID The ID of the student volunteering for the event.
     * @param eventID The ID of the event.
     * @returns The result of the database insertion operation.
     * @throws An error if the student or event does not exist in the database.
     */
    async addRecords(records: { studentID: string, eventID: string }[]) {
        const promises: Promise<RunResult>[] = [];
        const warnings: string[] = [];
        for (const { studentID, eventID } of records) {
            const haveStudent = await this.studentDB.haveStudentWithID(studentID);
            const haveEvent = await this.recruitmentDB.haveRecruitmentWithID(eventID);
            if (!haveStudent) warnings.push(`Student with id "${studentID}" does not exist`);
            if (!haveEvent) warnings.push(`Event with id "${eventID}" does not exist`);
            promises.push(this.db.insert(this.tableName, [{ StudentID: studentID, EventID: eventID }], {
                conflict: {
                    action: "NOTHING",
                }
            }));
        }
        const results = await Promise.all(promises);
        if (warnings.length > 0) return Promise.reject(warnings.join("\n"));
        return {
            changes: results.reduce((acc, r) => acc + r.changes, 0),
            lastInsertRowid: results[results.length - 1].lastInsertRowid
        };
    }

    async updateEventsOfAStudent(studentID: string, eventIDs: string[]) {
        const allExistRecords = await this.getRecruitmentIDsByStudentID(studentID);

        const recordsToDelete = allExistRecords.filter(record => !eventIDs.includes(record));
        const recordsToAdd = eventIDs.filter(record => !allExistRecords.includes(record));

        if (recordsToDelete.length > 0) {
            await this.deleteRecords(recordsToDelete.map(record => ({ studentID, eventID: record })));
        }
        if (recordsToAdd.length > 0) {
            await this.addRecords(recordsToAdd.map(record => ({ studentID, eventID: record })));
        }
    }

    async updateStudentsOfAnEvent(eventID: string, studentIDs: string[]) {
        const allExistRecords = await this.getStudentIDsByRecruitmentID(eventID);

        const recordsToDelete = allExistRecords.filter(record => !studentIDs.includes(record));
        const recordsToAdd = studentIDs.filter(record => !allExistRecords.includes(record));

        if (recordsToDelete.length > 0) {
            await this.deleteRecords(recordsToDelete.map(record => ({ studentID: record, eventID })));
        }
        if (recordsToAdd.length > 0) {
            await this.addRecords(recordsToAdd.map(record => ({ studentID: record, eventID })));
        }
    }


    /**
     * Retrieves a list of student IDs of students volunteering for the given event.
     * @param eventID The ID of the event.
     * @returns A promise that resolves to an array of student IDs.
     * @throws An error if the event does not exist in the database.
     */
    async getStudentIDsByRecruitmentID(eventID: string) {
        if (!(await this.recruitmentDB.haveRecruitmentWithID(eventID))) return Promise.reject(`Event with id "${eventID}" does not exist`);
        return (await this.db.select<{ StudentID: string }>(this.tableName, ["StudentID"], [{
            key: "EventID",
            operator: "=",
            compared: eventID,
            logicalOperator: "AND"
        }])).map(item => item.StudentID);
    }

    /**
     * Retrieves a list of event IDs of events that the given student is volunteering for.
     * @param studentID The ID of the student.
     * @returns A promise that resolves to an array of event IDs.
     * @throws An error if the student does not exist in the database.
     */
    async getRecruitmentIDsByStudentID(studentID: string) {
        if (!(await this.studentDB.haveStudentWithID(studentID))) return Promise.reject(`Student with id "${studentID}" does not exist in database`);
        return (await this.db.select<{ EventID: string }>(this.tableName, ["EventID"], [{
            key: "StudentID",
            operator: "=",
            compared: studentID,
            logicalOperator: "AND"
        }])).map(item => item.EventID);
    }

    /**
     * Calculates the total volunteer hours for a given student starting from a specific time.
     * @param studentID The ID of the student whose volunteer hours are to be calculated.
     * @param beginTime The starting time (in milliseconds) from which to calculate the volunteer hours. Defaults to 0.
     * @returns A promise that resolves to the total number of volunteer hours.
     */
    async calculateVolunteerHour(studentID: string, beginTime = 0): Promise<number> {
        const events = (await this.getRecruitmentIDsByStudentID(studentID));

        let total = 0;
        for (const eventID of events) {
            const event = (await this.recruitmentDB.getRecruitmentByID(eventID))!;
            if (event.eventTime > beginTime) total += event.volunteerHours;
        }

        return total;
    }

    async deleteRecordsByStudentID(studentID: string) {
        if(!(await this.studentDB.haveStudentWithID(studentID))) return Promise.reject(`Student with id "${studentID}" does not exist`);
        return this.db.delete(this.tableName, [
            {
                key: "StudentID",
                operator: "=",
                compared: studentID,
                logicalOperator: "AND"
            }
        ]);
    }

    async deleteRecordsByEventID(eventID: string) {
        if(!(await this.recruitmentDB.haveRecruitmentWithID(eventID))) return Promise.reject(`Event with id "${eventID}" does not exist`);
        return this.db.delete(this.tableName, [
            {
                key: "EventID",
                operator: "=",
                compared: eventID,
                logicalOperator: "AND"
            }
        ]);
    }

    async deleteRecords(records: { studentID: string, eventID: string }[]) {
        const promises: Promise<RunResult>[] = [];
        const warnings: string[] = [];
        for (const { studentID, eventID } of records) {
            const haveStudent = await this.studentDB.haveStudentWithID(studentID);
            const haveEvent = await this.recruitmentDB.haveRecruitmentWithID(eventID);
            if (!haveStudent) warnings.push(`Student with id "${studentID}" does not exist`);
            if (!haveEvent) warnings.push(`Event with id "${eventID}" does not exist`);
            promises.push(this.db.delete(this.tableName, [
                {
                    key: "StudentID",
                    operator: "=",
                    compared: studentID,
                    logicalOperator: "AND"
                },
                {
                    key: "EventID",
                    operator: "=",
                    compared: eventID,
                    logicalOperator: "AND"
                }
            ]));
        }
        const runResults = await Promise.all(promises);
        if (warnings.length > 0) return Promise.reject(warnings.join("\n"));
        return {
            changes: runResults.reduce((acc, r) => acc + r.changes, 0),
            lastInsertRowid: runResults[runResults.length - 1].lastInsertRowid,
        };
    }
}

export default EventDBManager;
