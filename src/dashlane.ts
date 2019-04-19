import { createDecipheriv, createHash, pbkdf2Sync, Hash } from "crypto";
import { inflateSync } from "zlib";
import { request } from "./helpers";

const argon2 = require("argon2-browser");

class Dashlane {
  private username: string;
  private password: string;
  private uki: string;

  constructor(username: string, password: string, uki: string = "") {
    this.username = username;
    this.password = password;
    this.uki = uki;
  }

  decipherArgon2 = async (data: Buffer) => {
    const salt = data.slice(0, 16);
    const iv = data.slice(16, 32);
    const cipher = data.slice(64);
    const { hash } = await argon2.hash({
      pass: this.password,
      salt,
      time: 3,
      mem: 32768,
      parallelism: 2,
      hashLen: 32,
      type: argon2.ArgonType.Argon2d,
      distPath: "./argon2/dist/"
    });
    const sha512 = createHash("sha512");
    const sha512ed = sha512.update(hash).digest();
    const cipherKey = sha512ed.slice(0, 32);
    const hmacKey = sha512ed.slice(32, 64);
    const decipher = createDecipheriv("aes-256-cbc", cipherKey, iv);
    decipher.setAutoPadding(false);
    const plaintext = Buffer.concat([
      decipher.update(cipher),
      decipher.final()
    ]);
    return this.uncompress(plaintext.slice(4));
  };

  uncompress = async (data: Buffer) => {
    const inflate = inflateSync(data);
    return Buffer.from(inflate.toString()).toString();
  };

  decipherPBKDF2 = async (data: Buffer, scheme: any) => {
    let { salt, version, iv, cipher, iterations, digest, compressed } = scheme;
    let keyIV: any;
    let cipherKey = pbkdf2Sync(this.password, salt, iterations, 32, digest);
    if (iv === "generate") {
      [keyIV, iv] = await this.getPBKDF2IV(cipherKey, salt, version);
      if (version !== "KWC3" && version !== "PBKDF2S") {
        cipherKey = keyIV;
      }
    } else {
      const hash = createHash("sha512");
      cipherKey = hash
        .update(cipherKey)
        .digest()
        .slice(0, 32);
    }
    const decipher = createDecipheriv("aes-256-cbc", cipherKey, iv);
    decipher.setAutoPadding(false);
    const plaintext = Buffer.concat([
      decipher.update(cipher),
      decipher.final()
    ]);
    return compressed ? this.uncompress(plaintext.slice(4)) : plaintext;
  };

  getPBKDF2IV = async (key: Buffer, salt: Buffer, version: string) => {
    let salted = Buffer.concat([key, salt.slice(0, 8)]);
    const parts = [Buffer.from("")];
    for (let i = 0; i < 3; i++) {
      let partSalted = Buffer.concat([parts[parts.length - 1], salted]);
      let sha1ed = this.pbkdf2Sha1(partSalted, version === "KWC3" ? 1 : 5);
      parts.push(sha1ed);
    }
    const keyIV = Buffer.concat(parts);
    return [keyIV.slice(0, 32), keyIV.slice(32, 48)];
  };

  pbkdf2Sha1 = (bytes: Buffer, iterations: number) => {
    for (let i = 0; i < iterations; i++) {
      bytes = createHash("sha1")
        .update(bytes)
        .digest();
    }
    return bytes;
  };

  getVault = async () => {
    const { fullBackupFile, content } = await request("/12/backup/latest", {
      login: this.username,
      uki: this.uki,
      lock: "nolock",
      timestamp: 1,
      sharingTimestamp: 0
    });
    if (content === "Incorrect authentification")
      throw new Error("Invalid username/password.");
    return fullBackupFile;
  };

  getData = async (base64vault: string) => {
    const rawVault = Buffer.from(base64vault, "base64").toString();
    const type = rawVault.slice(3, 9);
    switch (type) {
      case "argon2":
        return await this.decipherArgon2(
          Buffer.from(base64vault, "base64").slice(42)
        );
      case "pbkdf2": {
        const data = Buffer.from(base64vault, "base64").slice(45);
        return await this.decipherPBKDF2(
          Buffer.from(base64vault, "base64").slice(45),
          {
            iterations: 200000,
            salt: data.slice(0, 16),
            version: "PBKDF2S",
            cipher: data.slice(64), //salt/iv/hmachash(32)/ciphers
            iv: data.slice(16, 32),
            digest: "sha256",
            compressed: true
          }
        );
      }
      default: {
        const data = Buffer.from(base64vault, "base64");
        return await this.decipherPBKDF2(Buffer.from(base64vault, "base64"), {
          iterations: 10204,
          salt: data.slice(0, 32),
          version: data.slice(32, 36),
          cipher: data.slice(
            data.slice(32, 36).toString() === "KWC3" ? 36 : 32
          ),
          digest: "sha1",
          iv: "generate",
          compressed: data.slice(32, 36).toString() === "KWC3"
        });
      }
    }
  };

  sendToken = async () => {
    const response = await request("/7/authentication/sendtoken", {
      login: this.username
    });
    return response === "SUCCESS";
  };

  registerUKI = async (token: number) => {
    const uki = "new test?";
    const response = await request("/7/authentication/registeruki", {
      login: this.username,
      devicename: "Profile Lens",
      platform: "App",
      temporary: 0,
      token,
      uki
    });
    if (response === "SUCCESS") {
      this.uki = uki;
      return true;
    }
    return false;
  };
}

const dashlane = new Dashlane(
  "inovicsolutions@yahoo.com",
  "Sibi1234@",
  "dde391cc0e314c309343243534335291-11223bf2-bc61-43f8-8e54-eb4d40e258b0"
);
dashlane
  .getVault()
  .then(dashlane.getData)
  .then(console.log)
  .catch(console.log);
