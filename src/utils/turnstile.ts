import { curly } from "node-libcurl";

/**
 * Verifies the given turnstile token with the given secret key.
 * @param token The turnstile token to verify
 * @param secretKey The secret key to verify the token with
 * @param verificationURL The URL to verify the token with. Defaults to the CF Turnstile verification URL.
 * @returns Whether the token is valid.
 */
export async function checkTurnstile(token: string, secretKey: string, verificationURL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"): Promise<boolean> {
	const { data } = await curly.post(verificationURL, {
		postFields: JSON.stringify({
			secret: secretKey,
			response: token
		}),
		httpHeader: [
			'Content-Type: application/json',
			'Accept: application/json'
		],
	})

	return data;
}
