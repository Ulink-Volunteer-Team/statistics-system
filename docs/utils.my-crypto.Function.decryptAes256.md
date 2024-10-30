[ulink-volunteer-team-statistics-system-backend](../wiki/Home) / [utils/my-crypto](../wiki/utils.my-crypto) / decryptAes256

# Function: decryptAes256()

> **decryptAes256**(`encrypted`, `password`): `string`

Decrypts a base64 encoded string using AES-256 in CBC mode.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `encrypted` | `string` | The encrypted data as a base64 encoded string. |
| `password` | `string` | A string consisting of a 256-bit key and a 128-bit initialization vector (IV) in hexadecimal representation. |

## Returns

`string`

The decrypted data as a UTF-8 string.

## Defined in

[src/utils/my-crypto.ts:51](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/utils/my-crypto.ts#L51)
