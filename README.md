# Dashlane Client

## Class Hierarchy

### Methods

- [addEntry](README.md#addaccount)
- [getEntries](README.md#getaccounts)
- [getEntryCredentials](README.md#getaccountcredentials)
- [login](README.md#login)
- [registerUKI](README.md#registerUKI)
- [sendToken](README.md#sendToken)

## Methods

### addEntry

▸ **addEntry**(`entry`: [NewEntry]): _Promise‹boolean›_

**Parameters:**

| Name    | Type       |
| ------- | ---------- |
| `entry` | [NewEntry] |

**Returns:** _Promise‹boolean›_

---

### getEntries

▸ **getEntries**(): _Promise‹[Entry]_

**Returns:** _Promise_

---

### getEntryCredentials

▸ **getEntryCredentials**(`id`: string): _Promise‹[EntryCredentials]_

**Returns:** _Promise_

---

### login

▸ **login**(`password`: string, `username`: string, `uki`: string): _Promise‹void›_

**Parameters:**

| Name       | Type   |
| ---------- | ------ |
| `password` | string |
| `username` | string |
| `uki`      | string |

**Returns:** _Promise‹void›_

---

### registerUKI

▸ **registerUKI**(`token`: number): _Promise‹void›_

**Parameters:**

| Name    | Type   |
| ------- | ------ |
| `token` | number |

**Returns:** _Promise‹string›_

---

### sendToken

▸ **sendToken**(`username`: string): _Promise‹void›_

**Parameters:**

| Name       | Type   |
| ---------- | ------ |
| `username` | string |

**Returns:** _Promise‹void›_

## Type aliases

### NewEntry

Ƭ **NewEntry**: _Record‹[NewEntryFields](README.md#newentryfields), string›_

---

### RawEntryFields

Ƭ **RawEntryFields**: \_"name" | "url" | "type" | "username" | "password" | "otp"

---

### Entry

Ƭ **Entry**: _Record‹[EntryFields](README.md#entryfields), string›_

---

### EntryFields

Ƭ **EntryFields**: \_"name" | "username" | "url" | "type"

---

### EntryCredentials

Ƭ **EntryCredentials**: _Record‹[EntryCredentialsFields](README.md#entrycredentialsfields), string›_

---

### EntryCredentialsFields

Ƭ **EntryCredentialsFields**: \_"username" | "password" | "otp";

---
