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
    constructor(db: DatabaseWrapper, initCallback?: () => void) {
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
        }).then(() => {
            if(initCallback) initCallback();
        });
    }

    /**
     * Adds a new student with the given information to the database.
     * @param student An object with the student's information: id and name.
     * @returns The row ID of the newly inserted student.
     */
    async addStudent(student: StudentType): Promise<RunResult> {
        if (await this.haveStudentID(student.id)) return Promise.reject(`Student with id "${student.id}" already exists`);
        else return this.db.insert(this.tableName, [student]);
    }

    /**
     * Adds multiple students to the database in a single operation.
     * @param students An array of student objects, each containing an id and name.
     * @returns The result of the database insertion operation.
     * @throws An error if any of the students already exist in the database.
     */
    async addStudentsBulk(students: StudentType[]): Promise<RunResult> {
        for (const student of students) {
            if(await this.haveStudentID(student.id)) return Promise.reject(`Student with id "${student.id}" already exists`);
        }
        return this.db.insert(this.tableName, students);
    }

    /**
     * Removes a student from the database by their ID.
     * @param id The ID of the student to remove.
     */
    removeStudent(id: string): Promise<RunResult> {
        if (!this.haveStudentID(id)) return Promise.reject(`Student with id ${id} not found`);
        return this.db.delete(this.tableName, [{
            key: "id",
            operator: "=",
            compared: id,
            logicalOperator: "AND"
        }]);
    }

    /**
     * Updates the name of a student with the given ID.
     * @param id The ID of the student to update.
     * @param name The new name of the student.
     * @returns The number of rows changed.
     */
    updateStudent(id: string, name: string): Promise<RunResult> {
        return this.db.update(this.tableName, {
            name
        }, [{
            key: "id",
            operator: "=",
            compared: id,
            logicalOperator: "AND"
        }]);
    }

    /**
     * Retrieves a list of students from the database.
     * @param num The maximum number of students to retrieve.
     * @param offset The number of students to skip before starting to collect the result set.
     * @returns A promise that resolves to an array of students.
     */
    getStudents(num: number, offset: number): Promise<StudentType[]> {
        return this.db.select<StudentType>(this.tableName, ["name", "id"], [], num, offset);
    }

    /**
     * Checks if a student exists with the given ID.
     * @param id The ID of the student to check.
     * @returns Whether a student with the given ID exists.
     */
    async haveStudentID(id: string): Promise<boolean> {
        const result = await this.db.select<StudentType>(this.tableName, ["name", "id"],[{
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
    async findById(id: string): Promise<StudentType | undefined> {
        const result = await this.db.select<StudentType>(this.tableName, ["name"], [{
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
    fuzzySearchStudent(name: string): Promise<StudentType[]> {
        return this.db.select<StudentType>(this.tableName, ["id", "name"], [{
            key: "name",
            operator: "LIKE",
            compared: `%${name}%`,
            logicalOperator: "AND"
        }]);
    }
}

export default StudentDBManager;
