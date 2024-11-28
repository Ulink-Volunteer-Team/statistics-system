/**
 * Verifies the given turnstile token with the given secret key.
 * @param token The turnstile token to verify
 * @param secretKey The secret key to verify the token with
 * @param verificationURL The URL to verify the token with. Defaults to the CF Turnstile verification URL.
 * @returns Whether the token is valid.
 */
export function checkTurnstile(token: string, secretKey: string, verificationURL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"): Promise<boolean> {
	return new Promise<boolean>((resolve, reject) => {
		const formData = new FormData();
		formData.append("secret", secretKey);
		formData.append("response", token);

		fetch(verificationURL, {
			body: formData,
			method: "POST",
		})
			.then(response => response.json())
			.then(data => {
				resolve(data.success)
			})
			.catch(err => reject(err));
	})
}
