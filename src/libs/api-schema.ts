import { z } from "zod";

export function formatZodError(error: z.ZodError) {
    return error.issues.map(issue => {
        return {
            message: issue.message,
            path: issue.path.join(".")
        };
    });
}

export function getErrorMsg(error: z.ZodError) {
    return "API schema validation failed:\n" + error.issues.map(issue => {
        return `${issue.path.join(".")} ${issue.message}`;
    }).join("\n");
}

export function checkSchema<T extends z.ZodType<unknown>>(data: unknown, schema: T) {
    const result = schema.safeParse(data);
    if (result.success) {
        return result.data as (T extends z.ZodType<infer T> ? T : never);
    } else {
        throw new Error(getErrorMsg(result.error));
    }
}

export const data_recruitmentSchema = z.object({
    department: z.string(),
    formFilledBy: z.string(),
    eventName: z.string(),
    eventTime: z.number(),
    volunteerHours: z.number(),
    additionalNotes: z.string().optional(),
    id: z.string().optional()
});

export const data_studentSchema = z.object({
    name: z.string(),
    id: z.string()
})

export const api_signInSchema = z.object({
    id: z.string(),
    password: z.string(),
});

export const api_signUpSchema = z.object({
    id: z.string(),
    password: z.string(),
    permissions: z.string(),
});

export const api_getStudentsSchema = z.object({
    token: z.string(), 
    limit: z.number(),
})

export const api_addStudentSchema = z.object({
    token: z.string(),
    student: data_studentSchema,
});

export const api_addStudentBulkSchema = z.object({
    token: z.string(),
    students: z.array(data_studentSchema),
});

export const api_fuzzySearchStudentSchema = z.object({
    token: z.string(),
    queryName: z.string()
});

export const api_deleteStudentSchema = z.object({
    id: z.string(),
    token: z.string()
});

export const api_addRecruitmentSchema = z.object({
    token: z.string(),
    recruitment: data_recruitmentSchema
});

export const api_getRecruitmentSchema = z.object({
    token: z.string(),
    id: z.string()
});

export const api_updateRecruitmentSchema = z.object({
    token: z.string(),
    id: z.string(),
    recruitment: data_recruitmentSchema.partial()
});

export const api_deleteRecruitmentSchema = z.object({
    token: z.string(),
    id: z.string()
});

export const api_addVolunteerToEventSchema = z.object({
    token: z.string(),
    eventID: z.string(),
    studentID: z.string()
});

export const api_addVolunteerToEventBulkSchema = z.object({
    token: z.string(),
    eventID: z.string(),
    studentIDs: z.array(z.string())
});

export const api_getVolunteersFromEventSchema = z.object({
    token: z.string(),
    eventID: z.string(),
    limit: z.number(),
    offset: z.number()
});

export const api_getEventsFromVolunteerSchema = z.object({
    token: z.string(),
    studentID: z.string(),
    limit: z.number(),
    offset: z.number()
})

export const api_getStudentVolunteerTime = z.object({
    token: z.string(),
    studentID: z.string(),
    beginTime: z.number().optional(),
})
