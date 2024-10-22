import { RunResult } from "node-sqlite3-wasm";
import DatabaseWrapper from "./sqlite-wrapper";

export type StudentType = {
    id: string,
    name: string
}

export class StudentDBManager {
    private db: DatabaseWrapper;
    tableName = "students";
    constructor(db: DatabaseWrapper) {
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
    }

    /**
     * @description Adds a new student with the given information to the database.
     * @param student An object with the student's information: id and name.
     * @returns The row ID of the newly inserted student.
     */
    async addStudent(student: StudentType): Promise<RunResult> {
        if (await this.haveStudentID(student.id)) return Promise.reject(`Student with id "${student.id}" already exists`);
        else return this.db.insert(this.tableName, [student]);
    }

    async addStudentsBulk(students: StudentType[]): Promise<RunResult> {
        for (const student of students) {
            if(await this.haveStudentID(student.id)) return Promise.reject(`Student with id "${student.id}" already exists`);
        }
        return this.db.insert(this.tableName, students);
    }

    /**
     * @description Removes a student from the database by their ID.
     * @param id The ID of the student to remove.
     */
    removeStudent(id: string): Promise<RunResult> {
        if (!this.haveStudentID(id)) return Promise.reject(`Student with id ${id} not found`);
        return this.db.delete(this.tableName, [{
            key: "id",
            operator: "=",
            compared: id,
            logicalOperator: "AND"
        }])
    }

    /**
     * @description Updates the name of a student with the given ID.
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

    getStudents(num: number, offset: number): Promise<StudentType[]> {
        return this.db.select<StudentType>(this.tableName, ["name", "id"], [], num, offset);
    }

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
     * @description Finds a student by their ID and returns them.
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
     * @description Performs a fuzzy search for students whose names match the given pattern.
     * @param name The pattern to search for in student names.
     * @returns An array of students with names matching the pattern.
     */
    fuzzySearch(name: string): Promise<StudentType[]> {
        return this.db.select<StudentType>(this.tableName, ["id"], [{
            key: "name",
            operator: "LIKE",
            compared: `%${name}%`,
            logicalOperator: "AND"
        }]);
    }
}

export default StudentDBManager;
