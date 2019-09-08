export type EntryFields = "name" | "url" | "type";

export type Entry = Record<EntryFields, string>;

export type EntryCredentials = Record<"username" | "password" | "otp", string>;

export interface Client {
  login: (
    password: string,
    username?: string,
    secret?: string
  ) => Promise<void>;
  getAccounts: () => Promise<Entry[]>;
  getAccountCredentials: (fqdn: string) => Promise<EntryCredentials>;
  addAccount: (account: Entry) => Promise<void>;
}

export type Scheme = {
  iterations: number;
  salt: Buffer;
  version: string;
  cipher: Buffer;
  digest: string;
  iv: Buffer;
  compressed: boolean;
};

export type RawEntryKey =
  | "AnonId"
  | "AutoProtected"
  | "Category"
  | "Checked"
  | "CreationDatetime"
  | "Email"
  | "Id"
  | "LocaleFormat"
  | "ModificationDateTime"
  | "Password"
  | "SpaceId"
  | "Status"
  | "SubdomainOnly"
  | "Title"
  | "Url"
  | "UseFixedUrl"
  | "UserSelectedUrl";

export type KWField = {
  _attributes: { key: RawEntryKey };
  _cdata: string;
};

export type KWDataItem = Array<KWField>;

export type KWVaultItem = {
  root: {
    KWAuthentifiant: { KWDataItem: KWDataItem };
  };
};

export type RawEntry = Record<RawEntryKey, string>;

export type ArgonHashOptions = {
  salt: Buffer;
  timeCost: number;
  memoryCost: number;
  parallelism: number;
  hashLength: number;
  type: 0 | 1 | 2;
};
