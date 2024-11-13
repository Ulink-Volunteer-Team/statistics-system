import { APIHandlerConstructor } from "./base";
import { z } from "zod";

export const getVolunteersByRecruitment = APIHandlerConstructor(
    "get-volunteers-by-recruitment",
    z.object({
        token: z.string(),
        studentID: z.string(),
    }),
    (async ({ studentID }, dataSource) => {
        return { recruitments: await dataSource.eventsDBManager.getRecruitmentIDsByStudentID(studentID) };
    })
);

export const getEventsByVolunteer = APIHandlerConstructor(
    "get-events-by-volunteer",
    z.object({
        token: z.string(),
        studentID: z.string(),
    }),
    (async ({ studentID }, dataSource) => {
        return { events: await dataSource.eventsDBManager.getStudentIDsByRecruitmentID(studentID) };
    })
);

export const addEventRecords = APIHandlerConstructor(
    "add-event-record",
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
        studentID: z.string(),
    }),
    (async ({ studentID }, dataSource) => {
        const runResult = await dataSource.eventsDBManager.deleteRecordsByStudentID(studentID);
        return { changes: runResult.changes, lastInsertRowid: runResult.lastInsertRowid };
    })
);

export const deleteRecordsByEventID = APIHandlerConstructor(
    "delete-records-by-event-id",
    z.object({
        token: z.string(),
        eventID: z.string(),
    }),
    (async ({ eventID }, dataSource) => {
        const runResult = await dataSource.eventsDBManager.deleteRecordsByEventID(eventID);
        return { changes: runResult.changes, lastInsertRowid: runResult.lastInsertRowid };
    })
);

export default [
    getVolunteersByRecruitment,
    getEventsByVolunteer,
    addEventRecords,
    deleteEventRecords,
    deleteRecordsByStudentID,
    deleteRecordsByEventID,
];
