[ulink-volunteer-team-statistics-system-backend](../wiki/Home) / [libs/server-apis](../wiki/libs.server-apis) / handleApiRequest

# Function: handleApiRequest()

> **handleApiRequest**\<`PayloadType`\>(`req`, `res`, `sessionManager`, `authenticationManager`, `name`, `apiSchema`, `logger`, `handler`): `Promise`\<`void`\>

A template function for handling API requests with session and token validation.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `PayloadType` *extends* `ZodType`\<`any`, `ZodTypeDef`, `any`\> | The type of the payload expected in the request, validated using the provided Zod schema. |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `req` | `Request`\<`ParamsDictionary`, `any`, `any`, `ParsedQs`, `Record`\<`string`, `any`\>\> | The request object from the client. |
| `res` | `Response`\<`any`, `Record`\<`string`, `any`\>\> | The response object to send data back to the client. |
| `sessionManager` | [`SessionManger`](../wiki/libs.session-manager.Class.SessionManger) | Manages sessions for the API requests. |
| `authenticationManager` | [`AuthenticationManager`](../wiki/libs.authentication-manager.Class.AuthenticationManager) | Manages user authentication and token verification. |
| `name` | `string` | The name of the API endpoint being handled. |
| `apiSchema` | `PayloadType` | Zod schema to validate and parse request data. |
| `logger` | `Logger` | Logger instance for logging request handling information. |
| `handler` | (`args`) => `Promise`\<`void` \| `ServerRouteResolveType`\> | Async function to process the validated request data. |

## Returns

`Promise`\<`void`\>

A promise that resolves when the request has been handled and a response has been sent.

## Defined in

[src/libs/server-apis.ts:43](https://github.com/Ulink-Volunteer-Team/statistics-system/blob/main/src/libs/server-apis.ts#L43)
