[ulink-volunteer-team-statistics-system-backend](../wiki/Home) / [utils/my-crypto](../wiki/utils.my-crypto) / encryptRsa

# Function: encryptRsa()

> **encryptRsa**(`data`, `publicKey`): `string`

Encrypts a string using RSA with OAEP padding and SHA-256 hash.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `data` | `string` | The data to encrypt as a UTF-8 string. |
| `publicKey` | `string` | The public key in PEM format, base64 encoded. |

## Returns

`string`

The encrypted data as a base64 encoded string.

## Defined in

[src/utils/my-crypto.ts:65](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/utils/my-crypto.ts#L65)
