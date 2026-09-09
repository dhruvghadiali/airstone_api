---
name: model-structure
description: Create, modify, or remove Mongoose models and their supporting validation limits, validation messages, enums, patterns, and ref-existence lookups in the AIRSTONE project. Use whenever adding, changing, deleting, reviewing, or refactoring files in src/models, adding or removing a field on a model, or touching src/enums, src/validators/constants, src/validators/messages, or src/helpers/common/db/ because a model depends on them. Enforces the project's shared structure so every model looks the same regardless of who — or which AI — wrote it.
---

# Model Structure

A **model** is the blueprint of a MongoDB collection. The model file is the single place where a
field's name, type, requiredness, min/max, enum, uniqueness and index are declared.

Nothing about a field may be invented inline. Every number lives in `src/validators/constants`,
every message string lives in `src/validators/messages`, every fixed value set lives in `src/enums`,
every regex lives in the entity's `*_validation_patterns` object, and every "does this referenced
document exist and is it active" lookup lives in `src/helpers/common/db/`, one file per lookup.

**A schema never queries the database.** Models declare shape: type, requiredness, bounds, enum,
regex, uniqueness, index. Whether a referenced document exists and is still active is checked by the
**controller** before the write, using a lookup from `@helpers/common` — never by a schema
`validate` function and never by a `pre` hook. Section 8 explains why this rule exists and what it
costs.

**Scope:** this skill covers the model and the four supporting layers it reads from. The Joi
request-body, query-param and route-param validators in `src/validators/request_body`,
`query_params` and `route_params` are a separate concern with their own skill — do not restructure
them here. Only note, when reporting, that they need to follow.

---

## 1. Where things live

| What | Path | Import alias |
|---|---|---|
| Models | `src/models/<entity>/<entity>_model.js` | `@models/<entity>` |
| Enums (fixed value sets) | `src/enums/<entity>_enums.js` | `@enums` |
| Validation limits + patterns | `src/validators/constants/<entity>_constants.js` | `@validators/constants` |
| Validation + response messages | `src/validators/messages/<entity>_message.js` | `@validators/messages` |
| Ref-existence lookups (used by controllers, never by models) | `src/helpers/common/db/<lookup>.js` | `@helpers/common` |
| Generic helpers | `src/helpers/<feature>/` | `@helpers/<feature>` (see `helper-structure`) |

Use CommonJS `require(...)`. Use project aliases — never relative paths. Aliases are declared in
`package.json` `_moduleAliases` and mirrored in `jsconfig.json`; if you add a new top-level folder
you must register the alias in **both**.

**File and identifier naming**

- Filenames: `snake_case`, suffixed by role — `_model.js`, `_enums.js`, `_constants.js`,
  `_message.js`, `_helper.js`.
- Each model lives in its own folder named after the entity, holding
  `<entity>_model.js` and an `index.js` barrel: `src/models/order/order_model.js` plus
  `src/models/order/index.js`. The folder gives a model that later grows companion
  files — sub-schemas, static queries, a seed — somewhere to put them, instead of the
  top of `src/models/` filling with loose files.
- Database fields: `snake_case`.
- Exported constant/message objects: `snake_case`, `Object.freeze`d — `product_validation_limits`,
  `product_validation_messages`.
- Keys inside those objects: `UPPER_SNAKE_CASE`.
- Enum object names: `snake_case` singular — `product_category`, `agency`, `user_type`.
- Enum keys: `UPPER_SNAKE_CASE`. Enum values: lowercase `snake_case`, unless the domain dictates
  otherwise (agency values are `CG`, `RPG KEC`, `Premium`).
- Mongoose model name: **PascalCase singular** — `mongoose.model("Product", product_schema)`.
  `ref` values use the same PascalCase name.
- Style for new files: double quotes, 2-space indent, trailing commas. When editing an existing
  file, match that file.

---

## 2. Mandatory barrel exports and imports

`src/enums`, `src/validators/constants` and `src/validators/messages` are **barrel folders**. Their
`index.js` is the only public import point.

Each model folder is a barrel too, in the same way: `src/models/<entity>/index.js` re-exports the
model, so every consumer writes `const { <entity>_model } = require("@models/<entity>");` — a
destructured import, never a default one. A model folder without an `index.js` is the same bug as
an unregistered constants file.

When you create or update a file in any of those folders, you must:

1. Export the new file's values from that folder's `index.js` — add it to **both** the `require`
   block and the `module.exports` block.
2. Import those values elsewhere through the folder alias.
3. Never import an individual file directly into a model.

A new file that isn't registered in `index.js` is a bug: the barrel import silently resolves to
`undefined` and validation stops working without throwing.

**Two deliberate exceptions:**

- A barrel's own `index.js` requires its siblings by full path
  (`@validators/constants/product_constants`) — that is how the barrel is assembled.
- A message file requires its constants file by full path
  (`@validators/constants/product_constants`) to avoid a circular barrel load. Follow
  `product_message.js` / `user_message.js`.

**Ordering convention in every `index.js` and every require block:** lines are sorted by line
length, shortest first. Match it when inserting.

Correct:

```js
const { agency, product_category } = require("@enums");
const { product_validation_limits } = require("@validators/constants");
const { product_validation_messages } = require("@validators/messages");
```

Wrong:

```js
const enums = require("../enums");
const { product_validation_limits } = require("@validators/constants/product_constants");
```

---

## 3. Understand the request before editing

Before changing code, identify every requested field and confirm:

- Field name (snake_case)
- Mongoose data type
- Whether it is required
- Minimum value or minimum length
- Maximum value or maximum length
- Whether it must be unique
- Whether it needs an index

Also determine when relevant:

- Default value (this project uses `default: null` for optional scalars, not "omit the key")
- Enum values
- String normalization — `trim`, `lowercase`, `uppercase`
- Regex or format validation
- MongoDB reference model (`ref`) and relationship cardinality
- Custom validation rules
- Whether null or empty values are allowed
- Whether it must be excluded from responses (`select: false` plus a `toJSON` transform, as with
  `password`)
- Whether uniqueness applies globally or scoped within another field
- Whether soft-deleted records (`is_active: false`) affect uniqueness
- Expected query, sorting, and filtering patterns — these drive the index decisions

**If any required information is missing, do not guess and do not modify the model yet.** Ask the
user, in a **single consolidated round** — not one question at a time — and attach a
database-engineering recommendation to each item so the user can reply "yes to all". Base each
recommendation on how the same concept is already modelled in this codebase.

Question format:

> Please confirm the following for `email`:
>
> - Type: I recommend `String`.
> - Required: I recommend `true` if every record must have an email.
> - Minimum and maximum length: I recommend reusing the existing
>   `user_validation_limits.EMAIL_MIN` / `EMAIL_MAX`.
> - Unique: I recommend `true` only if an email must identify exactly one record.
> - Index: I recommend an index if email is used frequently for lookups.
> - Normalization: I recommend `trim: true` and `lowercase: true`.
> - Format: I recommend reusing `user_validation_patterns.EMAIL`.
>
> Should I use these recommendations?

Explain to the user, when it affects the decision:

- `unique` creates a database uniqueness constraint; it is not a Mongoose validator and it does not
  produce a validation message. Duplicate-key errors surface through
  `error_messages.DUPLICATE_VALUE` in the error handler, so a friendlier field-specific message
  belongs in the entity's `<entity>_messages` (see `product_messages.CODE_EXISTS`).
- An index should support a real query, filtering, sorting, or relationship pattern.
- Unnecessary indexes increase storage and write cost.
- Compound uniqueness must use `schema.index(...)`, not separate `unique: true` fields.
- Optional unique fields may need a partial or sparse index, depending on expected behavior.
- This project soft-deletes (`is_active: false`), so a global unique index keeps the value reserved
  after deletion. If deletion should free the value, the unique index must be partial on
  `{ is_active: true }`.

### Index conventions to apply

- Single-field indexes are declared **inline** with `index: true` on the field, matching
  `product_model.js` and `user_model.js`.
- Compound indexes and text indexes are declared at the **bottom** of the model file via
  `schema.index(...)`.
- Index every `ObjectId` reference field that will be filtered on.
- Index every field that a list endpoint filters on (`category`, `agency`, `is_active` are indexed
  because the product list endpoint filters on them).
- Free-text search fields go in the single text index; a collection may have only one.
- Prefer a **compound unique index scoped by parent** over a global unique — unless the value is
  genuinely globally unique (email, phone number, username, product code).
- Compound index field order: most selective / most frequently filtered first.
- Don't index `is_active` alone as an afterthought; it is indexed here because every read filters on
  it. Fold it into compound indexes where queries combine it with other filters.

---

## 4. Inspect existing code first

Before creating anything:

1. Read the related files in `src/models`.
2. Read the barrels and siblings in `src/enums`, `src/validators/constants`,
   `src/validators/messages`.
3. Read the reusable helpers in `src/helpers`.
4. Read the consuming controllers in `src/controllers` to see how the model is actually queried.

Reuse an existing definition when its **meaning** matches the new requirement:

- Generic bounds live in `src/validators/constants/common.js` (`pagination_defaults`). Entity bounds
  live in that entity's constants file.
- Cross-cutting response messages live in `src/validators/messages/error_message.js`
  (`ROUTE_NOT_FOUND`, `VALIDATION_FAILED`, `DUPLICATE_VALUE`, `INVALID_IDENTIFIER`, …).
- `http_status` already exists in `src/enums/response_status_enums.js` — never write a bare `200`
  or `404`.
- `user_type`, `product_category`, `agency` already exist; do not duplicate a near-identical enum
  under a new name.
- `user_validation_patterns.EMAIL` and `.PHONE_NUMBER` already exist.
- `send_response`, `get_pagination` and `verify_auth_token` already exist, in `@helpers/common`,
  `@helpers/list_query` and `@helpers/auth`.

**Do not reuse a definition merely because its value happens to be the same. Its semantic meaning
must also match.** Two unrelated fields that both happen to max out at 50 characters get two
constants.

Only when nothing suitable exists do you create a new file, named after the entity
(`order_constants.js` for `order_model.js`), and register it in that folder's `index.js`.

---

## 5. Canonical model file structure

Sections in this exact order:

```js
// 1. third-party (sorted by line length, shortest first)
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

// 2. project imports (blank line above; sorted by line length, shortest first)
const { order_status } = require("@enums");
const { order_validation_messages } = require("@validators/messages");
const {
  order_validation_limits,
  order_validation_patterns,
} = require("@validators/constants");

// 3. schema
const order_schema = new mongoose.Schema(
  {
    /* fields */
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
    toJSON: { flattenMaps: true },
    toObject: { flattenMaps: true },
  },
);

// 4. populate virtuals (only if the model has children — see below)
order_schema.virtual("lines", {
  ref: "OrderLine",
  localField: "_id",
  foreignField: "order",
});

// 5. compound and text indexes
order_schema.index({ name: "text", order_code: "text" });
order_schema.index({ customer: 1, order_status: 1, is_active: 1 });

// 6. hooks and instance methods (only if needed)
order_schema.pre("save", async function hash_something() {
  /* ... */
});

// 7. export
module.exports = mongoose.model("Order", order_schema);
```

And its barrel, `src/models/order/index.js`:

```js
/**
 * The order model, behind one import: `require("@models/order")`.
 */
const order_model = require("@models/order/order_model");

module.exports = { order_model };
```

### Mandatory on every model

- `new mongoose.Schema(...)` — the project does not destructure `Schema`.
- Schema options block always contains, in this order: `timestamps` mapped to
  `{ createdAt: "created_at", updatedAt: "updated_at" }`, `versionKey: false`,
  `toJSON: { flattenMaps: true }`, `toObject: { flattenMaps: true }`. Options go **in the schema
  constructor**, not via `schema.set(...)`. A model that declares a populate virtual adds
  `virtuals: true` to both serialisers — see below.
- `is_active: { type: Boolean, default: true, index: true }` — deletes in this project are soft
  deletes that flip this flag.
- Export via `module.exports = mongoose.model("<PascalCase>", <entity>_schema);`.

**Audit fields are per model, and the project is split.** The three company models carry
`created_by` and `updated_by`; `user_model` carries neither. So there is no project-wide default to
follow, and adding them is a decision to take with the requester rather than on your own
initiative.

When a model does carry them, they take this shape:

```js
created_by: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  required: [true, <entity>_validation_messages.CREATED_BY_REQUIRED],
},
updated_by: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  default: null,
},
```

`updated_by` starts null because a row that has only ever been created has not been updated by
anyone. Neither is ever accepted from the request body — every create and update schema is
`.unknown(false)` and declares neither, so the controller sets them from `req.user.id`. They are
`ref` fields like any other, so §8 applies: the model declares the reference, and whether the id
points at a live user is the controller's check.

### Field declaration rules

- `required` always the array form: `required: [true, <messageRef>]`.
- `minlength` / `maxlength` always the array form: `[<limitRef>, <messageRef>]`.
- `min` / `max` for numbers and dates: same array form.
- Strings: add `trim: true`; add `lowercase: true` or `uppercase: true` when the value is normalised
  (`product_code` is uppercased, `email` and `username` are lowercased).
- Optional scalars: `default: null` — see `model_number` and `description`.
- Enum fields: `enum: { values: Object.values(<enum_object>), message: <messageRef> }`.
- Regex: `match: [<patternRef>, <messageRef>]`.
- Secret fields: `select: false` **plus** a `toJSON.transform` that deletes the key, as in
  `user_model.js`.
- `ObjectId` fields: `type: mongoose.Schema.Types.ObjectId`, `ref: "<PascalCase>"`, `required`.
  Nothing else — `ref` drives populate, and existence is the controller's check (see section 8).
- Custom `validate.validator` functions are allowed **only when they are synchronous and look at
  nothing but the value in front of them** — `Number.isInteger` on a pincode is fine. A validator
  that awaits a query is not; move it to the controller. Each one gets a `//` comment explaining
  every branch.
- No `pre` / `post` hook may query the database either. Hashing a password in a `pre("save")` is
  fine; reading another collection to derive a field is not — the controller that already fetched
  that document sets the field.
- **Never inline a literal number or a literal message string into the schema.**

---

### Populate virtuals

**A child knows its parent. A parent keeps no list.** `company_address` stores its `company`;
`company_model` stores no array of addresses. A stored array would be a second copy of that fact,
and the two would drift the first time a child was written without the parent being updated.

The parent reads its children back through a populate virtual:

```js
company_schema.virtual("addresses", {
  ref: "CompanyAddress",
  localField: "_id",
  foreignField: "company",
});
```

Rules:

- **Declared after the schema constructor, before the indexes** — slot 4 in §5.
- **`virtuals: true` on both serialisers** is what puts a populated virtual into the response:
  `toJSON: { flattenMaps: true, virtuals: true }` and the same on `toObject`. Without it the
  populate runs and the result never reaches the client.
- **It also adds mongoose's own `id` string beside `_id`.** That is why `ALWAYS_INCLUDED` in
  `@utils/constants` carries `id`: a read applies its projection in the query and is handed `id`
  regardless, so leaving it out of write responses would make it the one field that appears when an
  entity is read and vanishes when the same entity is written.
- **An unpopulated virtual is simply absent** from the JSON, so adding one changes no existing
  response. Only an endpoint that populates it pays for it.
- **Never put `match` on the virtual itself.** A `match` there applies to every caller, including a
  future screen that has to show a deactivated child. Narrow it in the populate spec instead, which
  is the response config's job — `controller-structure` §11.
- **A virtual is not a column,** so it does not go in a `select` string. Naming it would ask the
  database for a field that does not exist. A real `ref` field is the opposite: it must be in
  `select`, or mongoose has no id to follow.
- The virtual's name is the plural of what it holds — `addresses`, `contacts` — and the header above
  it says why the list is read rather than stored.

---

## 6. validators/constants rules

File: `src/validators/constants/<entity>_constants.js`

```js
const order_validation_limits = Object.freeze({
  ORDER_CODE_MIN: 2,
  ORDER_CODE_MAX: 50,
  QUANTITY_MIN: 1,
  QUANTITY_MAX: 10000,
});

const order_validation_patterns = Object.freeze({
  ORDER_CODE: /^[A-Z0-9-]+$/,
});

module.exports = { order_validation_limits, order_validation_patterns };
```

- Every exported object is `Object.freeze`d.
- Key naming: `<FIELD>_MIN` / `<FIELD>_MAX` for lengths and numeric bounds, `<FIELD>_MIN_ITEMS` /
  `<FIELD>_MAX_ITEMS` for arrays. A single fixed length takes no MIN/MAX pair — e.g.
  `AADHAAR_LENGTH: 12`.
- When the HTTP bound and the storage bound differ, say so in the key —
  `PASSWORD_REQUEST_MAX: 20` vs `PASSWORD_STORAGE_MAX: 500`. The model uses the storage bound.
- Prefix a key with the entity only when the bare name would be ambiguous inside its own object:
  `PRODUCT_NAME_MIN` in `product_constants.js` disambiguates from `PRODUCT_CODE_MIN`.
- `*_validation_limits` values are plain numbers only. Regexes go in `*_validation_patterns`.
  Standalone scalars that are neither (`PASSWORD_SALT_ROUNDS = 12`) are exported as bare consts.
- Register the file in `src/validators/constants/index.js`.

---

## 7. validators/messages rules

File: `src/validators/messages/<entity>_message.js`, exporting **two** frozen objects:

- `<entity>_validation_messages` — per-field validation strings. This is what the model consumes.
- `<entity>_messages` — controller/response messages: outcomes, conflicts, not-found. The model does
  not read these, but they live in the same file and both must be registered in the barrel.

Any message that mentions a bound **must interpolate the constant** — never hardcode the number:

```js
const {
  order_validation_limits,
} = require("@validators/constants/order_constants");

const order_messages = Object.freeze({
  CREATED: "Order created successfully",
  FETCHED: "Order fetched successfully",
  LISTED: "Orders fetched successfully",
  UPDATED: "Order updated successfully",
  DELETED: "Order deleted successfully",
  NOT_FOUND: "Order not found",
  CODE_EXISTS: "An order with this order_code already exists",
  INVALID_ID: "Invalid order id",
});

const order_validation_messages = Object.freeze({
  ORDER_CODE_REQUIRED: "Order code is required",
  ORDER_CODE_BASE: "Order code must be a string",
  ORDER_CODE_EMPTY: "Order code cannot be empty",
  ORDER_CODE_MIN: `Order code must be at least ${order_validation_limits.ORDER_CODE_MIN} characters`,
  ORDER_CODE_MAX: `Order code must not exceed ${order_validation_limits.ORDER_CODE_MAX} characters`,
  ORDER_CODE_INVALID: "Order code must contain only uppercase letters, digits, and hyphens",
});

module.exports = { order_messages, order_validation_messages };
```

- Standard key suffixes per field: `_REQUIRED`, `_BASE`, `_EMPTY`, `_MIN`, `_MAX`, `_INVALID`.
  The model uses `_REQUIRED`, `_MIN`, `_MAX` and `_INVALID` (for `enum` and `match`). `_BASE` and
  `_EMPTY` exist for the request validators — write the full set so the field's messages are
  complete and the validator layer has nothing to invent.
- Keys need only be unique within their own object — the objects are namespaced, so `NAME_MIN` in
  `product_validation_messages` does not collide with `user_validation_messages`.
- Register both exports in `src/validators/messages/index.js`.

---

## 8. enums, patterns and ref checks

### Enums

File: `src/enums/<entity>_enums.js`, `Object.freeze`d, registered in `src/enums/index.js`.

```js
const order_status = Object.freeze({
  DRAFT: "draft",
  CONFIRMED: "confirmed",
  DISPATCHED: "dispatched",
});

module.exports = { order_status };
```

In the schema, consume it as `Object.values(order_status)` — never an inline array of strings.

**`enum-structure` is the full rule** — where an enum lives, how it is named, the ripple a change
causes, and what a renamed or removed value does to documents already storing it. Read it before
adding, extending or removing any enum. Do not restate its rules here.

### Patterns

Regexes belong in the entity's constants file as `<entity>_validation_patterns`. There is no shared
`regex.js`. If a pattern is genuinely cross-entity, add it to `src/validators/constants/common.js`
and export it from the barrel. Keys are `UPPER_SNAKE_CASE` named after the meaning (`EMAIL`,
`PHONE_NUMBER`), with no `_REGEX` suffix.

### Ref-existence checks

MongoDB has no foreign keys, so "this `ObjectId` points at a document that exists and is still
active" is something the application has to check. **The controller checks it, before the write.**
The model contributes `ref` (for populate) and `required` (for presence), and nothing more.

Lookups live in `src/helpers/common/db/`, one exported function per file, importing models at the top like every
other file:

```js
const mongoose = require("mongoose");

const { product_model } = require("@models/product");

const is_active_product_exists = async (value) => {
  // A null/undefined value is left to the field's own `required` rule.
  if (!value) {
    return false;
  }

  // Reject malformed ids before touching the database.
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return false;
  }

  const product = await product_model.findById(value).select("is_active").lean();

  return Boolean(product && product.is_active);
};

module.exports = { is_active_product_exists };
```

- Name: `is_active_<entity>_exists`. When the caller also needs a field off the referenced document,
  write `find_active_<entity>` returning the document or `null` instead, and let the controller do
  both jobs with one query — see `find_active_company_address`, which proves the address is active
  *and* yields the company that owns it.
- Import via `@helpers/common` — the feature barrel, never a path inside it. See `helper-structure` §3.
- Import it **only from controllers**. A model that imports this helper recreates the import cycle
  described below.
- Do not repeat the same lookup inline in a controller; reuse the helper.

#### Why this is not a schema validator

The obvious place for this check is `validate: { validator: is_active_product_exists }` on the field.
It does not work here, and the failure is not subtle. The helper must import the model to query it,
and the model must import the helper to use it as a validator — a require cycle. Node resolves a
cycle by handing whichever module loads second a half-built `module.exports`, so:

| Which loads first | What you get |
|---|---|
| the model (what `app.js` does) | `TypeError: <Model>.findById is not a function` on the first request that hits the validator — the app boots clean and dies in production |
| the helper | `MongooseError: Invalid validator. Received (undefined) undefined` at boot |

A lazy `require` inside the validator hides the cycle rather than removing it. Moving the check to
the controller removes it: `controller → @helpers/common/db → model` flows one way.

There is a second reason. A validator that queries has no session, so inside a transaction it cannot
see rows that transaction just wrote, and a valid nested create gets rejected. Threading the session
into a validator means reaching for `this.$session()` and hoping Mongoose bound `this` to a
document. A controller holds the session in a plain variable.

#### What it costs

The guarantee is now only as good as the paths that call it. Anything writing a referencing document
outside the controllers — a migration in `scripts/migrations/`, a seed script, a new endpoint — must
run the check itself or it will store an orphan. When you add a `ref` field, say so explicitly in
your report: name the controller that guards it, and name any write path that does not.

Report a bad reference as a **400 in the same envelope Mongoose used to produce**, so the client
sees no difference:

```js
throw new app_error(http_status.BAD_REQUEST, error_messages.VALIDATION_FAILED, [
  { field: "company", message: company_address_validation_messages.COMPANY_INVALID, type: "reference_error" },
]);
```

`reference_error(field, message)` in `@utils/reference_error` already builds exactly this;
reuse it rather than assembling the shape by hand. The `<FIELD>_INVALID` message it takes lives in
the entity's `*_validation_messages` as usual — that part is unchanged.

**Generic non-DB helpers** go in `src/helpers/<feature>/utils/<function>.js`. Reuse an existing function if one
fits; otherwise add it there rather than defining it inside a model.

---

## 9. Removing a model or a field

Deleting is where orphans accumulate. A removal is only complete when nothing still points at the
thing removed.

**Before removing anything**, confirm with the user:

- Is this a code-level removal only, or does existing data need a migration or cleanup script?
- Does any other model `ref` it? Do any documents still hold those `ObjectId`s?
- Is the field or collection referenced by a live route the client depends on?

Never drop a collection or run a destructive data operation on your own initiative — propose it and
let the user run it.

**Removing a field:** delete it from the schema, then delete every definition that existed only for
it — its `*_MIN` / `*_MAX` limits, its pattern, its `_REQUIRED` / `_BASE` / `_EMPTY` / `_MIN` /
`_MAX` / `_INVALID` messages, and any enum used by nothing else. Remove it from every inline index
and from every `schema.index(...)` compound key, rebuilding the remaining key order deliberately
rather than just deleting the entry. Grep the field name across `src/` before declaring done.

**Removing a model:** delete the whole `src/models/<entity>/` folder — model file and barrel — then

- delete `<entity>_constants.js`, `<entity>_message.js`, `<entity>_enums.js` and **unregister each
  from its barrel `index.js`** — both the `require` line and the `module.exports` entry;
- delete its `is_active_<entity>_exists` / `find_active_<entity>` from
  `src/helpers/common/db/`, **and the controller guards that called them**, and any `ref`
  field in another model that used it, along with that field's limits, messages and indexes;
- delete the entity's controllers, routes, request validators, README section, `REST Client/`
  requests and tests, or flag them explicitly if they are out of this skill's scope.

A leftover barrel entry pointing at a deleted file throws on startup; a leftover `ref` to a deleted
model throws on populate. Both must be gone.

**Prefer deactivation over deletion** where the intent is "stop using this": the project already
soft-deletes documents via `is_active`. If the user wants a model or field retired but its data
preserved, say so and let them choose.

Verify with the section 11 load commands plus a grep for the removed identifiers.

---

## 10. Ripple effects to flag

A model change is rarely confined to the model. Check these and update what is in scope; for what is
out of scope, say so explicitly in the final report so nothing is silently left broken:

- **In scope:** the entity's constants, messages, enums, patterns, and its lookups in `src/helpers/common/db/`.
- **Flag, don't fix here:** the controller guard for any `ref` field added or removed. The lookup in
  The lookup file is in scope; the `if` in the controller that calls it is not. A `ref` with a
  lookup but no caller is an unenforced reference — name the exact controller that needs it.
- **Flag, don't fix here:** the Joi schemas in `src/validators/request_body`, `query_params` and
  `route_params`. A field added to the model but not to its request validator is unreachable; a
  field in the validator but not the model is silently dropped. Name the exact files that need
  follow-up.
- **Check:** controllers in `src/controllers/<entity>/` — projections, filters, search, update
  payloads.
- **Check:** `README.md` — the routes section documents accepted fields and enum values.
- **Check:** `REST Client/` payload files and `test/`.

---

## 11. Comments

A schema is data. Every word about a field goes in the `/** */` block above the `const`, keyed by
the field's name — never inside `new mongoose.Schema({ ... })`, an `Object.freeze`, a constants map
or a messages map. A reader scanning a field list should not have to step over prose to reach the
next field.

**`model-comments` is the full rule** — what the header records, the file-level block, hooks and
methods, and the checklist. Read it before writing or reviewing a model's comments. Do not restate
its rules here.

---

## 12. moment and lodash

Both are project dependencies (`moment ^2.30.1`, `lodash ^4.18.1`). Reach for them **whenever the
logic needs them** rather than hand-rolling the equivalent.

**`moment` for every date computation** beyond passing a `Date` straight through. Native `Date`
arithmetic, manual UTC offset maths and hand-built format strings are not acceptable.

```js
const is_future = (value) => moment(value).isAfter(moment());
moment(received_payment_date).isBefore(moment(payment.payment_date));

// strict parsing of client input, and an IST-anchored boundary
const exact = moment.parseZone(raw, moment.ISO_8601, true);
const ist = moment(reference_date).utcOffset(app_time.UTC_OFFSET);
```

Offsets, format strings and window sizes come from `@validators/constants` -- never inline `"YY"`,
`330` or `"+05:30"`.

**`lodash` where it beats the language**: defensive access, coercion and shape work.

```js
_.get(row, "amount", 0)             // safe read of an unknown-shaped object
_.difference(patched, ALLOWED)      // which keys did this patch carry that it should not
_.reject(plans, (p) => p.done)      // filtering a list that may be undefined
_.isNil(value) / _.isEmpty(doc)     // nullish, or empty object/array/string
_.toNumber(raw) / _.isInteger(n)    // coerce, then verify
_.padStart(sequence, len, "0")      // fixed-width formatting
```

Not where the language already reads better: `map`/`filter`/`find` on a plain array, `.toObject()`
rather than `_.cloneDeep` on a mongoose document, optional chaining rather than `_.get` on a value
Joi already guaranteed, `Object.assign(doc, req.body)` rather than `_.merge`.

**Where the code that uses them goes.** Not in the schema. A Mongoose validator is synchronous and
sees one value, so anything needing a date compared against another field, or a reduction over a
subdocument array, is a cross-field rule and belongs in the feature's helper -- which is also the
only place that can see both values. A model file that has grown a `moment` import is usually a
model that has grown a rule it should not own.

---

## 13. Definition of done

Before reporting a model change complete, verify:

- [ ] Every field the requester asked for is present, with type / required / bounds / enum / ref / default / normalization as agreed.
- [ ] Zero literal numbers and zero literal message strings inside the schema.
- [ ] No schema `validate` function and no `pre` / `post` hook queries the database. `src/models/`
      contains no `require("@helpers/common")` — grep for it and expect nothing.
- [ ] Every `ref` field added has a matching guard in the controller that writes it, reported by
      name, and every write path that skips the guard is called out.
- [ ] The model sits at `src/models/<entity>/<entity>_model.js` with an `index.js` barrel beside it, and every consumer imports `{ <entity>_model }` from `@models/<entity>`.
- [ ] All limits exist in a `<entity>_constants.js` and that file is registered in `src/validators/constants/index.js`.
- [ ] All messages exist in a `<entity>_message.js`, interpolate their limits, and both exports are registered in `src/validators/messages/index.js`.
- [ ] All enums are `Object.freeze`d, in `src/enums/<entity>_enums.js`, registered in `src/enums/index.js`.
- [ ] Any new regex is in that entity's `*_validation_patterns` (or `common.js` if truly shared).
- [ ] Existing limits / messages / enums / patterns / helpers were reused wherever one already matched **in meaning** — no duplicates introduced.
- [ ] On a removal: every limit, message, enum, pattern, helper, `ref` and index entry that existed only for the removed model or field is gone, and every barrel `index.js` was unregistered. A grep for the removed identifiers across `src/` returns nothing.
- [ ] Imports go through `@enums`, `@validators/constants`, `@validators/messages`, `@helpers/<feature>` — no relative paths, no per-file imports outside the documented exceptions.
- [ ] `is_active`, `timestamps` mapping, `versionKey: false`, `toJSON` / `toObject` `flattenMaps` all present.
- [ ] A model with children declares a populate virtual rather than storing an array of them, carries `virtuals: true` on both serialisers, and puts no `match` on the virtual.
- [ ] Single-field indexes inline; compound and text indexes at the bottom via `schema.index(...)`; uniqueness scoping and soft-delete interaction decided deliberately.
- [ ] All of these load without error. The first three are the cycle check — a model, the helper and
      the app must each be safe as the *first* thing loaded, because a require cycle only bites on
      one particular entry order:
      `node -e "require('module-alias/register'); require('@models/<entity>')"`
      `node -e "require('module-alias/register'); require('@helpers/common')"`
      `node -e "require('module-alias/register'); require('@src/app')"`
      `node -e "require('module-alias/register'); require('@enums'); require('@validators/constants'); require('@validators/messages')"`
- [ ] No comment sits inside a `mongoose.Schema`, an `Object.freeze`, a constants map, a messages map or any other object literal; every explanation is in the `/** */` header above the `const`, keyed by field name.
- [ ] Date work goes through `moment` rather than raw `Date` maths; lodash is used where it beats the native equivalent and not where it does not; format strings and offsets come from a constant.
- [ ] The report names which files were created versus reused, and which request validators still need follow-up.

---

## 14. Worked example

**Request:** "add an order model"

**Step 1 — ask** (single consolidated message, with recommendations):

> I need the field spec. Here's what I'd recommend as a DB engineer — confirm or correct:
>
> | field | type | required | bounds | unique | index | note |
> |---|---|---|---|---|---|---|
> | `order_code` | String, trim, uppercase | yes | 2–50 chars | yes | inline | duplicate surfaces as `order_messages.CODE_EXISTS` |
> | `product` | ObjectId → Product | yes | — | no | inline | `ref` only; existence checked in the create-order controller via a new `is_active_product_exists` in `src/helpers/common/db/` |
> | `quantity` | Number | yes | 1–10000 | no | no | |
> | `order_status` | String enum | yes | new `order_status` enum: draft / confirmed / dispatched | no | inline | default `draft` |
> | `notes` | String, trim | no | 3–2000 chars | no | no | `default: null` |
> | `is_active` | Boolean | — | — | no | inline | soft delete, default `true` |
>
> Suggested compound index: `{ product: 1, order_status: 1, is_active: 1 }` for the expected list
> filters. `order_code` unique is global; because deletes here are soft, a deleted order keeps its
> code reserved — tell me if a soft-deleted order should free the code, in which case I'll make it a
> partial unique index on `{ is_active: true }`.

**Step 2 — after confirmation**, create or extend in this order:

`src/enums/order_enums.js` → `src/enums/index.js` →
`src/validators/constants/order_constants.js` → `src/validators/constants/index.js` →
`src/validators/messages/order_message.js` → `src/validators/messages/index.js` →
`src/helpers/common/db/` (if a ref lookup is needed) →
`src/models/order/order_model.js` → `src/models/order/index.js`.

**Step 3** — run the section 11 checklist. Report which files were created versus reused, and note
that the order request-body / query / param validators, controllers, routes, README and REST Client
payloads still need to be built to match.
