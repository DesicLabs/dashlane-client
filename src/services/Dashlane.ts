import { v4 as uuid } from "uuid";
import { request } from "../utilities";

export class Dashlane {
  public async getVault(login: string, uki: string): Promise<string[]> {
    const { content, transactionList } = await request("/12/backup/latest", {
      login,
      uki,
      lock: "nolock",
      timestamp: 1,
      sharingTimestamp: 0
    });
    if (content === "Incorrect authentification")
      throw new Error("Invalid username/password.");
    return Object.keys(transactionList).reduce((acc, key) => {
      const { type, content } = transactionList[key];
      if (type === "AUTHENTIFIANT") acc.push(content);
      return acc;
    }, []);
  }

  public async sendToken(login: string): Promise<boolean> {
    const response = await request(
      "/7/authentication/sendtoken",
      { login },
      undefined,
      false
    );
    return response === "SUCCESS";
  }

  public async getUKI(login: string, token: number): Promise<string> {
    const uki = uuid();
    const response = await request("/7/authentication/registeruki", {
      login,
      devicename: "Profile Lens",
      platform: "App",
      temporary: 0,
      token,
      uki
    });
    if (response !== "SUCCESS") throw new Error("Error registering UKI.");
    return uki;
  }
}
