[ulink-volunteer-team-statistics-system-backend](../wiki/Home) / [libs/student-db-manager](../wiki/libs.student-db-manager) / StudentDBManager

# Class: StudentDBManager

## Constructors

### new StudentDBManager()

> **new StudentDBManager**(`db`, `initCallback`?): [`StudentDBManager`](../wiki/libs.student-db-manager.Class.StudentDBManager)

Constructs a new StudentDBManager instance.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `db` | [`DatabaseWrapper`](../wiki/utils.sqlite-wrapper.Class.DatabaseWrapper) | The DatabaseWrapper instance to be used for database operations. |
| `initCallback`? | () => `void` | A callback function to be called after the database table is ready. |

#### Returns

[`StudentDBManager`](../wiki/libs.student-db-manager.Class.StudentDBManager)

#### Defined in

[src/libs/student-db-manager.ts:17](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/libs/student-db-manager.ts#L17)

## Properties

| Property | Modifier | Type | Default value | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| `tableName` | `readonly` | `"students"` | `"students"` | [src/libs/student-db-manager.ts:11](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/libs/student-db-manager.ts#L11) |

## Methods

### addStudent()

> **addStudent**(`student`): `Promise`\<`RunResult`\>

Adds a new student with the given information to the database.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `student` | [`StudentType`](../wiki/libs.student-db-manager.TypeAlias.StudentType) | An object with the student's information: id and name. |

#### Returns

`Promise`\<`RunResult`\>

The row ID of the newly inserted student.

#### Defined in

[src/libs/student-db-manager.ts:38](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/libs/student-db-manager.ts#L38)

***

### addStudentsBulk()

> **addStudentsBulk**(`students`): `Promise`\<`RunResult`\>

Adds multiple students to the database in a single operation.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `students` | [`StudentType`](../wiki/libs.student-db-manager.TypeAlias.StudentType)[] | An array of student objects, each containing an id and name. |

#### Returns

`Promise`\<`RunResult`\>

The result of the database insertion operation.

#### Throws

An error if any of the students already exist in the database.

#### Defined in

[src/libs/student-db-manager.ts:49](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/libs/student-db-manager.ts#L49)

***

### findById()

> **findById**(`id`): `Promise`\<`undefined` \| [`StudentType`](../wiki/libs.student-db-manager.TypeAlias.StudentType)\>

Finds a student by their ID and returns them.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | `string` | The ID of the student to find. |

#### Returns

`Promise`\<`undefined` \| [`StudentType`](../wiki/libs.student-db-manager.TypeAlias.StudentType)\>

The student if found, otherwise undefined.

#### Defined in

[src/libs/student-db-manager.ts:117](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/libs/student-db-manager.ts#L117)

***

### fuzzySearchStudent()

> **fuzzySearchStudent**(`name`): `Promise`\<[`StudentType`](../wiki/libs.student-db-manager.TypeAlias.StudentType)[]\>

Performs a fuzzy search for students whose names match the *given pattern*.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | The pattern to search for in student names. |

#### Returns

`Promise`\<[`StudentType`](../wiki/libs.student-db-manager.TypeAlias.StudentType)[]\>

An array of students with names matching the pattern.

#### Defined in

[src/libs/student-db-manager.ts:132](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/libs/student-db-manager.ts#L132)

***

### getStudents()

> **getStudents**(`num`, `offset`): `Promise`\<[`StudentType`](../wiki/libs.student-db-manager.TypeAlias.StudentType)[]\>

Retrieves a list of students from the database.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `num` | `number` | The maximum number of students to retrieve. |
| `offset` | `number` | The number of students to skip before starting to collect the result set. |

#### Returns

`Promise`\<[`StudentType`](../wiki/libs.student-db-manager.TypeAlias.StudentType)[]\>

A promise that resolves to an array of students.

#### Defined in

[src/libs/student-db-manager.ts:93](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/libs/student-db-manager.ts#L93)

***

### haveStudentID()

> **haveStudentID**(`id`): `Promise`\<`boolean`\>

Checks if a student exists with the given ID.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | `string` | The ID of the student to check. |

#### Returns

`Promise`\<`boolean`\>

Whether a student with the given ID exists.

#### Defined in

[src/libs/student-db-manager.ts:102](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/libs/student-db-manager.ts#L102)

***

### removeStudent()

> **removeStudent**(`id`): `Promise`\<`RunResult`\>

Removes a student from the database by their ID.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | `string` | The ID of the student to remove. |

#### Returns

`Promise`\<`RunResult`\>

#### Defined in

[src/libs/student-db-manager.ts:60](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/libs/student-db-manager.ts#L60)

***

### updateStudent()

> **updateStudent**(`id`, `name`): `Promise`\<`RunResult`\>

Updates the name of a student with the given ID.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | `string` | The ID of the student to update. |
| `name` | `string` | The new name of the student. |

#### Returns

`Promise`\<`RunResult`\>

The number of rows changed.

#### Defined in

[src/libs/student-db-manager.ts:76](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/libs/student-db-manager.ts#L76)
