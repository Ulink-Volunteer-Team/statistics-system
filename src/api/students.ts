import { APIHandlerConstructor } from "./base";
import { z } from "zod";

export const getStudentByID = APIHandlerConstructor(
    "get-student-by-id",
    z.object({
        token: z.string(),
        id: z.string(),
    }),
    (async ({ id }, dataSource) => {
        return dataSource.studentDBManager.getStudentByID(id);
    })
);

export const getStudentsByIDs = APIHandlerConstructor(
    "get-students-by-ids",
    z.object({
        token: z.string(),
        ids: z.array(z.string()),
    }),
    (async ({ ids }, dataSource) => {
        const result = []
        for(const id of ids) {
            const student = await dataSource.studentDBManager.getStudentByID(id);
            if (student) result.push(student);
        }

        return { students: result };
    })
)

export const addStudents = APIHandlerConstructor(
    "add-students",
    z.object({
        token: z.string(),
        students: z.array(z.object({
            name: z.string(),
            id: z.string(),
        })),
    }),
    (async ({ students }, dataSource) => {
        const runResult = await dataSource.studentDBManager.addStudents(students);
        return { changes: runResult.changes, lastInsertRowid: runResult.lastInsertRowid };
    })
);

export const removeStudents = APIHandlerConstructor(
    "remove-students",
    z.object({
        token: z.string(),
        ids: z.array(z.string()),
    }),
    (async ({ ids }, dataSource) => {
		for(const id of ids){
            await dataSource.eventsDBManager.deleteRecordsByStudentID(id);
        }
        const runResult = await dataSource.studentDBManager.removeStudents(ids);
        return { changes: runResult.changes, lastInsertRowid: runResult.lastInsertRowid };
    })
);

export const updateStudents = APIHandlerConstructor(
    "update-students",
    z.object({
        token: z.string(),
        students: z.array(z.object({
            name: z.string(),
            id: z.string(),
        })),
    }),
    (async ({ students }, dataSource) => {
        const runResult = await dataSource.studentDBManager.updateStudents(students)
        return { changes: runResult.changes, lastInsertRowid: runResult.lastInsertRowid };
    })
);

export const getStudentsByFuzzySearch = APIHandlerConstructor(
    "get-students-by-fuzzy-search",
    z.object({
        token: z.string(),
        name: z.string(),
    }),
    (async ({ name }, dataSource) => {
        return { students: await dataSource.studentDBManager.getStudentByFuzzySearch(name) };
    })
);

export const getAllStudents = APIHandlerConstructor(
    "get-all-students",
    z.object({
        token: z.string(),
    }),
    (async (_, dataSource) => {
        return { students: await dataSource.studentDBManager.getAllStudents() };
    })
);

export default [
    getAllStudents,
    getStudentByID,
    getStudentsByIDs,
    addStudents,
    removeStudents,
    updateStudents,
    getStudentsByFuzzySearch,
];
