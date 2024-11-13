import { APIHandlerConstructor } from "./base";
import { z } from "zod";

export const getRecruitmentByID = APIHandlerConstructor(
    "get-recruitment-by-id",
    z.object({
        token: z.string(),
        id: z.string(),
    }),
    (async ({ id }, dataSource) => {
        return { recruitments: await dataSource.recruitmentDBManager.getRecruitmentByID(id) };
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
        const runResult = await dataSource.recruitmentDBManager.removeRecruitments(ids);
        return { changes: runResult.changes, lastInsertRowid: runResult.lastInsertRowid };
    })
);

export default [
    getRecruitmentByID,
    addRecruitments,
    updateRecruitments,
    deleteRecruitments,
];
