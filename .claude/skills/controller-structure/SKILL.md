---
name: controller-structure
description: Create or modify CRUD controllers in the AIRSTONE project. Use whenever adding, changing, reviewing, or refactoring a file under src/controllers — "new endpoint", "add a controller", "create the X API", "add a create/update/delete/list handler". Enforces the project's controller layout, import order, error and response contract, per-action patterns, comment discipline, and the boundary between controller, helper and utility code so every controller looks the same regardless of who — or which AI — wrote it.
---

# Controller Structure

A **controller** is one HTTP action. It receives a request that has already been authenticated,
authorised and shape-validated, does only the work that those earlier layers could not do, and
returns exactly one response.

Nothing about the request shape is re-checked here. Every status code comes from `@enums`, every
message string comes from `@validators/messages`, every response leaves through `send_response`,
every failure leaves through `throw`, and anything that touches the database more than once
belongs in a helper.

---

## 0. Scope

This skill owns the controller layer and nothing else.

**In scope**

- Files under `src/controllers/<feature>/`
- That feature's `src/controllers/<feature>/index.js`
- Deciding whether overflow logic goes to `src/helpers/` or `src/utils/`

**Out of scope — never created or edited by this skill**

- `src/models/` — see the `model-structure` skill
- `src/validators/` — messages, constants, request-body schemas, route-param and query-param configs
- `src/routes/` — route files, role mounting, authentication and authorisation
- `src/enums/`
- `test/`

The controller **consumes** those layers. If something it needs is missing — a message constant, a
Joi schema, an enum value, a list config — **stop and report exactly what is missing and where it
belongs.** Do not create it, and do not inline a literal as a workaround.

### Prerequisite check

Before writing a controller, confirm each of these exists. Report the missing ones and stop.

| Needed | Location | Example |
|---|---|---|
| Model | `src/models/<feature>/<feature>_model.js` | `user_model` |
| Success + error messages | `src/validators/messages/<feature>_message.js` | `employee_messages.CREATED` |
| Request-body schema (create / update) | `src/validators/request_body/<feature>/` | `create_employee_schema` |
| Route-param validator (get / update / delete) | `src/validators/route_params/` | `employee_id_params_validator` |
| List query config (list) | `src/validators/query_params/<feature>/` | `list_employees_config` |
| Any enum the action branches on | `src/enums/` | `manageable_user_types` |

---

## 1. Where things live

| What | Path | Import |
|---|---|---|
| Controllers | `src/controllers/<feature>/<action>_<feature>.js` | `@controllers/<feature>` |
| Models | `src/models/<feature>/<feature>_model.js` | `@models/<feature>` (barrel only) |
| Enums (barrel) | `src/enums/index.js` | `@enums` |
| Messages (barrel) | `src/validators/messages/index.js` | `@validators/messages` |
| Constants (barrel) | `src/validators/constants/index.js` | `@validators/constants` |
| List query config | `src/validators/query_params/<feature>/` | `@validators/query_params/<feature>/<file>` |
| Helpers — shared | `src/helpers/common/` | `@helpers/common` (barrel only — see `helper-structure`) |
| Helpers — feature-specific | `src/helpers/<feature>/` | `@helpers/<feature>` (barrel only) |
| Response shape config (select + populate) | `src/helpers/<feature>/constants/<feature>_response.js` | `@helpers/<feature>` (see §11) |
| Utilities — pure logic | `src/utils/` | `@utils/<file>` (see §10) |
| `app_error` | `src/middlewares/app_error.js` | `@middlewares/app_error` |

CommonJS `require(...)` only. Path aliases only — never a relative path such as `../../models`.
Aliases resolve at runtime through `_moduleAliases` in `package.json` and in the editor through
`paths` in `jsconfig.json`.

**Quote style: double quotes.** The codebase is mixed (789 double vs 222 single); double is the
standard for new files. When editing an existing file, match that file rather than converting it.

---

## 2. Read before you write

Never write a controller from this document alone. First read:

1. Two sibling controllers for the **same action** in other features — e.g. before writing
   `create_stock`, read `create_product` and `create_company_contact`.
2. The feature's `src/controllers/<feature>/index.js`.
3. The model, to learn field names, `ref`s, defaults and which uniqueness indexes exist.
4. The Joi schema for this action, to learn what is **already** validated so it is not repeated.
5. The feature's helper file, if one exists, before writing any new DB logic.

Match what those files do. Where this document and the surrounding code disagree on something not
explicitly ruled on here, follow the code and say so.

---

## 3. Folder and file layout

- One folder per feature: `src/controllers/<feature>/`. Create it only when the feature has no
  folder yet.
- One file per action. Filenames: `create_<feature>.js`, `get_<feature>.js`,
  `list_<feature>s.js`, `update_<feature>.js`, `delete_<feature>.js`.
- **Plural only for `list`** — `list_employees.js`, `list_companies.js`, `list_stocks.js`.
- The exported function name is identical to the filename: `create_employee.js` exports
  `create_employee`.
- One controller per file, exported as `module.exports = <function>` — never an object.
  Private helpers used by that one controller may live above it in the same file (see
  `get_summary` in `list_employees.js`).
- **Only the actions the feature needs.** `company_address` has no get or list; `stock` has no
  get. Do not scaffold an action nobody asked for.
- snake_case everywhere: files, folders, functions, variables.

### `index.js`

Every action file is registered in the feature's `index.js`, which is the only import surface —
callers always `require("@controllers/<feature>")`, never a file path.

```js
const get_employee = require("@controllers/employee/get_employee");
const list_employees = require("@controllers/employee/list_employees");
const create_employee = require("@controllers/employee/create_employee");
const delete_employee = require("@controllers/employee/delete_employee");
const update_employee = require("@controllers/employee/update_employee");

module.exports = {
  get_employee,
  list_employees,
  create_employee,
  delete_employee,
  update_employee,
};
```

Ordering: require lines sorted by line length, shortest first; ties keep the canonical action order
**get → list → create → delete → update**. The exported object mirrors the require block exactly.
Both blocks must be updated together — a file missing from `index.js` resolves to `undefined` at the
route and fails only when the endpoint is called.

---

## 4. Canonical controller file

Sections in this exact order:

```js
// 1. third-party (only if genuinely needed — see §12)
const _ = require("lodash");

// 2. models, then app_error
const { product_model } = require("@models/product");
const app_error = require("@middlewares/app_error");

// 3. single-line destructured requires, sorted by line length, shortest first
const { http_status } = require("@enums");
const { project } = require("@utils/projection");
const { product_response } = require("@helpers/product");
const { send_response, get_response_shape } = require("@helpers/common");
const { is_active_company_exists } = require("@helpers/common");

// 4. multi-line destructured requires, same length ordering
const {
  product_messages,
  product_validation_messages,
} = require("@validators/messages");

/**
 * 5. header comment — see §9
 */
const create_product = async (req, res) => {
  // ... only the work Joi could not do
  return send_response(res, http_status.CREATED, product_messages.CREATED, product);
};

// 6. export
module.exports = create_product;
```

A blank line separates each group. Within groups 3 and 4, sort by the length of the whole
`const … = require(…);` line, shortest first.

---

## 5. Error handling

**There is no `try`/`catch` in any controller, and none may be added.** Zero exist in the codebase
today. `async_handler` wraps every controller at the route and forwards rejections to
`error_handler`, which formats the response.

Fail by throwing:

```js
// not found / gone / conflict — anything with a plain status and message
throw new app_error(http_status.NOT_FOUND, employee_messages.NOT_FOUND);

// a bad reference in the body — reports which field was wrong
throw reference_error("agency", product_validation_messages.AGENCY_INVALID);
```

Rules:

- `app_error(status_code, message, details?)` from `@middlewares/app_error`. Status from
  `@enums`, message from `@validators/messages`. Never a literal number, never a literal string.
- Use `reference_error(field, message)` from `@utils/reference_error` when the failure is
  "this id in the body does not point at a live document" — it produces the field-scoped 400 shape
  the API already returns elsewhere.
- A write that can collide with a unique index goes through
  `run_with_duplicate_mapping(() => doc.save())` so the driver's E11000 becomes a readable error
  instead of a 500.
- A write that can lose a generated-id race is wrapped in `retry_when(<predicate>, <max>, fn)` from
  `@helpers/common` — as `super_admin_signup` does with `is_emp_id_duplicate_error`.
- A feature whose model carries several unique indexes maps them itself — `employee` uses
  `run_with_user_duplicate_mapping` from `@helpers/auth` so the caller learns
  *which* column clashed.
- Never swallow an error, never log-and-continue, never return a partial success.

---

## 6. Response contract

Every successful exit is a single `return send_response(...)`:

```js
return send_response(res, http_status.CREATED, product_messages.CREATED, product);
return send_response(res, http_status.OK, employee_messages.DELETED);
```

- Signature: `send_response(res, status, message, data = {})`.
- Never `res.json(...)`, `res.send(...)` or `res.status(...)` directly. Never call `next()` on the
  success path.
- **`data` is always an object.** `null`/`undefined` becomes `{}`, so a controller with nothing to
  return simply omits the fourth argument (see `delete_employee`). An **array throws a
  `TypeError`** — `send_response` will not guess a key for it.
- A list therefore never goes in as the payload itself. It goes under a name inside the object, as
  `list_employees` does with `{ employees, summary, sort, pagination }`. The key is the resource
  plural, so `data.employees` reads for itself; per-field failures use `errors`, which the error
  handler owns.
- Status codes: `CREATED` for create, `OK` for everything else. From `@enums`, never a literal.

---

## 7. What belongs in a controller

By the time a controller runs, the request has already passed:

| Layer | Already guaranteed |
|---|---|
| `authenticate_user` | a valid token exists and `req.user` is populated |
| `authorize_user_types` | the caller's role is allowed on this route |
| `validate_body(schema)` | body shape, types, bounds, enums, unknown fields rejected |
| `validate_params` / `validate_query` | id format, pagination, sort and filter keys |
| the model | field types, required, min/max, enum, regex, unique indexes |

So the controller does **only what none of those can see**:

- **Existence and liveness of referenced documents** — `is_active_company_exists(req.body.agency)`.
  A model validator cannot do this without a query; this is the layer that queries.
- **Cross-field rules** — `assert_pricing_rules(req.body)`, comparing one submitted value against
  another.
- **Ownership and consistency** — e.g. the address decides which company owns a contact, so a
  `company` in the body that disagrees with the stored address is reported rather than trusted
  (`create_company_contact`).
- **Soft-delete interactions** — reviving a soft-deleted row when a unique index is not scoped to
  active records.
- **Server-derived values** — ids, defaults and timestamps that must never come from the client
  (`emp_id`, `employee_defaults.PASSWORD`).

It must **not**:

- re-validate anything the Joi schema already checked;
- inspect `req.user.user_type` to decide what is allowed — authorisation lives in the route;
- build ad-hoc query/sort/pagination logic when `build_list_query` exists;
- open a mongoose session (see §10).

### Request access

- Body: `req.body`. Already validated and stripped of unknown keys.
- Route params: `req.params.id`.
- **Query: `req.validated_query` — never `req.query`.** Express 5 exposes `req.query` as a getter;
  the validated, coerced copy is what `validate_request` writes and what `build_list_query`
  expects. Reading `req.query` is a silent-bug generator.

---

## 8. Per-action patterns

### create

```js
const create_product = async (req, res) => {
  if (!(await is_active_company_exists(req.body.agency))) {
    throw reference_error("agency", product_validation_messages.AGENCY_INVALID);
  }

  assert_pricing_rules(req.body);

  const product = await product_model.create(req.body);

  const { select, populate } = get_response_shape(product_response, "create");

  await product.populate(populate);

  return send_response(
    res,
    http_status.CREATED,
    product_messages.CREATED,
    project(product, select),
  );
};
```

Order: verify references → cross-field rules → build server-derived values → write → populate →
project → 201. Use `model.create(...)` for a plain insert; use `new model(...)` + `save()` when the document
is assembled conditionally or has to be revived from a soft-deleted row.

### get

```js
const { select, populate } = get_response_shape(product_response, "get");

const product = await product_model
  .findById(req.params.id)
  .select(select)
  .populate(populate);

if (!product) {
  throw new app_error(http_status.NOT_FOUND, product_messages.NOT_FOUND);
}
```

Fetch scoped to live records where the feature requires it, 404 through `app_error` when nothing
matches. Never return an inactive document as if it were missing data — `get_employee` deliberately
returns deactivated accounts because the table above it can filter down to them.

### list

```js
const { filter: column_filter, sort, applied_sort, options, page, limit, skip } =
  build_list_query(req.validated_query, list_products_config);

// Only when the config declares reference_filters — a filter whose value must be
// resolved against another collection before the list query can run.
const filter = await apply_reference_filters(
  column_filter,
  req.validated_query,
  list_products_config,
);

const { select, populate } = get_response_shape(product_response, "list");

const [products, total] = await Promise.all([
  product_model
    .find(filter, null, options)
    .select(select)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate(populate),
  product_model.countDocuments(filter),
]);

return send_response(res, http_status.OK, product_messages.LISTED, {
  products,
  sort: applied_sort,
  pagination: build_pagination(page, limit, total),
});
```

- Filtering, sorting and pagination always come from `build_list_query` + the feature's config in
  `@validators/query_params/<feature>/list_<feature>_config`. A controller importing that config is
  intentional, not a layering violation — the config is the resource's table contract, and it is the
  single source both the Joi schema and this builder read.
- `apply_reference_filters` is awaited **only** by controllers whose config declares
  `reference_filters`; it is kept out of `build_list_query` so that stays synchronous.
- Response shape is fixed: `{ <resource>s, summary?, sort, pagination }`.
- Independent reads run inside one `Promise.all`.
- A dashboard `summary` is computed by a private function above the controller and is deliberately
  **not** filtered by the page query — say so in a comment when that is the intent.

### update

```js
const employee = await user_model.findOne({ _id: req.params.id, ... });

if (!employee) {
  throw new app_error(http_status.NOT_FOUND, employee_messages.NOT_FOUND);
}

Object.assign(employee, req.body);
await employee.save();

const { select, populate } = get_response_shape(employee_response, "update");

await employee.populate(populate);

return send_response(
  res,
  http_status.OK,
  employee_messages.UPDATED,
  project(employee, select),
);
```

`findOne` → `Object.assign` → `save()` is the standard, because `save()` runs the full set of
schema validators against the merged document. Reach for `findOneAndUpdate` only when the update
must be atomic against a concurrent write, and then pass `{ new: true, runValidators: true }`.

The read here takes **no `select`** — `save()` must validate and persist the whole document, and a
projected document saves back a mutilated one. The response shape is applied afterwards, to the
response only.

### delete

**Soft delete only.** Never `deleteOne`, `deleteMany` or `findByIdAndDelete`.

```js
const employee = await user_model.findOneAndUpdate(
  { _id: req.params.id, user_type: { $in: manageable_user_types }, is_active: true },
  { is_active: false },
  { new: true, runValidators: true },
);

if (!employee) {
  throw new app_error(http_status.NOT_FOUND, employee_messages.NOT_FOUND);
}

return send_response(res, http_status.OK, employee_messages.DELETED);
```

`is_active: true` in the filter makes an already-deleted record read as missing rather than being
deleted twice. Deletes return a message with no payload.

---

## 9. Comments

Two kinds, both mandatory.

### Header block — JSDoc

Every controller opens with a JSDoc block: standard tags in a fixed order, plain English prose.

```js
/**
 * One line saying what the endpoint does.
 *
 * A short paragraph per rule the signature cannot show, saying why.
 *
 * @route   POST /super-admin/employees      one line per mount
 * @access  Super admin                      roles, never a URL
 *
 * @param   {import("express").Request} req
 * @param   {Object} req.body Validated by `create_employee_schema`.
 * @param   {string} req.body.first_name Required. 1-100 chars, trimmed.
 * @param   {string} [req.body.notes]    Optional. Up to 500 chars.
 * @param   {import("express").Response} res
 *
 * @returns {Promise<void>} 201 with the columns in `employee_response`.
 *
 * @throws  {app_error} 409 `ALREADY_EXISTS` when the email is taken.
 */
```

**`controller-comments` is the full rule** — what belongs in the prose, how each tag is filled in,
what is deliberately left out, and the checklist. Read it before writing or reviewing a header.
Do not restate its rules here; one source of truth, so the two cannot drift.

### Why-notes

`//` comments at each non-obvious decision, placed **above the statement** they explain, and
**never inside an object literal** — not in a `send_response` payload, a filter object, a populate
spec, an `Object.freeze` or a response-shape config. Anything a key needs said about it belongs in
the `/** */` block above the `const`, as prose keyed by that key's name. This is the same rule
`model-structure` states for a schema and `query-params` states for a list config. Explain the
reasoning, not the mechanics:

```js
// The unique index on (company_address, contact_person_mobile_number) is not
// scoped to active rows, so a soft deleted contact person keeps its number
// reserved. Re-adding that number revives the stored row rather than failing
// on a duplicate the caller cannot see.
```

Never `// find the user` above `findOne`. If a line needs no explanation, it gets no comment.

---

## 10. Where overflow logic goes

A controller should read as a short sequence of named steps. When logic grows past that, it moves —
it does not stay inline and it does not get duplicated into a second controller.

| Kind of logic | Home | Import |
|---|---|---|
| DB logic used by more than one feature | `src/helpers/common/db/` | `@helpers/common` |
| DB logic used by exactly one feature | `src/helpers/<feature>/db/` | `@helpers/<feature>` |
| Pure — no database, no `req`, no `res` | `src/utils/` | `@utils/<file>` |

**Helpers.** Every helper feature is a folder holding `index.js`, `constants/`, `db/` and `utils/`,
one exported function per file. `common/` holds only what a second feature already imports.
**`helper-structure` is the full rule** — which folder a function goes in, the import rules that keep
them free of cycles, and the JSDoc every helper file carries. Read it before adding a helper.

A new helper starts in its **feature folder**, always. It moves to `common/` the day a **second**
feature actually imports it — never speculatively. `employee_helper.js` documents its own move in
exactly these terms; copy that habit, including the comment saying when it should move.

Helpers are imported by direct path and have **no barrel `index.js`**, unlike `@enums` and
`@validators/messages`. Do not add one — lazy model requires inside helpers exist to avoid circular
imports, and a barrel reintroduces them.

**Utils.** `src/utils/` holds `projection/`, `financial_year/`, `constants/` and the flat
`reference_error.js`, and both aliases are already registered — `"@utils": "src/utils"` in
`package.json` `_moduleAliases` and `"@utils/*": ["./src/utils/*"]` in `jsconfig.json` `paths`. If
you ever add a new top-level folder of your own, register it in **both**: missing the first gives
`Cannot find module "@…"` at runtime; missing the second only breaks editor navigation, which is
worse because it looks fine.

A util with more than one exported function gets a folder holding `index.js` and one file per
function; a single standalone function stays a flat file, as `reference_error.js` does. Import the
one you want — `require("@utils/projection")` — never the `@utils` barrel, which would load every
util, moment and lodash included, on every request.

Utils never talk to the database. The boundary in the awkward middle:

| Task | Where | Why |
|---|---|---|
| Validate an already-loaded document's fields against each other | utils | pure, no query |
| Build a mongoose filter object | utils | it is just an object |
| Run that filter | helper | it queries |
| Round or format a monetary value | utils | pure |
| Check that a referenced id exists and is active | helper | it queries |
| Own a `startSession` / `withTransaction` block | helper | it writes |

**Transactions.** A controller never calls `startSession` or `withTransaction`. Multi-collection
writes are owned end-to-end by a helper — as they already are in `company_relations_helper` and
`stock_helper` — so a half-applied write cannot escape.

---

## 11. Response shape: select and populate

**No controller decides what a response contains.** Which columns of the resource are returned, and
which references are expanded and with which of *their* columns, are declared once per feature in a
response-shape config that every action of that feature reads. Adding or removing a field is then a
one-line change in one file, and every endpoint that returns that resource changes together.

This mirrors how list query params already work: a declarative per-resource config, consumed rather
than restated.

### The file

`src/helpers/<feature>/constants/<feature>_response.js` — one per feature, exported through the
feature's barrel.

**A second config in the same feature is allowed only when the feature answers with two genuinely
different kinds of payload.** `auth` has two: `auth_response` describes the person who just signed
in, and `signup_response` describes an account somebody else just created — so it carries `emp_id`
and `is_active`, which a signin reply has no use for, and no token. Two configs because the payloads
differ in what they *are*, not because two endpoints wanted different columns. If the only
difference is which columns an action returns, that is a named action key inside the one config
(`create`, `list`, `get`), not a second file.

```js
const { company_ref } = require("@helpers/company");

// The columns of the product itself that any endpoint may return.
const PRODUCT_SELECT = [
  "product_code",
  "name",
  "category",
  "model_number",
  "description",
  "agency",
  "purchase_price",
  "sale_price",
  "gst_percentage",
  "is_active",
  "created_at",
  "updated_at",
].join(" ");

/**
 * The shape every product response is built from.
 *
 * `agency` is a reference rather than a name the product carries, so every
 * endpoint expands it -- a client that used to read "CG" off the row would
 * otherwise get a bare id and have to fetch the company itself.
 */
const product_response = Object.freeze({
  // Used by every action that does not name its own variant.
  default: Object.freeze({
    select: PRODUCT_SELECT,
    populate: Object.freeze([company_ref("agency")]),
  }),
});

module.exports = { product_response, PRODUCT_SELECT };
```

Rules for the config:

- `default` is **required**. It is the shape the whole feature serialises with, so the same resource
  reads identically whichever endpoint returned it.
- `Object.freeze` the config, each variant and each populate array.
- `select` is a space-separated **inclusion** list. Never use exclusion form (`-password`) — mongoose
  refuses to mix the two, and the projection util used on write responses cannot honour it.
- `_id` is always returned; it does not go in the list.
- Include every column the client needs to *act*, not just display — `is_active` for a row that can
  be restored, `updated_at` for optimistic concurrency. A field the UI needs and the config omits
  is a silent bug that looks like missing data.
- `populate` entries are plain mongoose specs: `{ path, select, match?, populate? }`. Each one needs
  its own explicit `select`; an absent select returns the whole referenced document, including
  anything added to that model later.
- Nested references nest: `{ path: "product", select: "...", populate: company_ref("agency") }`.
- Use `match` to hide rows the caller must not see — `match: { is_active: true }` on a populated
  child list, as `get_company` does for its addresses and contacts.
- The header comment explains **why** a reference is expanded or a column withheld, not what the
  fields are.

### The select config is presentation, never protection

A column omitted from `select` is still in the database, still returned by any query that forgets
the projection, and one careless `.find()` away from the wire.

**A field that must never leave the server is marked `select: false` on the schema** — as `password`
is on `user_model`, which additionally strips it in the model's `toJSON` transform. That is the
guarantee. The response config sits above it and decides presentation only. Never introduce a
sensitive field and rely on the response config to hide it.

### Shared reference specs

Repeated reference shapes live in the owning feature's `constants/<feature>_response.js` so the same entity
reads identically wherever it appears:

```js
const COMPANY_SELECT = "company_name company_type";

const company_ref = (path, overrides = {}) =>
  Object.freeze({ path, select: COMPANY_SELECT, ...overrides });

const get_response_shape = (config, action) => config[action] || config.default;
```

A feature that genuinely needs an extra column passes it explicitly —
`company_ref("agency", { select: `${COMPANY_SELECT} gst_number` })` — so the divergence is visible
at the call site instead of being a select string that quietly disagrees with four other files.
Today `product`, `purchase`, `sale` and `stock` each declare their own agency select and product's
already differs from the other three; new code goes through the shared spec.
`SIGNED_IN_USER_SELECT` in `@helpers/auth/constants/auth_response.js` is the same idea.

### Per-action variants

Only add one when there is a reason — a table that must stay lean, or a detail view that expands
something the list does not. A variant is a named key alongside `default`, and it replaces the whole
shape rather than merging into it:

```js
const sale_response = Object.freeze({
  default: Object.freeze({ select: SALE_SELECT, populate: SALE_POPULATE }),
  // The table needs neither the line items nor the customer's address.
  list: Object.freeze({ select: SALE_LIST_SELECT, populate: [company_ref("customer")] }),
});
```

The action key is the controller's own verb: `create`, `get`, `list`, `update`.

### Applying it

**Read actions — `get` and `list`.** The projection goes into the query, so the database never sends
the columns back:

```js
const { select, populate } = get_response_shape(product_response, "get");

const product = await product_model
  .findById(req.params.id)
  .select(select)
  .populate(populate);
```

Note the ordering constraint: a `populate` path must also appear in `select`, or mongoose has no
reference to follow. `agency` is in `PRODUCT_SELECT` for exactly that reason.

**Write actions — `create` and `update`.** The document is already in memory, and mongoose cannot
apply a projection to a document it did not fetch. Populate it, then project it through the shared
util:

```js
const { select, populate } = get_response_shape(product_response, "create");

await product.populate(populate);

return send_response(
  res,
  http_status.CREATED,
  product_messages.CREATED,
  project(product, select),
);
```

`project(document, select)` lives in `src/utils/projection/` — it is pure, so by §10 it is a util
and not a helper. It is a thin wrapper over `_.pick` on the document's `toJSON()` output, which
handles dotted paths and leaves the populated subdocuments as the populate `select` already shaped
them. Do **not** re-read the document from the database just to apply a projection; that is a round
trip to reformat data the process is already holding.

**`delete`.** A soft delete returns a message and no payload, so it needs no shape. If a feature
must echo the deactivated row, it uses `project(...)` with the same config as `update`.

### Virtuals

`company_model` and `company_address_model` serialise with `virtuals: true` — the first for its
`addresses`, the second for its `contacts`. `model-structure` owns how one is declared; this section
owns how a response config expands one.

A **computed** virtual reads other columns, and one whose columns the projection dropped silently
produces `undefined` rather than an error. When a feature has computed virtuals, its `select` must
include every column they read, and the config should say so in a comment.

A **populate** virtual is the opposite: it is not a column, so it must *not* go in `select`. Naming
it would ask the database for a field that does not exist. A real `ref` field must be in `select`,
because mongoose needs the stored id to follow — `company_contact_response.list` selects `company`
and `company_address` for exactly that reason, even though what a reader wants is the documents
behind them.

Narrow a populated child list in the populate spec, never on the virtual:

```js
{
  path: "addresses",
  select: COMPANY_ADDRESS_SELECT,
  match: { is_active: true },
  populate: { path: "contacts", select: COMPANY_CONTACT_SELECT, match: { is_active: true } },
}
```

**`match` behaves differently on a list and on a single reference.** On a child list it drops the
rows that do not match, which is what hides deactivated children. On a **to-one** reference it does
not drop anything — it replaces the document with `null`, so a contact under a deactivated company
would arrive claiming to belong to nobody. Leave `match` off a to-one parent and let its own
`is_active` say what state it is in, as `company_contact_response.list` does.

Which children a row shows is a product decision worth recording in the config's header. The company
list shows **all** of a company's active children, never only those a filter matched: a search
decides which companies appear, not what each of them contains.

### Aggregations

An aggregation has no `select` and no `populate`, so a `$project` and `$lookup` must reproduce the
same columns by hand — `stock_helper` does this for its grouped view and `list_company_contacts` for
its paged one. Build the `$project` from the exported select constant (`PRODUCT_SELECT` and friends)
rather than retyping the field list; a projection that drifts from the config means the same entity
serialises two different ways depending on which endpoint returned it.
---

## 12. moment and lodash

Both are project dependencies (`moment ^2.30.1`, `lodash ^4.18.1`) and both are already used —
in helpers, not in controllers. Reach for them **whenever the logic needs them** rather than
hand-rolling the equivalent, but prefer even more strongly to put the code that needs them in a
helper or util rather than in the controller. A controller that has grown a `moment` import is
usually a controller that has grown a rule belonging one layer down: `supplier_credit_helper`
carries every date comparison for its feature, and its eight controllers carry none.

**Use `moment` for any date work beyond passing a `Date` straight through.** Native `Date`
arithmetic, manual UTC offset maths and hand-built format strings are not acceptable.

```js
const ist_moment = moment(reference_date).utcOffset(emp_id_generation.UTC_OFFSET);
const prefix = ist_moment.format(emp_id_generation.YEAR_FORMAT);

// strict parsing of client-supplied dates
const exact = moment.parseZone(raw, moment.ISO_8601, true);
```

- Offsets, format strings and window sizes come from `@validators/constants` — never inline
  `"YY"`, `330` or `"+05:30"` in a controller.
- Parse client input strictly (`moment.ISO_8601, true`) and check `.isValid()` before use.
- Business days are IST-anchored; when a boundary matters, use an explicit `utcOffset` rather than
  the server's local zone.

**Use `lodash` for defensive access and type coercion**, which is where it earns its place:

```js
_.get(error, "keyPattern.emp_id")   // safe deep read of an unknown-shaped object
_.isEmpty(last_user)                // empty object, array, string or nullish
_.toNumber(raw) / _.isInteger(n)    // coerce, then verify
_.padStart(sequence, len, "0")      // fixed-width formatting
_.pick(json, ["a", "b.c"])          // dotted-path projection — powers @utils/projection
```

Do **not** reach for lodash when the language already reads better:

- `_.map`, `_.filter`, `_.find`, `_.reduce` on plain arrays → use the native methods.
- `_.cloneDeep` on a mongoose document → use `.toObject()` or `.lean()`.
- `_.get` on your own validated `req.body` → the Joi schema already guarantees the shape; optional
  chaining is clearer.
- `_.merge` to apply an update → `Object.assign(doc, req.body)` is the project pattern.

Neither package is imported "just in case". If a controller ends up importing one, that is usually
the signal that the logic belongs in a util or helper instead.

---

## 13. Definition of done

Before reporting a controller change complete, verify:

- [ ] The file lives at `src/controllers/<feature>/<action>_<feature>.js`, snake_case, plural only for `list`.
- [ ] The exported function name matches the filename, and the file ends `module.exports = <function>`.
- [ ] The action is registered in the feature's `index.js`, in **both** the require block and the exported object, in the canonical order.
- [ ] Import groups are in order (third-party → models/`app_error` → single-line destructured → multi-line destructured), each group sorted by line length, separated by blank lines.
- [ ] Every import uses a path alias. No relative paths.
- [ ] No `try`/`catch`. Every failure is a `throw` of `app_error` or `reference_error`.
- [ ] Every success is a single `return send_response(res, <http_status>, <message const>, data?)`.
- [ ] Zero literal status codes and zero literal message strings anywhere in the file.
- [ ] Nothing the Joi schema already validates is re-validated; nothing the route already authorises is re-checked.
- [ ] Query input is read from `req.validated_query`, not `req.query`.
- [ ] Delete is a soft delete filtered on `is_active: true`; update uses `findOne` → `Object.assign` → `save()` unless atomicity demanded otherwise.
- [ ] List uses `build_list_query` + `build_pagination`, awaits `apply_reference_filters` if and only if the config declares `reference_filters`, and returns `{ <resource>s, summary?, sort, pagination }`.
- [ ] No `startSession` / `withTransaction` in the controller.
- [ ] No inline `select` string and no inline populate spec. Both come from `get_response_shape(<feature>_response, "<action>")` in `src/helpers/<feature>/constants/<feature>_response.js`, imported through `@helpers/<feature>`.
- [ ] `select` is inclusion-only (no `-field`), lists every column the client needs to display *and* act on, and includes any real `ref` path that is also populated — but never a populate virtual, which is not a column.
- [ ] `match: { is_active: true }` narrows populated child *lists* only; no to-one parent carries a `match`, which would null the document rather than drop the row.
- [ ] Every populate entry has an explicit `select`; a repeated reference shape goes through the owning feature's response config rather than a fresh literal.
- [ ] Read actions apply the projection in the query; write actions populate the in-memory document and pass it through `project(document, select)` — no extra round trip, no projection on the document that `save()` writes back.
- [ ] Nothing sensitive relies on the response config to stay hidden; it is `select: false` on the schema.
- [ ] A new helper landed in its **feature** folder, not `common/`, unless a second feature already imports it.
- [ ] DB logic that a second controller could need went to a helper; pure logic went to a util.
- [ ] If `@utils` was used for the first time, both `package.json` `_moduleAliases` and `jsconfig.json` `paths` were updated.
- [ ] `moment` is used for date work rather than raw `Date` maths; lodash is used only where it beats the native equivalent; format strings and offsets come from constants.
- [ ] The JSDoc header carries `@route` (one line per mount), `@access` by role, a `@param` line per accepted field using real paths (`req.body.x`, `req.params.id`, `req.validated_query.x`) with optionals in brackets and limits copied from the constants, the validator named on the `req.body` line, `@returns {Promise<void>}` with the success status, and `@throws` for each failure this controller raises itself.
- [ ] Every non-obvious decision carries a `//` why-note **above the statement**, and no comment sits inside an object literal.
- [ ] Nothing outside `src/controllers/`, `src/helpers/` and `src/utils/` was created or edited. Any missing model, schema, message, enum, route or test was **reported**, not written.
- [ ] `node -e "require('module-alias/register'); require('./src/controllers/<feature>');"` loads without error.
