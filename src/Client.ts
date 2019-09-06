import { transformItem } from "./utilities";
import { Client, Entry } from "./types";
import { Cipher } from "./services/Cipher";
import { Dashlane } from "./services/Dashlane";

export default class DashlaneClient implements Client {
  private cipher: Cipher;
  private dashlane: Dashlane;
  private vault: string[];
  private uki: string;
  private username: string;
  private password: string;

  public constructor() {
    this.cipher = new Cipher();
    this.dashlane = new Dashlane();
  }

  public async login(
    password: string,
    username?: string,
    uki?: string
  ): Promise<void> {
    this.username = username;
    this.password = password;
    if (uki) {
      this.uki = uki;
      this.vault = await this.dashlane.getVault(this.username, this.uki);
    } else {
      await this.sendToken();
      throw new Error(
        "A token has been sent to the registered email. Get the UKI by calling registerUKI function with token."
      );
    }
  }

  public async getAccounts(): Promise<Entry[]> {
    if (!this.vault)
      throw new Error("Vault not found. Make sure to login first.");
    return await Promise.all(
      this.vault.map(async entry => {
        const text = await this.cipher.decipherData(this.password, entry);
        return transformItem(text);
      })
    );
  }

  public async addAccount(account: Entry): Promise<boolean> {
    return false;
  }

  public async registerUKI(token: number): Promise<string> {
    if (!this.username)
      throw new Error(
        "Username not set. Try calling the login function first."
      );
    this.uki = await this.dashlane.getUKI(this.username, token);
    this.vault = await this.dashlane.getVault(this.username, this.uki);
    return this.uki;
  }

  private async sendToken(): Promise<void> {
    await this.dashlane.sendToken(this.username);
  }
}
