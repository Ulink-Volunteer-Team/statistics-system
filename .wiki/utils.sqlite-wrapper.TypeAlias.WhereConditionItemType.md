[ulink-volunteer-team-statistics-system-backend](../wiki/Home) / [utils/sqlite-wrapper](../wiki/utils.sqlite-wrapper) / WhereConditionItemType

# Type Alias: WhereConditionItemType

> **WhereConditionItemType**: `object`

## Type declaration

| Name | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| `compared` | [`AvailableDataTypeType`](../wiki/utils.sqlite-wrapper.TypeAlias.AvailableDataTypeType) | The compared value | [src/utils/sqlite-wrapper.ts:12](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/utils/sqlite-wrapper.ts#L12) |
| `key` | `string` | The column name | [src/utils/sqlite-wrapper.ts:8](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/utils/sqlite-wrapper.ts#L8) |
| `logicalOperator` | `"AND"` \| `"OR"` | The logical operator. it will be ignored if its item comes first in the expression | [src/utils/sqlite-wrapper.ts:14](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/utils/sqlite-wrapper.ts#L14) |
| `operator` | `"="` \| `">"` \| `"<"` \| `">="` \| `"<="` \| `"!="` \| `"LIKE"` | The comparison operator | [src/utils/sqlite-wrapper.ts:10](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/utils/sqlite-wrapper.ts#L10) |

## Defined in

[src/utils/sqlite-wrapper.ts:6](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/utils/sqlite-wrapper.ts#L6)
