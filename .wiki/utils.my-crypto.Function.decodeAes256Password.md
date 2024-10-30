[ulink-volunteer-team-statistics-system-backend](../wiki/Home) / [utils/my-crypto](../wiki/utils.my-crypto) / decodeAes256Password

# Function: decodeAes256Password()

> **decodeAes256Password**(`password`): `object`

Decodes an AES-256 password, which is a string consisting of a 256-bit key and a 128-bit initialization vector (IV) in hexadecimal representation.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `password` | `string` | The password to decode. |

## Returns

`object`

An object containing the key and IV, each as a Buffer.

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `iv` | `Buffer` | [src/utils/my-crypto.ts:25](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/utils/my-crypto.ts#L25) |
| `key` | `Buffer` | [src/utils/my-crypto.ts:24](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/utils/my-crypto.ts#L24) |

## Defined in

[src/utils/my-crypto.ts:20](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/utils/my-crypto.ts#L20)
