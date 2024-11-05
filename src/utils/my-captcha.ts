import Captcha from "trek-captcha";

export async function generateCaptcha() {
    const value = await Captcha();

    return {
        token: value.token,
        img: value.buffer.toString('base64')
    };
}
