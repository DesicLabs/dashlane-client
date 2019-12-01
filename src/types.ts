export type EntryFields = "id" | "name" | "username" | "url" | "type";

export type Entry = Record<EntryFields, string>;

export type EntryCredentialsFields = "username" | "password" | "otp";

export type EntryCredentials = Record<EntryCredentialsFields, string>;

export type FullEntryFields = EntryFields & EntryCredentialsFields;

export type FullEntry = Entry & EntryCredentials;

export interface Client {
  login: (
    password: string,
    username?: string,
    secret?: string
  ) => Promise<void>;
  getEntries: () => Promise<Entry[]>;
  getEntryCredentials: (id: string) => Promise<EntryCredentials>;
  addEntry: (entry: Entry) => Promise<string>;
  sendToken: (username: string) => Promise<void>;
  registerUKI: (token: number) => Promise<string>;
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

export type NewEntryKey =
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
  _attributes: { key: NewEntryKey };
  _cdata: string;
};

export type KWDataItem = Array<KWField>;

export type KWVaultItem = {
  root: {
    KWAuthentifiant: { KWDataItem: KWDataItem };
  };
};

export type RawEntry = Record<NewEntryKey, string>;

export type ArgonHashOptions = {
  salt: Buffer;
  timeCost: number;
  memoryCost: number;
  parallelism: number;
  hashLength: number;
  type: 0 | 1 | 2;
};
