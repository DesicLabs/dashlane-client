# Dashlane Client

## Class Hierarchy

### Methods

- [addAccount](README.md#addaccount)
- [getAccounts](README.md#getaccounts)
- [login](README.md#login)
- [registerUKI](README.md#registerUKI)

## Methods

### addAccount

▸ **addAccount**(`entry`: [Entry]): _Promise‹boolean›_

**Parameters:**

| Name    | Type    |
| ------- | ------- |
| `entry` | [Entry] |

**Returns:** _Promise‹boolean›_

---

### getAccounts

▸ **getAccounts**(): _Promise‹[Entry]_

**Returns:** _Promise_

---

### login

▸ **login**(`username`: string, `password`: string, `uki?`: string): _Promise‹void›_

**Parameters:**

| Name       | Type   |
| ---------- | ------ |
| `username` | string |
| `password` | string |
| `uki?`     | string |

**Returns:** _Promise‹void›_

---

### registerUKI

▸ **registerUKI**(`token`: string): _Promise‹string›_

**Returns:** _Promise‹string›_

---

## Type aliases

### Entry

Ƭ **Entry**: _Record‹[EntryFields](README.md#entryfields), string›_

---

### EntryFields

Ƭ **EntryFields**: _"name" | "url" | "type" | "username" | "password" | "otp"_

---
