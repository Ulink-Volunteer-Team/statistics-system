[ulink-volunteer-team-statistics-system-backend](../wiki/Home) / [libs/session-manager](../wiki/libs.session-manager) / SessionManger

# Class: SessionManger

## Constructors

### new SessionManger()

> **new SessionManger**(): [`SessionManger`](../wiki/libs.session-manager.Class.SessionManger)

#### Returns

[`SessionManger`](../wiki/libs.session-manager.Class.SessionManger)

#### Defined in

[src/libs/session-manager.ts:28](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/libs/session-manager.ts#L28)

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| `sessions` | `readonly` | `Map`\<`string`, `SessionInstanceType`\> | [src/libs/session-manager.ts:27](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/libs/session-manager.ts#L27) |

## Methods

### closeSession()

> **closeSession**(`id`): `void`

Closes a session by removing it from the session map.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | `string` | The ID of the session to close. |

#### Returns

`void`

#### Defined in

[src/libs/session-manager.ts:133](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/libs/session-manager.ts#L133)

***

### createSession()

> **createSession**(`ip`, `userPublicKey`): `string`

Creates a new session and stores it in the sessions map.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `ip` | `string` | The IP address of the client initiating the session. |
| `userPublicKey` | `string` | The public key of the user for secure communication. |

#### Returns

`string`

The unique session ID generated for the session.

#### Defined in

[src/libs/session-manager.ts:39](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/libs/session-manager.ts#L39)

***

### decryptClientData()

> **decryptClientData**\<`T`\>(`data`, `sessionID`): `Partial`\<`T`\>

Decrypts the given data using the key of the given session ID.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` *extends* `ClientDataType` | `ClientDataType` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `data` | `string` | The encrypted data to decrypt. |
| `sessionID` | `string` | The ID of the session to retrieve the key for. |

#### Returns

`Partial`\<`T`\>

The decrypted data if the session exists, throws an error otherwise.

#### Defined in

[src/libs/session-manager.ts:98](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/libs/session-manager.ts#L98)

***

### encryptClientData()

> **encryptClientData**\<`T`\>(`data`, `sessionID`): `string`

Encrypts the given data using the key of the given session ID.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` *extends* `ClientDataType` | `ClientDataType` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `data` | `T` | The data to encrypt. |
| `sessionID` | `string` | The ID of the session to retrieve the key for. |

#### Returns

`string`

The encrypted data if the session exists, throws an error otherwise.

#### Defined in

[src/libs/session-manager.ts:117](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/libs/session-manager.ts#L117)

***

### getSessionData()

> **getSessionData**(`id`): `SessionInstanceType`

Gets the session data by ID.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | `string` | The ID of the session to retrieve. |

#### Returns

`SessionInstanceType`

The session data if found, otherwise throws an error.

#### Defined in

[src/libs/session-manager.ts:74](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/libs/session-manager.ts#L74)

***

### getSessionKey()

> **getSessionKey**(`id`): `undefined` \| `string`

Retrieves the encryption key of a session by its ID.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | `string` | The ID of the session to retrieve the key for. |

#### Returns

`undefined` \| `string`

The encryption key if the session exists, undefined otherwise.

#### Defined in

[src/libs/session-manager.ts:86](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/libs/session-manager.ts#L86)

***

### haveSession()

> **haveSession**(`id`): `boolean`

Checks if a session with the given ID exists in the sessions map.
Returns true if the session exists, false otherwise.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | `string` | The ID of the session to check. |

#### Returns

`boolean`

Whether the session exists.

#### Defined in

[src/libs/session-manager.ts:59](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/libs/session-manager.ts#L59)
