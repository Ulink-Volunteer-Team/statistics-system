import DatabaseWrapper from "./sqlite-wrapper";

interface RecruitmentDataType {
    eventInfo: {
        department: string;
        formFilledBy: string;
        eventName: string;
    };
    volunteerRoles: string[];
    eventDateTime: {
        date: string;
        time: string;
        volunteerHours: string;
    };
    recruitmentNeeds: {
        totalVolunteers: number;
        applicationDeadline: string;
    };
    interviewSchedule: string;
    additionalNotes: string;
}

export class RecruitmentDBManager {
    private db: DatabaseWrapper;
    constructor(db: DatabaseWrapper) {
        this.db = db;
    }
}