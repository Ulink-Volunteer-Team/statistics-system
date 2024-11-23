import { APIHandlerConstructor } from "./base";
import { z } from "zod";

export const getVolunteersByRecruitments = APIHandlerConstructor(
    "get-volunteers-by-recruitment",
    z.object({
        token: z.string(),
        ids: z.array(z.string())
    }),
    (async ({ ids }, dataSource) => {
        const info = []

        for (const id of ids) {
            info.push([id, await dataSource.eventsDBManager.getStudentIDsByRecruitmentID(id)]);
        }
        return { volunteers: info };
    })
);

export const getRecruitmentsByVolunteers = APIHandlerConstructor(
    "get-recruitments-by-volunteers",
    z.object({
        token: z.string(),
        ids: z.array(z.string())
    }),
    (async ({ ids }, dataSource) => {
        const info = [];

        for (const id of ids) {
            info.push([id, await dataSource.eventsDBManager.getRecruitmentIDsByStudentID(id)]);
        }
        return { volunteers: info };
    })
);

export const addEventRecords = APIHandlerConstructor(
    "add-event-records",
    z.object({
        token: z.string(),
        records: z.array(z.object({
            eventID: z.string(),
            studentID: z.string(),
        }))
    }),
    (async ({ records }, dataSource) => {
        return await dataSource.eventsDBManager.addRecords(records);
    })
);

export const deleteEventRecords = APIHandlerConstructor(
    "delete-event-record",
    z.object({
        token: z.string(),
        records: z.array(z.object({
            eventID: z.string(),
            studentID: z.string(),
        }))
    }),
    (async ({ records }, dataSource) => {
        const runResult = await dataSource.eventsDBManager.deleteRecords(records);
        return { changes: runResult.changes, lastInsertRowid: runResult.lastInsertRowid };
    })
);

export const deleteRecordsByStudentID = APIHandlerConstructor(
    "delete-records-by-student-id",
    z.object({
        token: z.string(),
        ids: z.array(z.string()),
    }),
    (async ({ ids }, dataSource) => {
        const runResult = { changes: 0, lastInsertRowid: BigInt(0) as number | bigint };
        for (const id of ids) {
            const { changes, lastInsertRowid } = await dataSource.eventsDBManager.deleteRecordsByStudentID(id);
            runResult.changes += changes;
            runResult.lastInsertRowid = lastInsertRowid;
        }
        return { changes: runResult.changes, lastInsertRowid: runResult.lastInsertRowid };
    })
);

export const deleteRecordsByEventID = APIHandlerConstructor(
    "delete-records-by-event-id",
    z.object({
        token: z.string(),
        ids: z.array(z.string()),
    }),
    (async ({ ids }, dataSource) => {
        const runResult = { changes: 0, lastInsertRowid: BigInt(0) as number | bigint };
        for(const id of ids) {
            const { changes, lastInsertRowid } = await dataSource.eventsDBManager.deleteRecordsByEventID(id);
            runResult.changes += changes;
            runResult.lastInsertRowid = lastInsertRowid;
        }
        return { changes: runResult.changes, lastInsertRowid: runResult.lastInsertRowid };
    })
);

export const updateRecordsOfAStudent = APIHandlerConstructor(
    "update-events-of-a-student",
    z.object({
        token: z.string(),
        studentID: z.string(),
        eventIDs: z.array(z.string())
    }),
    (async ({ studentID, eventIDs }, dataSource) => {
        await dataSource.eventsDBManager.updateEventsOfAStudent(studentID, eventIDs);
    })
)

export const updateRecordsOfAnEvent = APIHandlerConstructor(
    "update-students-of-an-event",
    z.object({
        token: z.string(),
        eventID: z.string(),
        studentIDs: z.array(z.string())
    }),
    (async ({ eventID, studentIDs }, dataSource) => {
        await dataSource.eventsDBManager.updateStudentsOfAnEvent(eventID, studentIDs);
    })
)

export default [
    updateRecordsOfAStudent,
    updateRecordsOfAnEvent,
    getVolunteersByRecruitments,
    getRecruitmentsByVolunteers,
    addEventRecords,
    deleteEventRecords,
    deleteRecordsByStudentID,
    deleteRecordsByEventID,
];
