
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
