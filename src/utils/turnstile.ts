import crypto from "crypto";

export function CheckTurnstile(token : string, IP : string): boolean {
    const SECRET_KEY = "CF_SECRET_KEY";

    const formData = new FormData();
    formData.append("secret",SECRET_KEY);
    formData.append("response",token);
    formData.append("remoteip",IP);
    formData.append("idempotency_key",crypto.randomUUID());

    const url = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
    var ret = false;
    fetch(url, {
      body: formData,
      method: "POST",
    })
    .then(response => response.json())
    .then(data => {
        ret = data.success
    })
    .catch(err => console.warn(err));
    
    return ret;
    
}