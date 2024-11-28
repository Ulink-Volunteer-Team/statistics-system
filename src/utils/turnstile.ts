import crypto from "crypto";

export function checkTurnstile(token : string, IP : string): boolean {
    const SECRET_KEY = "CF_SECRET_KEY";

    let formData = new FormData();
    formData.append("secret",SECRET_KEY);
    formData.append("response",token);
    formData.append("remoteip",IP);
    formData.append("idempotency_key",crypto.randomUUID());

    const url = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
    const firstResult = await fetch(url, {
      body: formData,
      method: "POST",
    });
    
    const firstOutcome = await firstResult.json();
    return firstOutcome.success;
    
}