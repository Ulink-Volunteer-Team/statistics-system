import DatabaseWrapper from "../utils/sqlite-wrapper";
import StudentDBManager from "./student-db-manager";
import RecruitmentDBManager from "./recruitment-db-manager";
import { v4 as uuidV4 } from "uuid";

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
	constructor(db: DatabaseWrapper, studentDB: StudentDBManager, recruitmentDB: RecruitmentDBManager, initCallback?: () => void) {
		this.db = db;
		this.studentDB = studentDB;
		this.recruitmentDB = recruitmentDB;
		this.db.prepareTable(this.tableName, {
			id: {
				type: "TEXT",
				primaryKey: true,
				notNull: true
			},
			studentID: {
				type: "TEXT",
				notNull: true
			},
			eventID: {
				type: "TEXT",
				notNull: true
			}
		})
			.then(() => {
				this.db.logger.info(`EventDBManager: ready at table "${this.tableName}"`);
				if (initCallback) initCallback();
			})
			.catch(() => {
				if (initCallback) initCallback();
			});
	}


	/**
	 * Adds multiple event records associating students with events to the database.
	 *
	 * @param records An array of objects, each containing a studentID and an eventID
	 *                 representing the association to be added.
	 * @returns A promise that resolves to an object containing the number of changes
	 *          made and the ID of the last inserted row.
	 * @throws An error if any of the student or event IDs do not exist in their
	 *         respective databases.
	 */
	async addRecords(records: { studentID: string, eventID: string }[]) {
		const promises: Promise<RunResult>[] = [];
		const warnings: string[] = [];
		for (const { studentID, eventID } of records) {
			const haveStudent = await this.studentDB.haveStudentWithID(studentID);
			const haveEvent = await this.recruitmentDB.haveRecruitmentWithID(eventID);
			if (!haveStudent) warnings.push(`Student with id "${studentID}" does not exist`);
			if (!haveEvent) warnings.push(`Event with id "${eventID}" does not exist`);
			promises.push(this.db.insert(this.tableName, [{ id: uuidV4(), studentID: studentID, eventID: eventID }]));
		}
		const results = await Promise.all(promises);
		if (warnings.length > 0) return Promise.reject(warnings.join("\n"));
		return {
			changes: results.reduce((acc, r) => acc + r.changes, 0),
			lastInsertRowid: results[results.length - 1].lastInsertRowid
		};
	}

	/**
	 * Updates the events associated with a specific student by adding new events and removing old ones.
	 *
	 * @param studentID The ID of the student whose events are being updated.
	 * @param eventIDs An array of event IDs that the student should be associated with.
	 * @throws An error if updating the events fails.
	 */
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

	/**
	 * Updates the students associated with a specific event by adding new students and removing old ones.
	 *
	 * @param eventID The ID of the event whose students are being updated.
	 * @param studentIDs An array of student IDs that the event should be associated with.
	 * @throws An error if updating the students fails.
	 */
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
		return (await this.db.select<{ studentID: string }>(this.tableName, ["studentID"], [{
			key: "eventID",
			operator: "=",
			compared: eventID,
			logicalOperator: "AND"
		}])).map(item => item.studentID);
	}

	/**
	 * Retrieves a list of event IDs of events that the given student is volunteering for.
	 * @param studentID The ID of the student.
	 * @returns A promise that resolves to an array of event IDs.
	 * @throws An error if the student does not exist in the database.
	 */
	async getRecruitmentIDsByStudentID(studentID: string) {
		if (!(await this.studentDB.haveStudentWithID(studentID))) return Promise.reject(`Student with id "${studentID}" does not exist in database`);
		return (await this.db.select<{ eventID: string }>(this.tableName, ["eventID"], [{
			key: "studentID",
			operator: "=",
			compared: studentID,
			logicalOperator: "AND"
		}])).map(item => item.eventID);
	}

	/**
	 * Calculates the total volunteer hours for a given student starting from a specific time.
	 * @param studentID The ID of the student whose volunteer hours are to be calculated.
	 * @param beginTime The starting time (in milliseconds) from which to calculate the volunteer hours. Defaults to 0.
	 * @returns A promise that resolves to the total number of volunteer hours.
	 */
	async calculateVolunteerHour(studentID: string, beginTime = 0): Promise<number> {
		const events = (await this.getRecruitmentIDsByStudentID(studentID));

		console.log(events);

		let total = 0;
		for (const eventID of events) {
			const event = (await this.recruitmentDB.getRecruitmentByID(eventID))!;
			if (event.eventTime > beginTime) total += event.volunteerHours;
		}

		return total;
	}

	/**
	 * Deletes all records associated with the given student ID.
	 * @param studentID The ID of the student whose records are to be deleted.
	 * @throws An error if the student does not exist in the database.
	 * @returns A promise that resolves to a RunResult object representing the result of the deletion operation.
	 */
	async deleteRecordsByStudentID(studentID: string) {
		if (!(await this.studentDB.haveStudentWithID(studentID))) return Promise.reject(`Student with id "${studentID}" does not exist`);
		return this.db.delete(this.tableName, [
			{
				key: "studentID",
				operator: "=",
				compared: studentID,
				logicalOperator: "AND"
			}
		]);
	}

	/**
	 * Deletes all records associated with the given event ID.
	 * @param eventID The ID of the event whose records are to be deleted.
	 * @throws An error if the event does not exist in the database.
	 * @returns A promise that resolves to a RunResult object representing the result of the deletion operation.
	 */
	async deleteRecordsByEventID(eventID: string) {
		if (!(await this.recruitmentDB.haveRecruitmentWithID(eventID))) return Promise.reject(`Event with id "${eventID}" does not exist`);
		return this.db.delete(this.tableName, [
			{
				key: "eventID",
				operator: "=",
				compared: eventID,
				logicalOperator: "AND"
			}
		]);
	}

	/**
	 * Deletes records from the Event table for the given student and event ID pairs.
	 * @param records An array of objects each containing a studentID and an eventID representing
	 * the records to be deleted.
	 * @returns A promise that resolves to a RunResult object representing the result of the deletion
	 * operation, or rejects with a warning message if any student or event does not exist.
	 * @throws An error if any student or event associated with the given IDs does not exist in the database.
	 */
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
					key: "studentID",
					operator: "=",
					compared: studentID,
					logicalOperator: "AND"
				},
				{
					key: "eventID",
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
