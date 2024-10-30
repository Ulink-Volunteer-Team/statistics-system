import crypto from "crypto";
import http from "http";
import { Buffer, btoa } from "node:buffer";
import console from "console";

// Set the base URL for the API
const baseUrl = 'localhost';
const port = 3000;

// Generate a public-private key pair
const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicExponent: 65537,
    publicKeyEncoding: {
        type: "spki",
        format: "pem",
    },
    privateKeyEncoding: {
        type: "pkcs8",
        format: "pem",
    },
});

function decryptRsa(encrypted, privateKey) {
    const key = crypto.createPrivateKey({
        key: privateKey,
        format: "pem",
        type: "pkcs8",
    });
    const decrypted = crypto.privateDecrypt({
        key: key,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256",
    }, Buffer.from(encrypted, "base64"));
    return decrypted.toString("utf8");
}

function post(path, payload) {
    return new Promise((resolve, reject) => {
        const options = {
            method: 'POST',
            hostname: baseUrl,
            port: port,
            path: path,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk.toString();
            });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(JSON.stringify(payload));
        req.end();
    });
}

export function decodeAes256Password(password) {
    const key = password.slice(0, 64);
    const iv = password.slice(64);
    return {
        key: Buffer.from(key, 'hex'),
        iv: Buffer.from(iv, 'hex')
    };
}


export function encryptAes256(data, password) {
    const { key, iv } = decodeAes256Password(password);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
    return encrypted.toString('base64');
}


export function decryptAes256(encrypted, password) {
    const { key, iv } = decodeAes256Password(password);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    const decrypted = Buffer.concat([decipher.update(Buffer.from(encrypted, 'base64')), decipher.final()]);
    return decrypted.toString('utf8');
}

const { data: handshakeData, api_version } = await post("/handshake", {
    userPublicKey: btoa(publicKey),
});

const { id, key } = JSON.parse(decryptRsa(handshakeData, privateKey));
console.log(`Handshake successful. \nID: ${id}\nKey: ${key}\nAPI version: ${api_version}\n`);

const registerState = await post("/sign-up", {
    session: id,
    data: encryptAes256(JSON.stringify({
        id: "test",
        password: "test",
        permissions: "admin"
    }), key)
});
console.log(`Registration ${registerState.success ? "successful" : "failed"}\n`);

const loginState = await post("/sign-in", {
    session: id,
    data: encryptAes256(JSON.stringify({
        id: "test",
        password: "test"
    }), key)
});
console.log(`Login ${loginState.success ? "successful" : "failed"}\n`);

const token = JSON.parse(decryptAes256(loginState.data, key)).token;
console.log(`Token: ${token}\n`);

const addStudentState = await post("/add-student", {
    session: id,
    data: encryptAes256(JSON.stringify({
        token: token,
        student: {
            name: "test",
            // id: "test-student@example.com"
        }
    }), key)
});
console.log(`Add student ${addStudentState.success ? "successful" : "failed"}\n`);

const addStudentBulkState = await post("/add-student-bulk", {
    session: id,
    data: encryptAes256(JSON.stringify({
        token: token,
        students: new Array(1000).fill(0).map((_, i) => (
            {
                name: "test" + i+100,
                id: `test-student${i+100}@example.com`
            }
        ))
    }), key)
});
console.log(`Add student bulk ${addStudentBulkState.success ? "successful" : "failed"}\n`);

const getStudentBulkState = await post("/get-students", {
    session: id,
    data: encryptAes256(JSON.stringify({
        token: token,
        limit: 5,
        offset: 0
    }), key)
});
console.log(getStudentBulkState)
console.log(`Get student bulk ${getStudentBulkState.success ? "successful" : "failed"}`);
if(getStudentBulkState.success) console.log(`Student bulk: \n${JSON.parse(decryptAes256(getStudentBulkState.data, key)).students.map((s) => (s.name + " - " + s.id)).join("\n")}`);

const fuzzySearchStudentState = await post("/fuzzy-search-student", {
    session: id,
    data: encryptAes256(JSON.stringify({
        token: token,
        queryName: "test122"
    }), key)
});
console.log(fuzzySearchStudentState)
console.log(`\nFuzzy search student ${fuzzySearchStudentState.success ? "successful" : "failed"}`);
if(fuzzySearchStudentState.success) {
    let fuzzySearchResult = JSON.parse(decryptAes256(fuzzySearchStudentState.data, key)).students.map((s) => (s.name + " - " + s.id));
    if(fuzzySearchResult.length > 10) {
        fuzzySearchResult = fuzzySearchResult.slice(0, 10);
        fuzzySearchResult.push("...");
    }
    console.log(`Student bulk: \n${fuzzySearchResult.join("\n")}`);
}

console.log(`\nClose session ${(await post("/close-session", { session: id })).success ? "successful" : "failed"}`);
