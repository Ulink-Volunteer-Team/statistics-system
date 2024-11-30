import { curly } from "node-libcurl";

type Logger = { info: (message: string) => void, error: (message: string) => void };

const defaultLogger = {
	info: console.log,
	error: console.error
}

const TURNSTILE_ERROR_CODES = {
	"missing-input-secret": "The secret parameter is missing.",
	"invalid-input-secret": "The secret parameter is invalid or does not exist.",
	"missing-input-response": "The response parameter (token) is missing.",
	"invalid-input-response": "The response parameter (token) is invalid, expired, or possibly fake. If the issue persists, contact customer support.",
	"bad-request": "The request was rejected due to being malformed.",
	"timeout-or-duplicate": "The response parameter (token) is either expired (issued over five minutes ago) or has already been validated.",
	"internal-error": "An internal error occurred during response validation. Please retry the request."
  }


/**
 * Verifies the given turnstile token with the given secret key.
 * @param token The turnstile token to verify
 * @param secretKey The secret key to verify the token with
 * @param verificationURL The URL to verify the token with. Defaults to the CF Turnstile verification URL.
 * @returns Whether the token is valid.
 */
export async function checkTurnstile(token: string, secretKey: string, verificationURL = "https://challenges.cloudflare.com/turnstile/v0/siteverify", logger: Logger = defaultLogger): Promise<boolean> {
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

	if(!data.success) {
		for(const [code, message] of Object.entries(TURNSTILE_ERROR_CODES)) {
			if(data.error_code === code) {
				logger.error(message);
			}
		}
	}

	return data.success;
}
