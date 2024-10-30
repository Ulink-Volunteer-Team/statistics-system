[ulink-volunteer-team-statistics-system-backend](../wiki/Home) / [libs/recruitment-db-manager](../wiki/libs.recruitment-db-manager) / RecruitmentDBManager

# Class: RecruitmentDBManager

## Constructors

### new RecruitmentDBManager()

> **new RecruitmentDBManager**(`db`, `initCallback`?): [`RecruitmentDBManager`](../wiki/libs.recruitment-db-manager.Class.RecruitmentDBManager)

Constructs a new RecruitmentDBManager instance.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `db` | [`DatabaseWrapper`](../wiki/utils.sqlite-wrapper.Class.DatabaseWrapper) | The DatabaseWrapper instance to be used for database operations. |
| `initCallback`? | () => `void` | An optional callback function to be called after the database table is prepared. |

#### Returns

[`RecruitmentDBManager`](../wiki/libs.recruitment-db-manager.Class.RecruitmentDBManager)

#### Defined in

[src/libs/recruitment-db-manager.ts:22](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/libs/recruitment-db-manager.ts#L22)

## Properties

| Property | Modifier | Type | Default value | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| `tableName` | `readonly` | `"recruitment"` | `"recruitment"` | [src/libs/recruitment-db-manager.ts:16](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/libs/recruitment-db-manager.ts#L16) |

## Methods

### addRecruitment()

> **addRecruitment**(`recruitment`): `Promise`\<`RunResult`\>

Adds a new recruitment to the database.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `recruitment` | `Partial`\<[`RecruitmentDataType`](../wiki/libs.recruitment-db-manager.TypeAlias.RecruitmentDataType)\> | A partial RecruitmentDataType object to be inserted. The id field is automatically generated. |

#### Returns

`Promise`\<`RunResult`\>

The result of the insert command.

#### Defined in

[src/libs/recruitment-db-manager.ts:63](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/libs/recruitment-db-manager.ts#L63)

***

### fuzzySearch()

> **fuzzySearch**(`fields`, `search`): `Promise`\<[`RecruitmentDataType`](../wiki/libs.recruitment-db-manager.TypeAlias.RecruitmentDataType)[]\>

Searches for recruitments based on the given fields and search strings.
The search strings are matched using the LIKE operator with the % wildcard.
The search results are AND'd together.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `fields` | (`"department"` \| `"formFilledBy"` \| `"eventName"`)[] | The fields to search in. Allowed values are "department", "formFilledBy", and "eventName". |
| `search` | `string`[] | The search strings to match. |

#### Returns

`Promise`\<[`RecruitmentDataType`](../wiki/libs.recruitment-db-manager.TypeAlias.RecruitmentDataType)[]\>

An array of RecruitmentDataType objects that match the search criteria.

#### Defined in

[src/libs/recruitment-db-manager.ts:134](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/libs/recruitment-db-manager.ts#L134)

***

### getRecruitment()

> **getRecruitment**(`id`): `Promise`\<[`RecruitmentDataType`](../wiki/libs.recruitment-db-manager.TypeAlias.RecruitmentDataType)\>

Gets a recruitment by id.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | `string` | The id of the recruitment. |

#### Returns

`Promise`\<[`RecruitmentDataType`](../wiki/libs.recruitment-db-manager.TypeAlias.RecruitmentDataType)\>

The recruitment with the given id, or undefined if it does not exist.

#### Defined in

[src/libs/recruitment-db-manager.ts:81](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/libs/recruitment-db-manager.ts#L81)

***

### haveRecruitment()

> **haveRecruitment**(`id`): `Promise`\<`boolean`\>

Checks if a recruitment with the given id exists in the database.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | `string` | The id to check |

#### Returns

`Promise`\<`boolean`\>

Whether a recruitment with the given id exists

#### Defined in

[src/libs/recruitment-db-manager.ts:95](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/libs/recruitment-db-manager.ts#L95)

***

### removeRecruitment()

> **removeRecruitment**(`id`): `Promise`\<`RunResult`\>

Deletes a recruitment from the database.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | `string` | The id of the recruitment to delete. |

#### Returns

`Promise`\<`RunResult`\>

The result of the delete command.

#### Throws

If the recruitment with the given id does not exist.

#### Defined in

[src/libs/recruitment-db-manager.ts:149](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/libs/recruitment-db-manager.ts#L149)

***

### updateRecruitment()

> **updateRecruitment**(`id`, `recruitment`): `Promise`\<`RunResult`\>

Updates the recruitment data for a given id.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | `string` | The id of the recruitment to update. |
| `recruitment` | `Partial`\<[`RecruitmentDataType`](../wiki/libs.recruitment-db-manager.TypeAlias.RecruitmentDataType)\> | A partial RecruitmentDataType object containing the fields to update. |

#### Returns

`Promise`\<`RunResult`\>

The result of the update command.

#### Throws

If the recruitment with the given id does not exist.

#### Defined in

[src/libs/recruitment-db-manager.ts:112](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/libs/recruitment-db-manager.ts#L112)
