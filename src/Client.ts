import { transformEntry } from "./utilities";
import { Client, Entry, EntryCredentials, FullEntry } from "./types";
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
    username: string,
    uki?: string
  ): Promise<void> {
    this.username = username;
    this.password = password;
    if (uki) {
      this.uki = uki;
      this.vault = await this.dashlane.getVault(this.username, this.uki);
    } else {
      await this.sendToken();
      throw new Error("UKI is not set. Call registerUKI first");
    }
  }

  public async getAccounts(): Promise<Entry[]> {
    if (!this.vault)
      throw new Error("Vault not found. Make sure to login first.");
    return await Promise.all(
      this.vault.map(async entry => {
        const text = await this.cipher.decipherData(this.password, entry);
        return transformEntry(text) as Entry;
      })
    );
  }

  public async getAccountCredentials(fqdn: string): Promise<EntryCredentials> {
    if (!this.vault)
      throw new Error("Vault not found. Make sure to login first.");
    const entryPromises = this.vault.map(async entry => {
      const text = await this.cipher.decipherData(this.password, entry);
      return transformEntry(text, 1) as EntryCredentials & { url: string };
    });
    const entries = await Promise.all(entryPromises);
    const entry = entries.find(({ url }) => url.match(new RegExp(fqdn)));
    if (!entry) throw new Error("No account found.");
    return { username: entry.username, password: entry.password, otp: "" };
  }

  public async addAccount(account: FullEntry): Promise<void> {}

  public async registerUKI(token: number): Promise<string> {
    if (!this.username)
      throw new Error(
        "Username not set. Try calling the login or sendToken function first."
      );
    this.uki = await this.dashlane.getUKI(this.username, token);
    this.vault = await this.dashlane.getVault(this.username, this.uki);
    return this.uki;
  }

  private async sendToken(): Promise<void> {
    await this.dashlane.sendToken(this.username);
  }
}
