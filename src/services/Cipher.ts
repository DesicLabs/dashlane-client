import { createHash, createDecipheriv, pbkdf2Sync } from "crypto";
//@ts-ignore
import * as argon2 from "../argon2/argon2";
import { Scheme } from "../types";
import { uncompress } from "../utilities";

export class Cipher {
  private password: string;
  private data: Buffer;

  public async decipherData(password: string, data: string): Promise<string> {
    this.password = password;
    this.data = Buffer.from(data, "base64");
    const type = this.data.slice(3, 9).toString();
    switch (type) {
      case "argon2":
        return await this.decipherArgon2(this.data.slice(42));
      case "pbkdf2": {
        const slicedData = this.data.slice(45);
        return await this.decipherPBKDF2({
          iterations: 200000,
          salt: slicedData.slice(0, 16),
          version: "PBKDF2S",
          cipher: slicedData.slice(64), //salt/iv/hmachash(32)/ciphers
          iv: slicedData.slice(16, 32),
          digest: "sha256",
          compressed: true
        });
      }
      default: {
        return await this.decipherPBKDF2({
          iterations: 10204,
          salt: this.data.slice(0, 32),
          version: this.data.slice(32, 36).toString(),
          cipher: this.data.slice(
            this.data.slice(32, 36).toString() === "KWC3" ? 36 : 32
          ),
          digest: "sha1",
          iv: Buffer.from(""),
          compressed: this.data.slice(32, 36).toString() === "KWC3"
        });
      }
    }
  }

  private async decipherArgon2(data: Buffer): Promise<string> {
    const salt = data.slice(0, 16);
    const iv = data.slice(16, 32);
    const cipher = data.slice(64);
    const hash = await argon2.hash(this.password, {
      salt,
      timeCost: 3,
      memoryCost: 32768,
      parallelism: 2,
      hashLength: 32,
      type: 0
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
    return uncompress(plaintext.slice(4));
  }

  private async decipherPBKDF2(scheme: Scheme): Promise<string> {
    let { salt, version, iv, cipher, iterations, digest, compressed } = scheme;
    let keyIV: any;
    let cipherKey = pbkdf2Sync(this.password, salt, iterations, 32, digest);
    if (iv.length === 0) {
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
    return compressed ? uncompress(plaintext.slice(4)) : plaintext.toString();
  }

  private async getPBKDF2IV(
    key: Buffer,
    salt: Buffer,
    version: string
  ): Promise<Buffer[]> {
    let salted = Buffer.concat([key, salt.slice(0, 8)]);
    const parts = [Buffer.from("")];
    for (let i = 0; i < 3; i++) {
      let partSalted = Buffer.concat([parts[parts.length - 1], salted]);
      let sha1ed = this.pbkdf2Sha1(partSalted, version === "KWC3" ? 1 : 5);
      parts.push(sha1ed);
    }
    const keyIV = Buffer.concat(parts);
    return [keyIV.slice(0, 32), keyIV.slice(32, 48)];
  }

  private pbkdf2Sha1(bytes: Buffer, iterations: number): any {
    for (let i = 0; i < iterations; i++) {
      bytes = createHash("sha1")
        .update(bytes)
        .digest();
    }
    return bytes;
  }
}
