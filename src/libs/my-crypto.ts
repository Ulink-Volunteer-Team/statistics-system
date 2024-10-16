import crypto from "crypto"

export function generateAes256Password(): string {
    const key = crypto.randomBytes(32).toString('hex');
    const iv = crypto.randomBytes(16).toString('hex');
    return key + iv;
}

export function decodeAes256Password(password: string) {
    const key = password.slice(0, 64);
    const iv = password.slice(64);
    return {
        key: Buffer.from(key, 'hex'),
        iv: Buffer.from(iv, 'hex')
    };
}

export function encryptAes256(data: string, password: string): string {
    const { key, iv } = decodeAes256Password(password);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
    return encrypted.toString('base64');
}

export function decryptAes256(encrypted: string, password: string): string {
    const { key, iv } = decodeAes256Password(password);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    const decrypted = Buffer.concat([decipher.update(Buffer.from(encrypted, 'base64')), decipher.final()]);
    return decrypted.toString('utf8');
}

export function encryptRsa(data: string, publicKey: string) {
    const Key = crypto.createPublicKey({
        key: atob(publicKey),
        format: 'pem',
        type: 'spki'
    });
    const encrypted = crypto.publicEncrypt({
        key: Key,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256'
    }, Buffer.from(data, 'utf8'));
    return encrypted.toString('base64');
}

export function decryptRsa(encrypted: string, privateKey: string) {
    const key = crypto.createPrivateKey({
        key: atob(privateKey),
        format: 'pem',
        type: 'pkcs8'
    });
    const decrypted = crypto.privateDecrypt({
        key: key,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256'
    }, Buffer.from(encrypted, 'base64'));
    return decrypted.toString('utf8');
}

export function generateRsaKeyPair() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
        }
    });
    return { publicKey, privateKey };
}
