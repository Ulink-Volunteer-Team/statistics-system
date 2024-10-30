[ulink-volunteer-team-statistics-system-backend](../wiki/Home) / [libs/api-schema](../wiki/libs.api-schema) / api\_addVolunteerToEventBulkSchema

# Variable: api\_addVolunteerToEventBulkSchema

> `const` **api\_addVolunteerToEventBulkSchema**: `ZodObject`\<`object`, `"strip"`, `ZodTypeAny`, `object`, `object`\>

## Type declaration

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `eventID` | `ZodString` | [src/libs/api-schema.ts:110](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/libs/api-schema.ts#L110) |
| `studentIDs` | `ZodArray`\<`ZodString`, `"many"`\> | [src/libs/api-schema.ts:111](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/libs/api-schema.ts#L111) |
| `token` | `ZodString` | [src/libs/api-schema.ts:109](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/libs/api-schema.ts#L109) |

## Defined in

[src/libs/api-schema.ts:108](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/libs/api-schema.ts#L108)
