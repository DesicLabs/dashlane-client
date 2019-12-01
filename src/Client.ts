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
    uki: string
  ): Promise<void> {
    this.username = username;
    this.password = password;
    this.uki = uki;
    this.vault = await this.dashlane.getVault(this.username, this.uki);
  }

  public async getEntries(): Promise<Entry[]> {
    if (!this.vault)
      throw new Error("Vault not found. Make sure to login first.");
    return await Promise.all(
      this.vault.map(async entry => {
        const text = await this.cipher.decipherData(this.password, entry);
        return transformEntry(text) as Entry;
      })
    );
  }

  public async getEntryCredentials(itemId: string): Promise<EntryCredentials> {
    if (!this.vault)
      throw new Error("Vault not found. Make sure to login first.");
    const entryPromises = this.vault.map(async entry => {
      const text = await this.cipher.decipherData(this.password, entry);
      return transformEntry(text, 1) as EntryCredentials & { id: string };
    });
    const entries = await Promise.all(entryPromises);
    const entry = entries.find(({ id }) => id === itemId);
    if (!entry) throw new Error("No account found.");
    return { username: entry.username, password: entry.password, otp: "" };
  }

  public async addEntry(entry: FullEntry): Promise<void> {}

  public async registerUKI(token: number): Promise<string> {
    if (!this.username)
      throw new Error(
        "Username not set. Try calling the login or sendToken function first."
      );
    this.uki = await this.dashlane.getUKI(this.username, token);
    this.vault = await this.dashlane.getVault(this.username, this.uki);
    return this.uki;
  }

  public async sendToken(username: string): Promise<void> {
    this.username = username;
    await this.dashlane.sendToken(username);
  }
}
