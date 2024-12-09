import { RunResult } from "node-sqlite3-wasm";
import DatabaseWrapper from "../utils/sqlite-wrapper";

export type StudentType = {
	id: string,
	name: string
}

export class StudentDBManager {
	private db: DatabaseWrapper;
	readonly tableName = "students";
	/**
	 * Constructs a new StudentDBManager instance.
	 * @param db The DatabaseWrapper instance to be used for database operations.
	 * @param initCallback A callback function to be called after the database table is ready.
	 */
	constructor(db: DatabaseWrapper, initCallback?: () => void, errorCallback?: () => void) {
		this.db = db;
		this.db.prepareTable(this.tableName, {
			id: {
				type: "TEXT",
				primaryKey: true
			},
			name: {
				type: "TEXT",
				notNull: true
			},
		})
			.then(() => {
				this.db.logger.info(`StudentDBManager: ready at table "${this.tableName}"`)
				if (initCallback) initCallback();
			})
			.catch(() => {
				if (errorCallback) errorCallback();
			});
	}

	/**
	 * Adds multiple students to the database in a single operation.
	 * @param students An array of student objects, each containing an id and name.
	 * @returns The result of the database insertion operation.
	 * @throws An error if any of the students already exist in the database.
	 */
	async addStudents(students: StudentType[]): Promise<RunResult> {
		const warnings: string[] = [];
		const promises: Promise<RunResult>[] = [];
		for (const student of students) {
			if (await this.haveStudentWithID(student.id)) warnings.push(`Student with id "${student.id}" already exists`);
			else promises.push(this.db.insert(this.tableName, [student]));
		}

		const results = await Promise.all(promises);
		if (warnings.length > 0) return Promise.reject(warnings.join("\n"));
		return {
			changes: results.reduce((acc, r) => acc + r.changes, 0),
			lastInsertRowid: results[results.length - 1].lastInsertRowid
		};
	}

	/**
	 * Removes a student from the database by their ID.
	 * @param ids The IDs of the students to remove.
	 */
	async removeStudents(ids: string[]): Promise<RunResult> {
		const promises: Promise<RunResult>[] = [];
		const warnings: string[] = [];
		for (const id of ids) {
			if (!(await this.haveStudentWithID(id))) warnings.push(`Student with id ${id} not found`);
			else promises.push(this.db.delete(this.tableName, [{
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
			lastInsertRowid: results[results.length - 1].lastInsertRowid
		};
	}

	/**
	 * Updates the names of multiple students in a single operation.
	 * @param students An object with student IDs as keys and the new names as values.
	 * @returns The number of rows changed.
	 */
	async updateStudents(students: StudentType[]): Promise<RunResult> {
		const promises: Promise<RunResult>[] = [];
		const warnings: string[] = [];
		for (const student of students) {
			if (!(await this.haveStudentWithID(student.id))) warnings.push(`Student with id "${student.id}" does not exist`);
			else promises.push(this.db.update(this.tableName, student, [{
				key: "id",
				operator: "=",
				compared: student.id,
				logicalOperator: "AND"
			}]));
		}
		const results = await Promise.all(promises);
		return ({
			changes: results.reduce((acc, r) => acc + r.changes, 0),
			lastInsertRowid: results[results.length - 1].lastInsertRowid
		});
	}

	/**
	 * Checks if a student exists with the given ID.
	 * @param id The ID of the student to check.
	 * @returns Whether a student with the given ID exists.
	 */
	async haveStudentWithID(id: string): Promise<boolean> {
		const result = await this.db.select<StudentType>(this.tableName, ["name", "id"], [{
			key: "id",
			operator: "=",
			compared: id,
			logicalOperator: "AND"
		}]);
		return result.length > 0;
	}

	/**
	 * Finds a student by their ID and returns them.
	 * @param id The ID of the student to find.
	 * @returns The student if found, otherwise undefined.
	 */
	async getStudentByID(id: string): Promise<StudentType | undefined> {
		const result = await this.db.select<StudentType>(this.tableName, ["id", "name"], [{
			key: "id",
			operator: "=",
			compared: id,
			logicalOperator: "AND"
		}]);
		return result.length > 0 ? result[0] : undefined;
	}

	/**
	 * Performs a fuzzy search for students whose names match the *given pattern*.
	 * @param name The pattern to search for in student names.
	 * @returns An array of students with names matching the pattern.
	 */
	getStudentByFuzzySearch(name: string): Promise<StudentType[]> {
		return this.db.select<StudentType>(this.tableName, ["id", "name"], [{
			key: "name",
			operator: "LIKE",
			compared: `%${name}%`,
			logicalOperator: "AND"
		}]);
	}

	/**
	 * Retrieves all students from the database.
	 * @returns A promise that resolves to an array of all student objects, each containing an id and name.
	 */
	getAllStudents(): Promise<StudentType[]> {
		return this.db.select<StudentType>(this.tableName, ["id", "name"]);
	}
}

export default StudentDBManager;
