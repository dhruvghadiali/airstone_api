---
name: model-comments
description: Write or review the comments on a Mongoose model in the AIRSTONE project. Use whenever adding or changing anything under src/models, or when asked to "comment this model", "document this schema", "what does this field mean". The rule is that every word about a field sits in the block above the schema, keyed by field name, never between the braces — and that the block records the rules the schema cannot state.
---

# Model Comments

**A schema is data. Every word about a field goes in the block above the `const`, keyed by the
field's name, never inside `new mongoose.Schema({ ... })`.**

`model-structure` owns what a schema declares. This skill owns what is written about it.

---

## 1. Why the placement rule is strict here

A reader opening a model is answering a scanning question: *what type is this field, is it
required, what are the bounds, what is the default.* That is a table lookup. Prose between the
entries turns a 20-line field list into 60 lines, and pushes the field they came for three screens
further down than it needs to be.

So the field list stays a field list, and the prose sits above it, keyed by name:

```js
/**
 * One transfer that has actually gone out to the supplier.
 *
 * `payment_status` starts at `in_progress` and is moved on by the payment
 * endpoints, never edited freely.
 *
 * `reference_id` is the number the bank issued. Optional here because cash has
 * none; required for every other payment type, which is a rule about one field
 * given another and therefore the helper's.
 */
const credit_payment_schema = new mongoose.Schema({
  payment_status: { type: String, enum: { ... }, default: ... },
  reference_id: { type: String, trim: true, default: null },
});
```

Not this:

```js
const credit_payment_schema = new mongoose.Schema({
  // Starts at in_progress and is moved on by the payment endpoints.
  payment_status: { type: String, enum: { ... }, default: ... },
  reference_id: {
    // Optional because cash has no reference.       <- no comments inside
    type: String,
    trim: true,
    default: null,
  },
});
```

Two habits follow: **a blank line between fields**, so each paragraph of the header maps to
something a reader can see; and **never restate a field name** — `// the product reference` above
`product` earns nothing.

---

## 2. What the header records

The schema already states type, requiredness, bounds, enum, default and index. The header states
what it cannot:

| Worth a paragraph | Why |
|---|---|
| why a `ref` points at X rather than Y | "a supplier is a Company, because the same row is also a customer" |
| why a field is optional | "cash has no reference number" — otherwise it reads as an oversight |
| what a default means | "`true`, so a row is live until something deactivates it" |
| a unique index that is **not** scoped to active rows | this is the classic trap — a soft deleted row keeps the value reserved |
| what a status starts at, and who moves it | stops a future endpoint editing it freely |
| a rule about one field **given another** | it cannot live in the schema, so say where it does live |
| why a value is stored rather than computed | "the rate at the time of sale, because slabs change" |
| a field kept only for old rows | otherwise someone removes it |

Do not document a field whose name and type say everything. `first_name: String, required` needs
no line.

---

## 3. The file-level block

One block at the top saying what the entity is, and any fact that is true of the whole document:

```js
/**
 * A person who can sign in. One collection for every role -- `user_type` is
 * what separates them, so a role change is one field and not a migration
 * between collections.
 *
 * Passwords are selected only for authentication and are removed from
 * serialized output by the schema's `toJSON` transform below.
 */
```

The second paragraph is the kind worth writing: `select: false` and the `toJSON` transform are two
separate mechanisms in two places, and this is the one sentence that says they exist and why.

---

## 4. Hooks, methods and options

Each gets its own block or `//` note. These are code, not data, so a `//` above a statement inside
one is right and expected.

```js
// Hash only new or changed passwords so reads and unrelated updates do not
// re-hash an already encoded value.
user_schema.pre("save", async function hash_password() {
```

```js
// Authentication controllers must select the hidden password before calling
// this method; a missing password cannot authenticate successfully.
user_schema.methods.compare_password = function compare_password(
```

The second is a **contract note**: it tells a caller what they must do first. Without it, someone
calls `compare_password` on a document fetched without `+password` and gets a silent false.

Schema options that carry a decision get a line too — a `versionKey: false`, a `timestamps` rename,
a `toJSON` transform — in the file-level block rather than inside the options object.

---

## 5. The same rule for the model's supporting files

`model-structure` also owns the entity's constants, messages and enums. All three are pure data,
and all three follow this rule: no comment inside an `Object.freeze`, a constants map or a messages
map. Every word about a key belongs above the `const`, keyed by that key's name.

For enums specifically, `enum-comments` has the detail.

---

## 6. Worked example

`src/models/user_model.js` carries exactly three comments, and each earns its place:

- the file-level note that passwords are hidden two different ways;
- the `pre("save")` note explaining why the hash is guarded by `isModified` — without it, every
  read-and-save would re-hash the hash;
- the `compare_password` note stating the caller's obligation to select the password first.

The 60 lines of field declarations carry none, because names like `first_name`, `email` and
`phone_number` with their limits and patterns already say everything. **That ratio is the target:**
a handful of high-value notes, not a line per field.

---

## 7. Definition of done

- [ ] No comment sits inside `new mongoose.Schema({ ... })`, a `validate: { ... }`, an
      `Object.freeze`, a constants map or a messages map.
- [ ] A file-level block says what the entity is, plus anything true of the whole document.
- [ ] Fields that need explaining are explained in the block above the schema, keyed by field name.
- [ ] A field whose name and type say everything carries no line.
- [ ] Every `ref` whose target is not the obvious one says why.
- [ ] Every optional field whose optionality is a decision says so.
- [ ] Any unique index not scoped to active rows is called out, with what that means for a
      soft deleted row.
- [ ] Rules that involve two fields say which layer enforces them.
- [ ] Every hook and instance method has a note; contract notes state what a caller must do first.
- [ ] A blank line separates fields, so each header paragraph maps to something visible.
- [ ] No comment restates a field name.
