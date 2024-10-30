[ulink-volunteer-team-statistics-system-backend](../wiki/Home) / [libs/event-db-manager](../wiki/libs.event-db-manager) / EventDBManager

# Class: EventDBManager

## Constructors

### new EventDBManager()

> **new EventDBManager**(`db`, `studentDB`, `recruitmentDB`): [`EventDBManager`](../wiki/libs.event-db-manager.Class.EventDBManager)

Constructs a new EventDBManager instance.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `db` | [`DatabaseWrapper`](../wiki/utils.sqlite-wrapper.Class.DatabaseWrapper) | The DatabaseWrapper instance to be used for database operations. |
| `studentDB` | [`StudentDBManager`](../wiki/libs.student-db-manager.Class.StudentDBManager) | The StudentDBManager instance to be used for student database operations. |
| `recruitmentDB` | [`RecruitmentDBManager`](../wiki/libs.recruitment-db-manager.Class.RecruitmentDBManager) | The RecruitmentDBManager instance to be used for recruitment database operations. |

#### Returns

[`EventDBManager`](../wiki/libs.event-db-manager.Class.EventDBManager)

#### Defined in

[src/libs/event-db-manager.ts:16](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/libs/event-db-manager.ts#L16)

## Properties

| Property | Modifier | Type | Default value | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| `db` | `public` | [`DatabaseWrapper`](../wiki/utils.sqlite-wrapper.Class.DatabaseWrapper) | `undefined` | [src/libs/event-db-manager.ts:6](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/libs/event-db-manager.ts#L6) |
| `recruitmentDB` | `public` | [`RecruitmentDBManager`](../wiki/libs.recruitment-db-manager.Class.RecruitmentDBManager) | `undefined` | [src/libs/event-db-manager.ts:8](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/libs/event-db-manager.ts#L8) |
| `studentDB` | `public` | [`StudentDBManager`](../wiki/libs.student-db-manager.Class.StudentDBManager) | `undefined` | [src/libs/event-db-manager.ts:7](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/libs/event-db-manager.ts#L7) |
| `tableName` | `readonly` | `"event"` | `"event"` | [src/libs/event-db-manager.ts:9](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/libs/event-db-manager.ts#L9) |

## Methods

### addRecord()

> **addRecord**(`studentID`, `eventID`): `Promise`\<`RunResult`\>

Adds a record to the Event table representing the given student volunteering for the given event.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `studentID` | `string` | The ID of the student volunteering for the event. |
| `eventID` | `string` | The ID of the event. |

#### Returns

`Promise`\<`RunResult`\>

The result of the database insertion operation.

#### Throws

An error if the student or event does not exist in the database.

#### Defined in

[src/libs/event-db-manager.ts:38](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/libs/event-db-manager.ts#L38)

***

### getEventIDsByStudentID()

> **getEventIDsByStudentID**(`studentID`): `Promise`\<`string`[]\>

Retrieves a list of event IDs of events that the given student is volunteering for.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `studentID` | `string` | The ID of the student. |

#### Returns

`Promise`\<`string`[]\>

A promise that resolves to an array of event IDs.

#### Throws

An error if the student does not exist in the database.

#### Defined in

[src/libs/event-db-manager.ts:69](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/libs/event-db-manager.ts#L69)

***

### getStudentIDsByEventID()

> **getStudentIDsByEventID**(`eventID`): `Promise`\<`string`[]\>

Retrieves a list of student IDs of students volunteering for the given event.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `eventID` | `string` | The ID of the event. |

#### Returns

`Promise`\<`string`[]\>

A promise that resolves to an array of student IDs.

#### Throws

An error if the event does not exist in the database.

#### Defined in

[src/libs/event-db-manager.ts:53](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/libs/event-db-manager.ts#L53)
