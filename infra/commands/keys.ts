import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

export default async function (args: string[]) {
    try {
        // check for existing keys dir
    const keys_dir = path.join(process.cwd(), "keys");
    if (fs.existsSync(keys_dir)) {
        console.log("⚠️ Keys already exists");
        return;
    }
    
    // create keys dir
    fs.mkdirSync(keys_dir);
    
    // create key-pairs RS256
    const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: "spki",
            format: "pem",
        },
        privateKeyEncoding: {
            type: "pkcs8",
            format: "pem",
        },
    });

    // write key-pairs to files
    fs.writeFileSync(path.join(keys_dir, "private.pem"), privateKey);
    fs.writeFileSync(path.join(keys_dir, "public.pem"), publicKey);

    console.log("✅ Kes are created!");
    }

    catch (error) {
        console.error("❌ Error creating keys:", error);
    }
}