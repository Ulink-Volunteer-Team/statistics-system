[ulink-volunteer-team-statistics-system-backend](../wiki/Home) / [utils/sqlite-wrapper](../wiki/utils.sqlite-wrapper) / DatabaseWrapper

# Class: DatabaseWrapper

## Constructors

### new DatabaseWrapper()

> **new DatabaseWrapper**(`dbName`, `dbDirectory`, `deathEvent`, `logger`): [`DatabaseWrapper`](../wiki/utils.sqlite-wrapper.Class.DatabaseWrapper)

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `dbName` | `string` | `undefined` | The name of the database file, without extension. |
| `dbDirectory` | `string` | `"./"` | Optional: directory path where the DB file will be saved. |
| `deathEvent` | [`DeathEvent`](../wiki/utils.death-event.Class.DeathEvent) | `undefined` | The death event manager |
| `logger` | [`Logger`](../wiki/utils.sqlite-wrapper.TypeAlias.Logger) | `...` | Optional: logger for debugging. |

#### Returns

[`DatabaseWrapper`](../wiki/utils.sqlite-wrapper.Class.DatabaseWrapper)

#### Defined in

[src/utils/sqlite-wrapper.ts:71](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/utils/sqlite-wrapper.ts#L71)

## Properties

| Property | Modifier | Type | Default value | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| `cacheRecordMaximum` | `readonly` | `number` | `512` | [src/utils/sqlite-wrapper.ts:61](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/utils/sqlite-wrapper.ts#L61) |
| `db` | `readonly` | `Database` | `undefined` | [src/utils/sqlite-wrapper.ts:57](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/utils/sqlite-wrapper.ts#L57) |
| `dbPath` | `readonly` | `string` | `undefined` | [src/utils/sqlite-wrapper.ts:59](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/utils/sqlite-wrapper.ts#L59) |
| `deathEvent` | `readonly` | [`DeathEvent`](../wiki/utils.death-event.Class.DeathEvent) | `undefined` | [src/utils/sqlite-wrapper.ts:63](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/utils/sqlite-wrapper.ts#L63) |
| `logger` | `readonly` | [`Logger`](../wiki/utils.sqlite-wrapper.TypeAlias.Logger) | `undefined` | [src/utils/sqlite-wrapper.ts:60](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/utils/sqlite-wrapper.ts#L60) |

## Methods

### beginTransaction()

> **beginTransaction**(): `void`

Begins a new transaction.

This method will throw an error if a transaction is already in progress.

#### Returns

`void`

#### Throws

If there is an error beginning the transaction.

#### Defined in

[src/utils/sqlite-wrapper.ts:356](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/utils/sqlite-wrapper.ts#L356)

***

### close()

> **close**(): `boolean`

Closes the database.

#### Returns

`boolean`

#### Throws

If there is an error closing the database.

#### Defined in

[src/utils/sqlite-wrapper.ts:402](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/utils/sqlite-wrapper.ts#L402)

***

### commitTransaction()

> **commitTransaction**(): `void`

Commits the current transaction.

This method will throw an error if no transaction is in progress.

#### Returns

`void`

#### Throws

If there is an error committing the transaction.

#### Defined in

[src/utils/sqlite-wrapper.ts:372](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/utils/sqlite-wrapper.ts#L372)

***

### delete()

> **delete**(`tableName`, `conditions`): `Promise`\<`RunResult`\>

Deletes rows from the specified table where the conditions are met.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `tableName` | `string` | The name of the table to delete from. |
| `conditions` | [`WhereConditionItemType`](../wiki/utils.sqlite-wrapper.TypeAlias.WhereConditionItemType)[] | An array of conditions to determine which rows to delete. |

#### Returns

`Promise`\<`RunResult`\>

#### Throws

If there is an error deleting the data.

#### Defined in

[src/utils/sqlite-wrapper.ts:332](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/utils/sqlite-wrapper.ts#L332)

***

### deleteTable()

> **deleteTable**(`tableName`): `Promise`\<`void`\>

Deletes a table from the database.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `tableName` | `string` | The name of the table to delete. |

#### Returns

`Promise`\<`void`\>

#### Throws

If the table does not exist or if there is an error deleting the table.

#### Defined in

[src/utils/sqlite-wrapper.ts:138](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/utils/sqlite-wrapper.ts#L138)

***

### insert()

> **insert**(`tableName`, `dataFrame`): `Promise`\<`RunResult`\>

Inserts a new row into the table.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `tableName` | `string` | The name of the table to insert into. |
| `dataFrame` | [`TableFrameDataType`](../wiki/utils.sqlite-wrapper.TypeAlias.TableFrameDataType)[] | An object with the column names as keys and the values to insert as values. |

#### Returns

`Promise`\<`RunResult`\>

#### Throws

If there is an error inserting the data.

#### Defined in

[src/utils/sqlite-wrapper.ts:270](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/utils/sqlite-wrapper.ts#L270)

***

### prepareTable()

> **prepareTable**(`tableName`, `frame`): `Promise`\<`void`\>

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `tableName` | `string` | The name of the table. |
| `frame` | [`TableFrameInitType`](../wiki/utils.sqlite-wrapper.TypeAlias.TableFrameInitType) | An object where the keys are the column names and the values are the data types. Creates a new table with the specified columns. |

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/utils/sqlite-wrapper.ts:107](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/utils/sqlite-wrapper.ts#L107)

***

### rollbackTransaction()

> **rollbackTransaction**(): `void`

Rolls back the current transaction.

This method will throw an error if no transaction is in progress.

#### Returns

`void`

#### Throws

If there is an error rolling back the transaction.

#### Defined in

[src/utils/sqlite-wrapper.ts:388](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/utils/sqlite-wrapper.ts#L388)

***

### select()

> **select**\<`T`\>(`tableName`, `columns`, `conditions`, `limit`, `offset`): `Promise`\<`T`[]\>

Fetches data from the specified table based on the given conditions.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` *extends* `QueryResult` | `QueryResult` |

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `tableName` | `string` | `undefined` | The name of the table to query from. |
| `columns` | `string`[] | `undefined` | The columns to fetch from the table. |
| `conditions` | [`WhereConditionItemType`](../wiki/utils.sqlite-wrapper.TypeAlias.WhereConditionItemType)[] | `[]` | An array of conditions to filter the data by. |
| `limit` | `number` | `0` | The maximum number of rows to fetch. |
| `offset` | `number` | `0` | The number of rows to skip before fetching. |

#### Returns

`Promise`\<`T`[]\>

An array of objects representing the fetched data.

#### Throws

If there is an error fetching the filtered data.

#### Defined in

[src/utils/sqlite-wrapper.ts:232](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/utils/sqlite-wrapper.ts#L232)

***

### update()

> **update**(`tableName`, `dataFrame`, `conditions`): `Promise`\<`RunResult`\>

Updates rows in the specified table where the conditions are met.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `tableName` | `string` | The name of the table to update. |
| `dataFrame` | [`TableFrameDataType`](../wiki/utils.sqlite-wrapper.TypeAlias.TableFrameDataType) | An object representing the column names and the new values to update. |
| `conditions` | [`WhereConditionItemType`](../wiki/utils.sqlite-wrapper.TypeAlias.WhereConditionItemType)[] | An array of conditions to determine which rows to update. |

#### Returns

`Promise`\<`RunResult`\>

#### Throws

If there is an error updating the data.

#### Defined in

[src/utils/sqlite-wrapper.ts:301](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/utils/sqlite-wrapper.ts#L301)
