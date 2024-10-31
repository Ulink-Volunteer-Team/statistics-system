import DatabaseWrapper from "../utils/sqlite-wrapper";
import StudentDBManager from "./student-db-manager";
import RecruitmentDBManager from "./recruitment-db-manager";

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
    async addRecord(studentID: string, eventID: string) {
        const haveStudent = await this.studentDB.haveStudentID(studentID);
        const haveEvent = await this.recruitmentDB.haveRecruitment(eventID);
        if(!haveStudent) return Promise.reject(`Student with id "${studentID}" does not exist`);
        if(!haveEvent) return Promise.reject(`Event with id "${eventID}" does not exist`);
        return await this.db.insert(this.tableName, [{ StudentID: studentID, EventID: eventID }]);
    }
    

    /**
     * Retrieves a list of student IDs of students volunteering for the given event.
     * @param eventID The ID of the event.
     * @returns A promise that resolves to an array of student IDs.
     * @throws An error if the event does not exist in the database.
     */
    async getStudentIDsByEventID(eventID: string) {
        if(!(await this.recruitmentDB.haveRecruitment(eventID))) return Promise.reject(`Event with id "${eventID}" does not exist`);
        return (await this.db.select<{StudentID: string}>(this.tableName, ["StudentID"], [{
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
    async getEventIDsByStudentID(studentID: string) {
        if(!(await this.studentDB.haveStudentID(studentID))) return Promise.reject(`Student with id "${studentID}" does not exist in database`);
        return (await this.db.select<{EventID: string}>(this.tableName, ["EventID"], [{
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
        const events = (await this.getEventIDsByStudentID(studentID));

        let total = 0;
        for(const eventID of events){
            const event = await this.recruitmentDB.getRecruitment(eventID);
            if(event.eventTime > beginTime) total += event.volunteerHours; 
        }

        return total;
    }
}

export default EventDBManager;
