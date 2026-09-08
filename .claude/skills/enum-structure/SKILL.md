---
name: enum-structure
description: Create, extend, rename, or remove an enum in the AIRSTONE project. Use whenever a fixed set of allowed values is involved — adding a status, a category, a role, a type; adding a value to an existing set; changing what a value is called; or dropping one — and whenever anything under src/enums is touched. Every enum lives in src/enums/<entity>_enums.js, is frozen, is registered in the barrel, and is never spelled out again anywhere else. Covers the full ripple a change causes, including the stored documents an enum change can orphan.
---

# Enum Structure

**A fixed set of allowed values lives in `src/enums`, is `Object.freeze`d, and is written down
exactly once.**

Everything else — the Mongoose `enum`, the Joi `.valid()`, the message listing what is accepted, the
list config, the README — reads that one definition. The moment a value is spelled a second time,
the two copies start drifting, and the one that drifts is always the one nobody is looking at.

`model-structure` §8 covers what a schema does with an enum. This skill owns the enum itself.

---

## 1. Where it lives

```
src/enums/
  index.js                     the barrel — every enum is registered here
  <entity>_enums.js            one file per entity
  response_status_enums.js     http_status, the one non-entity file
```

- **File per entity, not per enum.** `product_enums.js` holds `product_category` and `gst_slab`
  together, because both describe a product. A file per enum would make `src/enums` a list of
  single-line files.
- **`<entity>_enums.js`**, snake_case, always the `_enums` suffix.
- **Registered in `src/enums/index.js`**, so every consumer writes `require("@enums")` and never a
  path inside the folder.

---

## 2. What an enum file looks like

```js
/**
 * The states a purchase order moves through.
 *
 * The order is the lifecycle order, so a reader can see the path a row takes.
 * `CANCELLED` sits at the end because it can be reached from any of the others
 * rather than following `DISPATCHED`.
 */
const order_status = Object.freeze({
  DRAFT: "draft",
  CONFIRMED: "confirmed",
  DISPATCHED: "dispatched",
  CANCELLED: "cancelled",
});

/**
 * The states an order may still be edited in. A dispatched or cancelled order is
 * a historical record, so the update endpoint refuses it.
 */
const editable_order_statuses = Object.freeze([
  order_status.DRAFT,
  order_status.CONFIRMED,
]);

module.exports = { order_status, editable_order_statuses };
```

Rules:

- **Always `Object.freeze`.** A shared object that anything could mutate at runtime is not a fixed
  set.
- **Object name: `snake_case` singular** — `order_status`, `user_type`, `product_category`.
- **Keys: `UPPER_SNAKE_CASE`. Values: lowercase `snake_case`**, unless the domain dictates otherwise
  (`http_status` holds numbers; a GST slab holds a number).
- **A derived list is built from the enum, never retyped.** `editable_order_statuses` references
  `order_status.DRAFT`, so renaming a value updates the list for free.
- **The comment goes above the `const`, never inside the braces.** An enum is data; prose between
  the entries makes it unscannable. **`enum-comments` is the full rule** — what the block records,
  why a derived list must state its exclusions, and when an enum needs no block at all.

---

## 3. Never spell a value twice

An enum value appears in exactly one place. Everywhere else reads it:

| Where | Write this | Not this |
|---|---|---|
| Mongoose schema | `enum: { values: Object.values(order_status), message: … }` | an inline array of strings |
| Joi validator | `.valid(...Object.values(order_status))` | `.valid("draft", "confirmed")` |
| Message constant | built from the enum — see below | a hand-typed sentence listing the values |
| List query config | `exact_filters: { status: Object.values(order_status) }` | a second array |
| Controller check | `status === order_status.DRAFT` | `status === "draft"` |
| Route or middleware | `authorize_user_types(user_type.ADMIN)` | `authorize_user_types("admin")` |

**The message trap.** A validation message that lists what is accepted is the copy that goes stale
most often, because nothing fails when it does — the request is still refused, just with wording that
names a value that no longer exists or omits one that does. Build it:

```js
const { user_type } = require("@enums");

const user_types = Object.values(user_type).join(", ");

const user_validation_messages = Object.freeze({
  USER_TYPE_INVALID: `User type must be one of: ${user_types}`,
});
```

`src/validators/messages/list_query_message.js` already does this with `sort_order`. Follow it.

---

## 4. Creating a new enum

1. Decide the entity. **An enum belongs to the thing it describes** — an order status goes in
   `order_enums.js`, not in a shared `status_enums.js`. A "statuses" file collects unrelated sets
   that only look alike.
2. **Check `src/enums` first.** Do not add a near-duplicate of a set that already exists under
   another name — extend the existing one, or say plainly why the two are different things.
3. Add it to `<entity>_enums.js`, frozen, with a header saying what the set is and why it is that
   set. Create the file if the entity has none.
4. Export it from that file, and register it in `src/enums/index.js` — both the require block and the
   exported object.
5. Wire it in: the schema `enum`, the Joi `.valid()`, the message built from it, the list config.
6. If it is user-facing, add its accepted values to the README.

---

## 5. Adding a value to an existing enum

The safe change, and the common one.

1. Add the key to the frozen object.
2. **Check every derived list in the same file.** A new value is not automatically part of
   `editable_order_statuses` or `manageable_user_types` — decide for each one, deliberately, and say
   why in the comment if it is excluded.
3. Nothing else needs editing, **if** §3 was followed — the schema, the validator, the message and
   the list config all read the enum. If any of them has a hand-typed copy, that is the bug; fix the
   copy rather than adding the value to it.
4. Existing documents are untouched: adding a value widens what is allowed, so every stored row is
   still valid.
5. Update the README if the enum is user-facing.

---

## 6. Renaming or changing a value

**This is the dangerous one. An enum value is not only code — it is written into every document
that used it.** Changing `"dispatched"` to `"shipped"` does not update a single stored row; it makes
every existing row invalid against the new set, and every query that filters on the new name returns
nothing.

Before changing a value, ask which of these it actually is:

- **Only the key is changing** (`DISPATCHED` → `SHIPPED`, value stays `"dispatched"`) — safe. Update
  the key, update every reference to it, done. Stored data is untouched.
- **The stored value is changing** — a data change, not a code change. It needs:
  1. the enum updated,
  2. a migration under `scripts/migrations` that rewrites every affected document, with a rollback
     that puts the old value back (→ `mongoose-migrations`),
  3. the migration applied before or with the deploy, never after.
- **Only what a caller sees is changing** — then do not touch the enum at all. Change the label the
  API returns or the frontend renders. The stored value is an internal identity; it does not have to
  read nicely.

The third case is worth pausing on, because it is the most common reason someone reaches for a
rename. If the requirement is "call it Shipped on the screen", the enum is not the file to edit.

---

## 7. Removing a value or an enum

1. **Find every use first**: `grep -rn "<enum_object>\\|<VALUE_KEY>" src scripts`. A value is
   usually referenced from more places than the person removing it expects — a derived list, a
   default on a schema, a base filter, a role route mount.
2. **Ask what happens to documents already holding it.** Removing a value from the set does not
   remove it from stored rows: those rows keep a value the schema now rejects, so any `save()` on
   one fails validation even if nobody touched that field. Either migrate them to another value, or
   keep the value in the enum and stop offering it in new writes. Deciding this is not optional.
3. Remove the key, the derived-list entries, and every reference.
4. Removing a whole enum: delete it from `<entity>_enums.js`, unregister it from `src/enums/index.js`
   — **both the require block and the exported object** — and delete the file if it now exports
   nothing.
5. `grep` for the removed names again and expect nothing.
6. Update the README.

---

## 8. The ripple checklist

When an enum changes, walk this list. Every line is somewhere a value can be referenced:

- [ ] `src/enums/<entity>_enums.js` — the enum itself
- [ ] derived lists in the same file
- [ ] `src/enums/index.js` — require block **and** exported object
- [ ] the Mongoose schema's `enum`, and any `default` naming a value
- [ ] Joi validators using `.valid(...)`
- [ ] the message constant listing the accepted values
- [ ] list query configs — `exact_filters`, `base_filter`, `derived_filters`
- [ ] controllers or helpers comparing against a specific value
- [ ] routes or middleware naming a role
- [ ] a migration, if any stored value changed or was removed
- [ ] the README, if the enum is user-facing

---

## 9. Definition of done

- [ ] The enum is in `src/enums/<entity>_enums.js`, named after the entity it describes.
- [ ] `Object.freeze`d; object `snake_case` singular; keys `UPPER_SNAKE_CASE`; values lowercase
      `snake_case` unless the domain says otherwise.
- [ ] Registered in `src/enums/index.js`, require block and exported object.
- [ ] A header above the `const` says what the set is and why it is that set. No comment inside the
      braces.
- [ ] Derived lists are built from the enum's own keys, never retyped.
- [ ] The value is written down once — no inline array, no hand-typed message, no bare string
      compared in a controller.
- [ ] Every item in §8 was checked.
- [ ] If a stored value changed or was removed, a migration exists with a working rollback.
- [ ] `node -r module-alias/register -e "require('@enums')"` loads.
