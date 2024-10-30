[ulink-volunteer-team-statistics-system-backend](../wiki/Home) / [libs/authentication-manager](../wiki/libs.authentication-manager) / AuthenticationManager

# Class: AuthenticationManager

## Constructors

### new AuthenticationManager()

> **new AuthenticationManager**(`db`, `initCallback`?): [`AuthenticationManager`](../wiki/libs.authentication-manager.Class.AuthenticationManager)

Constructs a new AuthenticationManager instance.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `db` | [`DatabaseWrapper`](../wiki/utils.sqlite-wrapper.Class.DatabaseWrapper) | The DatabaseWrapper instance to be used for database operations. |
| `initCallback`? | () => `void` | A callback function to be called after the database table is ready. |

#### Returns

[`AuthenticationManager`](../wiki/libs.authentication-manager.Class.AuthenticationManager)

#### Defined in

[src/libs/authentication-manager.ts:23](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/libs/authentication-manager.ts#L23)

## Properties

| Property | Modifier | Type | Default value | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| `db` | `public` | [`DatabaseWrapper`](../wiki/utils.sqlite-wrapper.Class.DatabaseWrapper) | `undefined` | [src/libs/authentication-manager.ts:14](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/libs/authentication-manager.ts#L14) |
| `tableName` | `readonly` | `"authentication"` | `"authentication"` | [src/libs/authentication-manager.ts:16](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/libs/authentication-manager.ts#L16) |

## Methods

### addUser()

> **addUser**(`id`, `password`, `permissions`): `Promise`\<`void`\>

Adds a new user to the database with a hashed password.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | `string` | The id to add |
| `password` | `string` | The plain-text password |
| `permissions` | `string` | The permission of the user (not implemented) |

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/libs/authentication-manager.ts:152](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/libs/authentication-manager.ts#L152)

***

### deleteUser()

> **deleteUser**(`id`): `Promise`\<`void`\>

Deletes a user from the database.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | `string` | The id to delete |

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/libs/authentication-manager.ts:177](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/libs/authentication-manager.ts#L177)

***

### generateHash()

> **generateHash**(`password`): `Promise`\<`string`\>

Generates a hash from the password using bcrypt

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `password` | `string` | The plain-text password |

#### Returns

`Promise`\<`string`\>

Hashed password

#### Defined in

[src/libs/authentication-manager.ts:48](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/libs/authentication-manager.ts#L48)

***

### generateToken()

> **generateToken**(`payload`, `expiresIn`): `string`

Generates a JWT token for the user with the given payload.

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `payload` | `string` | `undefined` | The payload (id) to sign |
| `expiresIn` | `string` | `'1d'` | The expiration time for the token (default 1 day) |

#### Returns

`string`

The generated token

#### Defined in

[src/libs/authentication-manager.ts:96](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/libs/authentication-manager.ts#L96)

***

### getUserPermissions()

> **getUserPermissions**(`id`): `Promise`\<`string`\>

Retrieves the permissions of a user

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | `string` | The id of the user whose permissions to retrieve |

#### Returns

`Promise`\<`string`\>

The permission of the user, or a rejected promise if the user does not exist

#### Defined in

[src/libs/authentication-manager.ts:167](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/libs/authentication-manager.ts#L167)

***

### haveMatchingUser()

> **haveMatchingUser**(`id`, `password`): `Promise`\<`boolean`\>

Checks if a user exists with the matching id and password.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | `string` | The id to authenticate |
| `password` | `string` | The plain-text password to check |

#### Returns

`Promise`\<`boolean`\>

Whether a matching user is found

#### Defined in

[src/libs/authentication-manager.ts:68](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/libs/authentication-manager.ts#L68)

***

### haveUser()

> **haveUser**(`id`): `Promise`\<`boolean`\>

Checks if a user with the given id exists in the database.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | `string` | The id to check |

#### Returns

`Promise`\<`boolean`\>

Whether the user exists

#### Defined in

[src/libs/authentication-manager.ts:122](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/libs/authentication-manager.ts#L122)

***

### login()

> **login**(`id`, `password`): `Promise`\<`string`\>

Login a user, returns the token

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | `string` | The id to login |
| `password` | `string` | The corresponding password |

#### Returns

`Promise`\<`string`\>

Token generated, expires in 1 day

#### Defined in

[src/libs/authentication-manager.ts:83](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/libs/authentication-manager.ts#L83)

***

### updatePassword()

> **updatePassword**(`id`, `password`): `Promise`\<`void`\>

Updates the password for a given user.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | `string` | The id whose password to update |
| `password` | `string` | The new plain-text password |

#### Returns

`Promise`\<`void`\>

#### Defined in

[src/libs/authentication-manager.ts:132](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/libs/authentication-manager.ts#L132)

***

### verifyHash()

> **verifyHash**(`password`, `hash`): `Promise`\<`boolean`\>

Verifies if the given password matches the given hash.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `password` | `string` | The plain-text password to verify |
| `hash` | `string` | The hash to compare against |

#### Returns

`Promise`\<`boolean`\>

Whether the password matches the hash

#### Defined in

[src/libs/authentication-manager.ts:58](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/libs/authentication-manager.ts#L58)

***

### verifyToken()

> **verifyToken**(`payload`, `token`): `boolean`

Verifies that a given token matches the given payload （the id).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `payload` | `string` | The expected payload of the token |
| `token` | `string` | The token to verify |

#### Returns

`boolean`

Whether the token matches the payload

#### Defined in

[src/libs/authentication-manager.ts:107](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/libs/authentication-manager.ts#L107)
