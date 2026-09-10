---
name: enum-comments
description: Write or review the comments on an enum file in the AIRSTONE project. Use whenever adding, changing or reviewing anything under src/enums, or when asked to "comment this enum", "document these values", "what does this status mean". The rule is that every word about a value sits in the block above the `const`, never between the braces, and that the block records why the set is what it is rather than restating the keys.
---

# Enum Comments

**An enum is data. Every word about it goes in the block above the `const`, never inside the
braces.**

`enum-structure` owns where an enum lives and how it is named. This skill owns what is written
about it.

---

## 1. The shape

```js
/**
 * The states a purchase order moves through.
 *
 * Listed in lifecycle order, so a reader can see the path a row takes.
 * `CANCELLED` sits at the end because it can be reached from any of the others
 * rather than following `DISPATCHED`.
 *
 * @type {Readonly<Object<string, string>>}
 */
const order_status = Object.freeze({
  DRAFT: "draft",
  CONFIRMED: "confirmed",
  DISPATCHED: "dispatched",
  CANCELLED: "cancelled",
});
```

- One block per exported value, directly above its `const`.
- A file holding several related enums gets a short block at the top of the file saying what the
  file covers, then a block per enum.
- `@type` where the shape is not obvious. `Readonly<...>` is worth writing, because the freeze is
  the point.

---

## 2. What to write

The keys already say what the values are. The block says what the code cannot:

| Worth a line | Example |
|---|---|
| why the set is exactly this | "Only the three the API has ever issued. A token claiming anything else is refused." |
| why the order is what it is | "Listed in lifecycle order" / "`CANCELLED` last because it is reachable from any state" |
| what a value means when the name does not say | "`in_progress` means the transfer left the account and the bank has not confirmed" |
| why a value is excluded from a derived list | "Super admins are excluded so the endpoint can never remove the last administrator" |
| why the values look the way they do | "Numbers, because `http_status` is the wire format" |
| a value that exists only for old rows | "`legacy_cash` is not offered on new writes; it is here so stored rows stay valid" |

Do **not** write a line per key restating the key. `// draft means draft` earns nothing.

---

## 3. Derived lists get their own block

A list built from the enum is a decision, not a copy. The block says which values are in it and,
more importantly, which are deliberately out:

```js
/**
 * The user types a super admin may see and act on through the super admin's user
 * routes. The list is scoped to them and the delete may only reach them, so what
 * a super admin can see and what they can deactivate cannot drift apart.
 *
 * Super admins are deliberately excluded, and neither route can reach one. The
 * list can therefore never enumerate the accounts that administer the system,
 * and the delete can never remove the last account able to create an
 * administrator -- including the caller's own.
 */
const manageable_user_types = Object.freeze([
  user_type.ADMIN,
  user_type.EMPLOYEE,
]);
```

That exclusion is the whole reason the list exists. Without the line, the next developer adding a
role has no way to know whether leaving it out was a decision or an oversight — and
`enum-structure` §5 asks them to decide for each derived list deliberately. This block is what
makes that possible.

---

## 4. Never inside the braces

```js
// Wrong -- prose between the entries makes the set unscannable.
const order_status = Object.freeze({
  // Nothing has been sent yet.
  DRAFT: "draft",
  CONFIRMED: "confirmed",
});
```

A reader scanning an enum is reading a list: they want to see every value at once. Prose between
the entries makes them step over it to reach the next one. This is `comment-placement`, and it
holds for `Object.freeze` exactly as it does for a schema or a constants map.

If a single value genuinely needs a sentence, name it in the block above:

```js
/**
 * How a supplier payment is settled.
 *
 * `in_progress` means the transfer has left the account and the bank has not
 * confirmed it yet. It is the only status a payment can be created in.
 */
```

---

## 5. Worked example

`src/enums/user_enums.js`, as it stands:

```js
const user_type = Object.freeze({
  ADMIN: "admin",
  EMPLOYEE: "employee",
  SUPER_ADMIN: "super_admin",
});

/**
 * The user types a super admin may see and act on through the super admin's user
 * routes. The list is scoped to them and the delete may only reach them, so what
 * a super admin can see and what they can deactivate cannot drift apart.
 *
 * Super admins are deliberately excluded, and neither route can reach one. The
 * list can therefore never enumerate the accounts that administer the system,
 * and the delete can never remove the last account able to create an
 * administrator -- including the caller's own.
 */
const manageable_user_types = Object.freeze([
  user_type.ADMIN,
  user_type.EMPLOYEE,
]);
```

The derived list carries the reason it exists. `user_type` itself carries none, and does not need
one: three roles named after what they are, in alphabetical order, with nothing surprising about
the set. **An enum with nothing to explain gets no block.** Adding one that restates the keys makes
the file longer and tells a reader nothing.

That changes the moment the set stops being obvious — a fourth role that only some endpoints
accept, a value kept for old rows, an order that matters.

---

## 6. Definition of done

- [ ] No comment sits inside `Object.freeze({ ... })` or inside an array literal.
- [ ] Every exported value that needs explaining has a block directly above its `const`.
- [ ] The block says why the set is what it is — not what the keys already say.
- [ ] Every derived list records which values are deliberately excluded, and why.
- [ ] A file holding several enums opens with a line saying what the file covers.
- [ ] `@type` is present where the shape is not obvious.
- [ ] An enum with nothing to explain has no block, rather than a filler one.
