[ulink-volunteer-team-statistics-system-backend](../wiki/Home) / [utils/death-event](../wiki/utils.death-event) / DeathEvent

# Class: DeathEvent

## Constructors

### new DeathEvent()

> **new DeathEvent**(`logger`): [`DeathEvent`](../wiki/utils.death-event.Class.DeathEvent)

Initialize the DeathEvent manager.
This will trigger all handlers when death signal is received.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `logger` | `Logger` | The logger to use for logging messages. |

#### Returns

[`DeathEvent`](../wiki/utils.death-event.Class.DeathEvent)

#### Defined in

[src/utils/death-event.ts:15](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/utils/death-event.ts#L15)

## Properties

| Property | Type | Default value | Defined in |
| ------ | ------ | ------ | ------ |
| `count` | `number` | `0` | [src/utils/death-event.ts:9](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/utils/death-event.ts#L9) |
| `handlerNames` | `Map`\<`number`, `string`\> | `undefined` | [src/utils/death-event.ts:8](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/utils/death-event.ts#L8) |
| `handlers` | `Map`\<`number`, () => `boolean` \| `Promise`\<`boolean`\>\> | `undefined` | [src/utils/death-event.ts:7](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/utils/death-event.ts#L7) |

## Methods

### addJob()

> **addJob**(`callback`, `name`?): `number`

Add a job to the death event.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callback` | `Handler` | The callback to be called when the death event is triggered. |
| `name`? | `string` | The name of the handler. If not provided, a default one would be provided |

#### Returns

`number`

A unique identifier for the handler.

#### Defined in

[src/utils/death-event.ts:38](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/utils/death-event.ts#L38)

***

### prepareToDie()

> **prepareToDie**(`logger`): `Promise`\<`boolean`\>

Trigger all handlers

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `logger` | `Logger` |

#### Returns

`Promise`\<`boolean`\>

False if any handler returns false, otherwise true.

#### Defined in

[src/utils/death-event.ts:58](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/utils/death-event.ts#L58)

***

### removeJob()

> **removeJob**(`id`): `void`

Removes a job from the death event.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | `number` | The unique identifier of the handler to be removed. |

#### Returns

`void`

#### Defined in

[src/utils/death-event.ts:49](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/utils/death-event.ts#L49)
