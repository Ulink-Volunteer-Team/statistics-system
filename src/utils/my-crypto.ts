import crypto from "crypto";

/**
 * Generates a random AES-256 password, which includes a 256-bit key and a 128-bit initialization vector (IV).
 * 
 * @returns A string consisting of the hexadecimal representation (`<Key><IV>`).
 */
export function generateAes256Password(): string {
    const key = crypto.randomBytes(32).toString('hex');
    const iv = crypto.randomBytes(16).toString('hex');
    return key + iv;
}

/**
 * Decodes an AES-256 password, which is a string consisting of a 256-bit key and a 128-bit initialization vector (IV) in hexadecimal representation.
 * 
 * @param password The password to decode.
 * @returns An object containing the key and IV, each as a Buffer.
 */
export function decodeAes256Password(password: string) {
    const key = password.slice(0, 64);
    const iv = password.slice(64);
    return {
        key: Buffer.from(key, 'hex'),
        iv: Buffer.from(iv, 'hex')
    };
}

/**
 * Encrypts a string using AES-256 in CBC mode.
 * 
 * @param data The data to encrypt.
 * @param password A string consisting of a 256-bit key and a 128-bit initialization vector (IV) in hexadecimal representation.
 * @returns The encrypted data as a base64 encoded string.
 */
export function encryptAes256(data: string, password: string): string {
    const { key, iv } = decodeAes256Password(password);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
    return encrypted.toString('base64');
}


/**
 * Decrypts a base64 encoded string using AES-256 in CBC mode.
 * 
 * @param encrypted - The encrypted data as a base64 encoded string.
 * @param password - A string consisting of a 256-bit key and a 128-bit initialization vector (IV) in hexadecimal representation.
 * @returns The decrypted data as a UTF-8 string.
 */
export function decryptAes256(encrypted: string, password: string): string {
    const { key, iv } = decodeAes256Password(password);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    const decrypted = Buffer.concat([decipher.update(Buffer.from(encrypted, 'base64')), decipher.final()]);
    return decrypted.toString('utf8');
}

/**
 * Encrypts a string using RSA with OAEP padding and SHA-256 hash.
 * 
 * @param data - The data to encrypt as a UTF-8 string.
 * @param publicKey - The public key in PEM format, base64 encoded.
 * @returns The encrypted data as a base64 encoded string.
 */
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

/**
 * Decrypts a base64 encoded string using RSA with OAEP padding and SHA-256 hash.
 * 
 * @param encrypted - The encrypted data as a base64 encoded string.
 * @param privateKey - The private key in PEM format, base64 encoded.
 * @returns The decrypted data as a UTF-8 string.
 */
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

/**
 * Generates a public-private key pair using RSA with a modulus length of 2048.
 * 
 * @returns An object containing the public and private keys, each as a PEM encoded string.
 */
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
