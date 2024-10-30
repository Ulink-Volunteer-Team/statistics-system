[ulink-volunteer-team-statistics-system-backend](../wiki/Home) / [utils/my-crypto](../wiki/utils.my-crypto) / encryptAes256

# Function: encryptAes256()

> **encryptAes256**(`data`, `password`): `string`

Encrypts a string using AES-256 in CBC mode.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `data` | `string` | The data to encrypt. |
| `password` | `string` | A string consisting of a 256-bit key and a 128-bit initialization vector (IV) in hexadecimal representation. |

## Returns

`string`

The encrypted data as a base64 encoded string.

## Defined in

[src/utils/my-crypto.ts:36](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/utils/my-crypto.ts#L36)
