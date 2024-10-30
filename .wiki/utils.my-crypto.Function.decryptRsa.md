[ulink-volunteer-team-statistics-system-backend](../wiki/Home) / [utils/my-crypto](../wiki/utils.my-crypto) / decryptRsa

# Function: decryptRsa()

> **decryptRsa**(`encrypted`, `privateKey`): `string`

Decrypts a base64 encoded string using RSA with OAEP padding and SHA-256 hash.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `encrypted` | `string` | The encrypted data as a base64 encoded string. |
| `privateKey` | `string` | The private key in PEM format, base64 encoded. |

## Returns

`string`

The decrypted data as a UTF-8 string.

## Defined in

[src/utils/my-crypto.ts:86](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/utils/my-crypto.ts#L86)
