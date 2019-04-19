import { createDecipheriv, createHash, pbkdf2Sync } from "crypto";
import { inflateSync } from "zlib";
import { v4 as uuid } from "uuid";
import { request } from "./helpers";

const argon2 = require("argon2-browser");
const { xml2js } = require("xml-js");

export default class Dashlane {
  private username: string;
  private password: string;
  private uki: string;
  private vault: Array<string> = [];

  constructor(username: string = "", password: string = "", uki: string = "") {
    this.setCredentials(username, password, uki);
  }

  getUKI = () => this.uki;

  setCredentials = (
    username: string = "",
    password: string = "",
    uki: string = ""
  ) => {
    username !== "" ? (this.username = username) : null;
    password !== "" ? (this.password = password) : null;
    uki !== "" ? (this.uki = uki) : null;
  };

  private decipherArgon2 = async (data: Buffer) => {
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

  private uncompress = async (data: Buffer) => {
    const inflate = inflateSync(data);
    return Buffer.from(inflate.toString()).toString();
  };

  private decipherPBKDF2 = async (scheme: any) => {
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
    return compressed
      ? this.uncompress(plaintext.slice(4))
      : plaintext.toString();
  };

  private getPBKDF2IV = async (key: Buffer, salt: Buffer, version: string) => {
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

  private pbkdf2Sha1 = (bytes: Buffer, iterations: number) => {
    for (let i = 0; i < iterations; i++) {
      bytes = createHash("sha1")
        .update(bytes)
        .digest();
    }
    return bytes;
  };

  getVault = async () => {
    const { fullBackupFile, content, transactionList } = await request(
      "/12/backup/latest",
      {
        login: this.username,
        uki: this.uki,
        lock: "nolock",
        timestamp: 1,
        sharingTimestamp: 0
      }
    );
    if (content === "Incorrect authentification")
      throw new Error("Invalid username/password.");
    this.pushEntriesFromTransactions(transactionList);
    this.vault.push(fullBackupFile);
    return true;
  };

  private pushEntriesFromTransactions = (transactionList: any) => {
    Object.keys(transactionList).map(key => {
      if (transactionList[key].type === "AUTHENTIFIANT") {
        this.vault.push(transactionList[key].content);
      }
    });
  };

  private decipherData = async (data: string) => {
    const rawVault = Buffer.from(data, "base64").toString();
    const type = rawVault.slice(3, 9);
    switch (type) {
      case "argon2":
        return await this.decipherArgon2(Buffer.from(data, "base64").slice(42));
      case "pbkdf2": {
        const slicedData = Buffer.from(data, "base64").slice(45);
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
        const buffData = Buffer.from(data, "base64");
        return await this.decipherPBKDF2({
          iterations: 10204,
          salt: buffData.slice(0, 32),
          version: buffData.slice(32, 36),
          cipher: buffData.slice(
            buffData.slice(32, 36).toString() === "KWC3" ? 36 : 32
          ),
          digest: "sha1",
          iv: "generate",
          compressed: buffData.slice(32, 36).toString() === "KWC3"
        });
      }
    }
  };

  getData = async () => {
    const promises: Array<any> = [];
    const entries: Array<any> = [];
    this.vault.map(vault => promises.push(this.decipherData(vault)));
    const data = await Promise.all(promises);
    data.map(plainText => {
      const { root } = xml2js(plainText, { compact: true });
      const pushed = root.hasOwnProperty("KWDataList")
        ? root.KWDataList.KWAuthentifiant
        : root.KWAuthentifiant;
      if (Array.isArray(pushed))
        pushed.map(({ KWDataItem }) => entries.push(KWDataItem));
      else entries.push(pushed.KWDataItem);
    });
    return entries;
  };

  sendToken = async () => {
    const response = await request(
      "/7/authentication/sendtoken",
      {
        login: this.username
      },
      {},
      false
    );
    return response === "SUCCESS";
  };

  registerUKI = async (token: number) => {
    const uki = uuid();
    const response = await request(
      "/7/authentication/registeruki",
      {
        login: this.username,
        devicename: "Profile Lens",
        platform: "App",
        temporary: 0,
        token,
        uki
      },
      {},
      false
    );
    if (response === "SUCCESS") {
      this.uki = uki;
      return true;
    }
    return false;
  };
}
