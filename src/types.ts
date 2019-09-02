export type EntryFields =
  | "name"
  | "url"
  | "type"
  | "username"
  | "password"
  | "otp";

export type Entry = Record<EntryFields, string>;

export interface Client {
  login: (username: string, password: string, uki?: string) => Promise<void>;
  getAccounts: () => Promise<Entry[]>;
  addAccount: (account: Entry) => Promise<boolean>;
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
