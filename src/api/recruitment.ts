import { APIHandlerConstructor } from "./base";
import { z } from "zod";

export const getRecruitmentByID = APIHandlerConstructor(
    "get-recruitment-by-id",
    z.object({
        token: z.string(),
        id: z.string(),
    }),
    (async ({ id }, dataSource) => {
        return { recruitment: await dataSource.recruitmentDBManager.getRecruitmentByID(id) };
    })
);

export const getRecruitmentsByIDs = APIHandlerConstructor(
    "get-recruitments-by-ids",
    z.object({
        token: z.string(),
        ids: z.array(z.string()),
    }),
    (async ({ ids }, dataSource) => {
        const result = []
        for(const id of ids) {
            const recruitment = await dataSource.recruitmentDBManager.getRecruitmentByID(id);
            if (recruitment) result.push(recruitment);
        }
        return { recruitments: result };
    })
);

export const addRecruitments = APIHandlerConstructor(
    "add-recruitments",
    z.object({
        token: z.string(),
        recruitments: z.array(z.object({
            department: z.string(),
            formFilledBy: z.string(),
            eventName: z.string(),
            eventTime: z.number(),
            volunteerHours: z.number(),
            additionalNotes: z.string().optional(),
        }))
    }),
    (async ({ recruitments }, dataSource) => {
        const runResult = await dataSource.recruitmentDBManager.addRecruitments(recruitments);
        return { changes: runResult.changes, lastInsertRowid: runResult.lastInsertRowid };
    })
);

export const updateRecruitments = APIHandlerConstructor(
    "update-recruitments",
    z.object({
        token: z.string(),
        recruitments: z.array(z.object({
            id: z.string(),
            department: z.string(),
            formFilledBy: z.string(),
            eventName: z.string(),
            eventTime: z.number(),
            volunteerHours: z.number(),
            additionalNotes: z.string().optional(),
        }))
    }),
    (async ({ recruitments }, dataSource) => {
        const runResult = await dataSource.recruitmentDBManager.updateRecruitments(recruitments);
        return { changes: runResult.changes, lastInsertRowid: runResult.lastInsertRowid };
    })
)

export const deleteRecruitments = APIHandlerConstructor(
    "delete-recruitments",
    z.object({
        token: z.string(),
        ids: z.array(z.string()),
    }),
    (async ({ ids }, dataSource) => {
        for(const id of ids){
            await dataSource.eventsDBManager.deleteRecordsByEventID(id);
        }
        const runResult = await dataSource.recruitmentDBManager.removeRecruitments(ids);
        return { changes: runResult.changes, lastInsertRowid: runResult.lastInsertRowid };
    })
);

export const getRecruitmentsByFuzzySearch = APIHandlerConstructor(
    "get-recruitments-by-fuzzy-search",
    z.object({
        token: z.string(),
        values: z.array(z.string()),
        fields: z.array(z.enum(["department", "formFilledBy", "eventName"])),
    }),
    (async ({ values, fields }, dataSource) => {
        return { recruitments: await dataSource.recruitmentDBManager.getRecruitmentsByFuzzySearch(fields, values) };
    })
)

export const getAllRecruitmentInfo = APIHandlerConstructor(
    "get-all-recruitment-info",
    z.object({
        token: z.string(),
    }),
    (async (_, dataSource) => {
        return { recruitments: await dataSource.recruitmentDBManager.getAllRecruitmentInfo() };
    })
);

export const calculateVolunteerHours = APIHandlerConstructor(
    "calculate-volunteer-hours",
    z.object({
        token: z.string(),
        ids: z.array(z.string()),
    }),
    (async ({ ids }, dataSource) => {
        const result: Record<string, number> = {};
        for(const id of ids) {
            result[id] = await dataSource.eventsDBManager.calculateVolunteerHour(id);
        }
        return { hours: result };
    })
)

export default [
    calculateVolunteerHours,
    getAllRecruitmentInfo,
    getRecruitmentsByFuzzySearch,
    getRecruitmentByID,
    getRecruitmentsByIDs,
    addRecruitments,
    updateRecruitments,
    deleteRecruitments,
];
