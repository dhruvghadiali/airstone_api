---
name: query-params
description: Configure and change the query string of a list ("get all") endpoint in the AIRSTONE project — which columns may be searched, filtered, sorted, and how pages are sized. Use whenever adding, changing, reviewing or refactoring anything under src/validators/query_params, or when asked to "make a column searchable", "allow sorting by X", "add a filter", "restrict search to these fields", "add a date range", "change the page size", or "why is this query param rejected". Enforces the whitelist contract: a column is unavailable until the resource's list config names it, and an out-of-contract request is refused before the controller runs.
---

# Query Params

A **list config** is the contract for one resource's table. It declares which columns may be
searched, filtered and sorted, and nothing else about that table is negotiable at runtime.

The contract is enforced, not documented. A caller who asks to sort by a column the config does not
name, or to filter on one it does not list, gets a 400 from the validation middleware — the
controller is never invoked, and no query reaches the database.

One config feeds two consumers, which is what makes that guarantee hold:

```
list_<feature>_config.js
   ├── build_list_query_schema(config)  → the Joi schema  → rejects out-of-contract requests
   └── build_list_query(query, config)  → the Mongo query → can only build what the schema allowed
```

A column can never be filterable in one and unknown in the other, because there is only one list.

---

## 0. Scope

**In scope**

- `src/validators/query_params/<feature>/config/` — the filter, search and sort contracts
- `src/validators/query_params/<feature>/list_<feature>_config.js` — the composed config
- `src/validators/query_params/<feature>/list_<feature>_query_validator.js` — the schema instance
- `src/validators/query_params/<feature>/index.js` and `src/validators/query_params/index.js` — barrels
- `src/validators/query_params/factory/` — the shared schema builders
- Pagination and sort defaults in `src/validators/constants/common.js`

**Out of scope — read, never edited by this skill**

- `src/helpers/list_query/` — the query builder. Changing it changes every resource at once; see §11.
- `src/controllers/` — see the `controller-structure` skill
- `src/models/`, `src/routes/`, `src/enums/`

If a resource needs a capability the shared builder does not have — a numeric range, a `$text`
search, an `$exists` filter — **stop and report it**. Do not hand-roll the condition inside one
config to work around a missing builder feature; §11 covers how to add it properly.

---

## 1. Where things live

| What | Path | Import |
|---|---|---|
| Filter contract | `src/validators/query_params/<feature>/config/filter_config.js` | via the composed config |
| Search contract | `src/validators/query_params/<feature>/config/search_config.js` | via the composed config |
| Sort contract | `src/validators/query_params/<feature>/config/sort_config.js` | via the composed config |
| Composed config | `src/validators/query_params/<feature>/list_<feature>_config.js` | `@validators/query_params/<feature>/list_<feature>_config` |
| Schema instance | `src/validators/query_params/<feature>/list_<feature>_query_validator.js` | via the feature barrel |
| Feature barrel | `src/validators/query_params/<feature>/index.js` | — |
| Root barrel | `src/validators/query_params/index.js` | `@validators/query_params` |
| Shared schema builders | `src/validators/query_params/factory/` | `@validators/query_params/factory` |
| Query builder | `src/helpers/list_query/utils/build_list_query.js` | `@helpers/list_query` |
| Pagination / sort defaults | `src/validators/constants/common.js` | `@validators/constants` |
| Messages | `src/validators/messages/` | `@validators/messages` |

Double quotes. Path aliases only. `Object.freeze` every config.

---

## 2. The whitelist rule

**Nothing is available until the config names it.** This is the whole point of the layer, and it
holds in three independent ways:

1. **Unknown keys are rejected.** The shared schema ends `.unknown(false)`, and
   `validate_request` runs Joi with `stripUnknown: false`. An unlisted column is an error, not a
   silently discarded key. `?password=x` → `"password" is not allowed`.
2. **Sort columns are checked against `sort_fields`.** `?sort=password:asc` →
   `"sort" column password must be one of [first_name, last_name, …]`.
3. **Rejection happens before the controller.** The route is
   `validate_query(schema)` then `async_handler(controller)`, in that order. Joi's error goes to
   `next(error)`, the error handler answers 400, and the controller function is never called — so
   no `find`, no `countDocuments`, no aggregation.

Verified behaviour of the employee schema today:

| Request | Outcome |
|---|---|
| `?sort=password:asc` | **400** — column not in `sort_fields` |
| `?password=x` | **400** — `"password" is not allowed` |
| `?limit=500` | **400** — `limit must be less than or equal to 100` |
| `?sort=a:asc,b:asc,c:asc,d:asc` | **400** — `sort accepts at most 3 columns` |
| `?sort=first_name:asc&sort_by=email` | **400** — `Use either "sort" or "sort_by", not both` |
| `?created_from=2026-08-19&created_to=2026-08-01` | **400** — `created_from must be on or before created_to` |
| `?email=ram` | accepted — `email` is in `text_filters` |
| `?sort=first_name:asc` | accepted — `first_name` is in `sort_fields` |

Never widen a contract to make a request pass. If the frontend is sending a column the config does
not list, either the column belongs in the config or the frontend is wrong — decide which, and say
which.

---

## 3. One concern per file

A contract is split across three files under `config/`, so widening what may be **filtered** is
never done in the same edit as widening what may be **sorted**. A composed file spreads them back
into the single object both consumers read.

```
src/validators/query_params/user/
  config/
    filter_config.js    base_filter, text_filters, exact_filters, date_filters
    search_config.js    search_fields
    sort_config.js      sort_fields, text_sort_fields
  list_users_config.js            <- spreads the three
  list_users_query_validator.js   <- builds the Joi schema from the composed config
  index.js
```

Each file exports one frozen object named `<feature>_<concern>_config`:

```js
/**
 * What the user table may be ordered by.
 *
 * `sort_fields` is the whitelist -- a column absent from it is a 400, not a
 * silently ignored parameter.
 *
 * `text_sort_fields` is the subset that also gets English collation, so
 * `alice` sorts before `Bob` rather than after it. Only the columns a person
 * actually typed in free text are listed, because collation costs the database
 * something and buys nothing anywhere else.
 */
const user_sort_config = Object.freeze({
  sort_fields: Object.freeze([
    "first_name",
    "last_name",
    "email",
    "created_at",
  ]),
  text_sort_fields: Object.freeze(["first_name", "last_name"]),
});

module.exports = { user_sort_config };
```

The composed file does nothing but assemble, and says what it is:

```js
const {
  user_sort_config,
} = require("@validators/query_params/user/config/sort_config");
const {
  user_filter_config,
} = require("@validators/query_params/user/config/filter_config");
const {
  user_search_config,
} = require("@validators/query_params/user/config/search_config");

/**
 * The user table's contract, assembled from the three files under
 * `config/` -- one per concern, so widening what may be filtered is never done
 * in the same edit as widening what may be sorted.
 *
 * Read by two consumers: `build_list_query_schema` turns it into the Joi schema
 * the route validates against, and `build_list_query` turns a validated query
 * into the Mongo filter. Both read this one object, so a column can never be
 * available in one and unknown in the other.
 *
 * Pagination is deliberately absent -- see §6.
 */
const list_users_config = Object.freeze({
  ...user_filter_config,
  ...user_search_config,
  ...user_sort_config,
});

module.exports = { list_users_config };
```

Rules:

- The composed file **only spreads**. No key is declared there, no key is overridden there. A key
  that appears in two concern files is a bug the spread will silently resolve.
- The composed export keeps the name `list_<feature>_config`, so the validator, the controller and
  both barrels never change when a contract is split or edited.
- Import order in the composed file follows the project convention: multi-line destructured
  requires sorted by line length, shortest first.
- Every key is optional and every one defaults to "nothing is allowed". A config with no
  `sort_fields` permits no sorting; one with no `text_filters` permits no column filters. Silence
  means closed, never open -- with **one exception**, in §6.

### A second view of the same collection

Sometimes two roles read the same rows through different windows: a super admin sees admins and
employees at `/super-admin/users`, an admin sees employees at `/admin/employees`. These are the same
documents with the same columns, and the **only** thing that differs is the scope.

Do not copy the three concern files. The second feature declares its own `filter_config.js` -- the
scope is what makes it a separate feature -- and its composed config reads search and sort straight
from the first:

```js
const {
  user_sort_config,
} = require("@validators/query_params/user/config/sort_config");
const {
  user_search_config,
} = require("@validators/query_params/user/config/search_config");
const {
  employee_filter_config,
} = require("@validators/query_params/employee/config/filter_config");

const list_employees_config = Object.freeze({
  ...employee_filter_config,
  ...user_search_config,
  ...user_sort_config,
});
```

Making a column sortable then changes both tables in one edit, which is the intent -- a caller
should not find that a column orders one role's table and 400s on another's. `employee_filter_config`
reuses the first feature's `text_filters` and its `is_active` schema by reading them off
`user_filter_config` for the same reason.

This is the one place a config file may import another feature's config file, and the importing
file's header must say which feature owns the columns and that a genuine divergence means declaring
its own file rather than editing the shared one.

**The scope column must not be exposed as an `exact_filter` on the narrower view.** An exact filter
replaces the base scope for its column (§4), so on the admin's employee table there is no
`user_type` filter at all: with one type in scope there is nothing to narrow to, and exposing the
column would hand the caller a way to ask for another. `?user_type=admin` is a 400 saying the
parameter is not allowed, which is the honest answer. The wider view may expose it, but only with a
Joi `valid(...)` list no broader than its own base scope.

## 4. The keys

| Key | Shape | Query string it accepts | Mongo it produces | Combines |
|---|---|---|---|---|
| `base_filter` | plain object | — (always applied) | merged in first | AND |
| `text_filters` | `string[]` | `?first_name=ram` | `{ first_name: /ram/i }` | AND |
| `search_fields` | `string[]` | `?search=ram` | `{ $or: [...] }` | OR, applied last |
| `exact_filters` | `{ column: joiSchema }` | `?user_type=employee` | `{ user_type: "employee" }` | AND, replaces base scope for that column |
| `derived_filters` | `{ param: { schema, to_filter } }` | `?in_stock=true` | whatever `to_filter` returns | AND |
| `reference_filters` | `{ param: { schema, to_filter } }` | `?agency=cg` | resolved against another collection, collected under `$and` | AND, async |
| `reference_search` | `{ name: to_branch }` | `?search=ram` | one `$or` branch per entry, each resolved against another collection | OR, async |
| `date_filters` | `string[]` of `<x>_at` | `?created_from=…&created_to=…` | `{ created_at: { $gte, $lte } }` | AND |
| `sort_fields` | `string[]` | `?sort=first_name:asc` | `{ first_name: 1, _id: -1 }` | — |
| `text_sort_fields` | `string[]` ⊆ `sort_fields` | — | adds English collation to the find options | — |

### base_filter

An always-on scope the caller cannot switch off — `{ user_type: { $in: manageable_user_types } }`
on the user table is what stops it being used to enumerate super admins, and
`{ user_type: user_type.EMPLOYEE }` on the employee table is what keeps an admin out of another
admin's account. Use it for a security or tenancy boundary, never for a default the caller should be
able to change; that is what a default in the schema is for.

Note the interaction: an `exact_filter` on the same column **replaces** the base scope rather than
intersecting with it. That is deliberate — asking for one user type should not still be ORed with
the others — but it means a `base_filter` column that is also an `exact_filter` is overridable. If
the scope must hold no matter what, do not also expose that column as a filter.

### text_filters

Per-column boxes in the table header. Each is an escaped, case-insensitive `contains`, and each
narrows the result independently (AND). List a column here when someone would type into a box under
that column's heading.

### search_fields — read this before omitting it

The single box above the table. One term is tried against every listed column (OR), so it *widens*
where a `text_filter` narrows.

**The fallback is the trap.** `build_search_filter` reads:

```js
const search_fields = config.search_fields || config.text_filters || [];
```

Omit `search_fields` and every `text_filter` silently becomes searchable. That is how the employee
directory ended up letting a two-character string sweep `email`, `username` and `emp_id`.

So: **declare `search_fields` explicitly on every config that has `text_filters`.** Write it out even
when it happens to equal `text_filters` — the point is that the next person sees a decision rather
than an omission. Keep out of it anything that is an identifier rather than a name (emails,
usernames, employee ids, GST numbers) unless the table exists to look those up, and anything long
enough to match everything (a description, an address blob).

That exception is real and two configs take it. The company table searches `email`, `gst_number` and
`pan_number` because an admin looking a firm up usually has a number off an invoice rather than a
name they can spell. The user table searches `email`, `phone_number`, `emp_id` and `username` for
the same reason. Both write the trade-off into the header rather than leaving it implied: one term
tried against an identifier column matches widely, so `?search=98` lists everybody whose phone
number contains those digits. Take the exception when the table exists to look people or firms up,
and say in the header that you took it and what it costs.

A column may be searchable without being filterable, and filterable without being searchable. The
two lists are independent.

### exact_filters

A map of column name to Joi schema; the keys double as the list of columns matched exactly. For
enums and booleans, where a substring match would be meaningless. The schema is what produces the
error message, so use `joi.string().valid(...Object.values(SOME_ENUM))` rather than a bare string.

### derived_filters

A query parameter that is not a column comparison — stock's "in stock" is `exit_date: null`. Each
carries its own schema and the conditions it maps onto, so the shared builder stays out of any one
resource's vocabulary:

```js
derived_filters: {
  in_stock: {
    schema: joi.boolean(),
    to_filter: (value) => (value ? { exit_date: null } : { exit_date: { $ne: null } }),
  },
},
```

`to_filter` is **synchronous** and returns a plain object merged into the filter. It must not query.

### reference_filters

A filter whose value has to be resolved against another collection first — filtering products by an
agency *name* when the product stores an agency *id*. Same shape as a derived filter, but
`to_filter` is **async**:

```js
reference_filters: {
  agency: {
    schema: joi.string().trim().min(1).max(company_validation_limits.COMPANY_NAME_MAX),
    to_filter: async (value) => ({ agency: { $in: await find_company_ids_by_name(value) } }),
  },
},
```

These are applied by `apply_reference_filters` in the controller, **not** inside `build_list_query`
— that is what keeps the builder synchronous for the resources that need no lookup. A config that
declares `reference_filters` therefore requires its controller to await that call; say so in the
config's header comment, because nothing else will remind whoever adds one.

**Several of them combine under `$and`, not by assignment.** A lookup usually answers with the ids
it found, so two reference filters on one resource both produce `{ _id: { $in: [...] } }`. Merging
those by assignment would keep the last and silently drop the rest — `?pincode=4110&contact_name=ram`
would apply only one of the two, with no error to notice. `apply_reference_filters` therefore
appends every condition to the filter's `$and` array, whatever key each one happens to use, and
extends an existing `$and` rather than replacing it.

Two consequences worth knowing. A single reference filter is still wrapped in `$and`, which is
equivalent and keeps one code path. And a `to_filter` is free to answer on `_id` — it does not have
to invent a unique key to avoid a collision.

The lookup belongs in `src/helpers/common/db/` (or the feature's own `db/` folder if
only this resource needs it) — never inline in the config.

### reference_search

The single search box reaching a column the resource does not store — a contact's name when the row
being listed is a company. Where a `reference_filter` narrows, this widens: each entry adds one
branch to the search `$or`, so one term typed once can match the resource's own columns or a joined
one.

The shape is simpler than a reference filter's, because there is no parameter of its own to
validate. The key is a name for the branch and the value is the async function that builds it:

```js
reference_search: {
  address: async (value) => ({
    _id: { $in: await find_company_ids_by_address_search(value) },
  }),
},
```

It reads `query.search`, so nothing is looked up when the box is empty. The branches are appended to
the `$or` that `build_search_filter` already produced, rather than replacing it, so the box spans the
resource's own columns and the joined ones together. A resource with an empty `search_fields` has no
`$or` yet and gets one made of these branches alone.

Group the columns rather than the collections' worth of them: one entry that asks a child collection
about three of its columns in a single query beats three entries asking it three times, because the
box does not know which column the caller meant.

Like `reference_filters`, these are applied by `apply_reference_filters` in the controller, so a
config that declares either one requires its controller to await that call.

### date_filters

Name the stored column; the parameters are derived by stripping `_at` and adding `_from`/`_to`, so
`created_at` is filtered through `?created_from=` and `?created_to=`.

The builder accepts a plain date, a date with a time, or a full ISO timestamp. A value with no
timezone is read as IST, and a plain date widens to the whole IST day — `created_to=2026-08-15`
includes a row written at 6pm on the 15th, which is what "up to the 15th" means to the person who
picked it. A reversed range is a 400, not an empty page.

### sort_fields and text_sort_fields

`sort_fields` is the whitelist. `text_sort_fields` is the subset that reads as human text and needs
English collation, so `alice` sorts before `Bob` instead of after it. Collation costs the database
something, so it is only requested when a listed text column is actually being sorted on — put dates,
enums, booleans and numbers in `sort_fields` only.

A column must be in `sort_fields` before it can be in `text_sort_fields`.

---

## 5. Sorting

Two forms, and a caller may use one or the other, never both — `.oxor("sort", "sort_by")`:

- **Multi-column**: `?sort=category:asc,name:asc`. Field and direction travel in one token, which is
  what keeps them in step; two parallel lists would not survive three columns and two directions.
- **Single column**: `?sort_by=name&sort_order=asc`. Kept so existing callers keep working.

Behaviour that is fixed in `@helpers/list_query` sorting utils and not per-resource:

- Direction is optional and falls back to `sort_defaults.ORDER` — `?sort=first_name` is valid.
- Duplicate columns are dropped, first occurrence wins, so `?sort=email:asc,email:desc` cannot
  produce a contradiction.
- At most `sort_defaults.MAX_FIELDS` (3) columns.
- `_id: -1` is always appended as the final key. A sort on a repeating value — a role, a shared
  surname — is not deterministic on its own, and rows jump between pages without a tiebreaker.
- With no `sort` at all, the default is `sort_defaults.FIELD` (`created_at`) descending.

Changing any of those changes every table at once: they live in `@validators/constants`, not in a
config. Do it deliberately or not at all.

---

## 6. Pagination

The one thing a config does **not** declare — pagination is uniform across every table and lives in
`pagination_defaults` in `src/validators/constants/common.js`:

```js
const pagination_defaults = Object.freeze({
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
});
```

`page` and `limit` are always accepted, on every list endpoint, with no config key to enable them.
`MAX_LIMIT` is the ceiling that stops a caller asking for the whole collection in one request; it is
enforced by the schema (a 400) **and** clamped again in `get_pagination` for the internal callers
that build a query object by hand.

A resource that genuinely needs a different ceiling gets a new constant and a documented reason —
do not raise `MAX_LIMIT` for everyone to satisfy one export screen. If a table needs to hand back
thousands of rows, that is an export endpoint, not a page size.

The response block is `build_pagination(page, limit, total)`, where `total` counts rows matching the
filter, not rows on the page.

---

## 7. Registration

Six files, every time. A config that is not registered is a schema that never runs, which reads as
"validation silently stopped happening".

1. `config/filter_config.js`, `config/search_config.js`, `config/sort_config.js` — the contracts.
   Create only the ones the resource needs; a table with nothing to search has no `search_config.js`
   rather than an empty one.
2. `list_<feature>_config.js` — spreads them.
3. `list_<feature>_query_validator.js` — one line, builds the schema:

```js
const {
  build_list_query_schema,
} = require("@validators/query_params/factory");
const {
  list_<feature>_config,
} = require("@validators/query_params/<feature>/list_<feature>_config");

const list_<feature>_query_schema = build_list_query_schema(
  list_<feature>_config,
);

module.exports = list_<feature>_query_schema;
```

4. The feature `index.js`, then the root `index.js` — both the require block and the exported
   object, sorted by line length shortest first.

The route then imports the schema from the root barrel and mounts it **before** the controller:

```js
router.get("/", validate_query(list_<feature>_query_schema), async_handler(list_<feature>));
```

That ordering is the enforcement. A route that mounts the controller without `validate_query` has no
contract at all, whatever its config says.

---

## 8. What the controller does with it

Read-only context — the controller is the `controller-structure` skill's territory. It names no
column:

```js
const { filter, sort, applied_sort, options, page, limit, skip } =
  build_list_query(req.validated_query, list_employees_config);
```

Search and filter arrive merged into one `filter`. `options` carries collation when a text column is
being sorted. The controller reads `req.validated_query`, never `req.query`.

Only a config with `reference_filters` or `reference_search` makes its controller await
`apply_reference_filters`. That call returns the filter to query with: the narrowing conditions
under `$and`, the widening branches appended to `$or`.

---

## 9. Changing a contract

**Making a column available** — add it to the right key, and only that key. Adding a column to
`sort_fields` does not make it filterable; adding it to `text_filters` does not make it searchable
unless `search_fields` is absent, which it should not be.

**Removing one** — check the frontend is not sending it before deleting, because it becomes a 400
rather than a silently ignored parameter. That is the correct behaviour and it is also a breaking
change.

**Restricting search** is the common request: add or narrow `search_fields`, leave `text_filters`
alone. The columns stay filterable through their own boxes; they just leave the global box.

Every change is one line in one file. If a change needs an edit in `list_query/` as well, it is a
new capability, not a contract change — see §11.

---

## 10. Comments and freezing

### Comments go above the declaration, never inside an object literal

A frozen config object is pure data. Every word of explanation belongs in the `/** */` block above
the `const`, organised as prose keyed by the field name, so a reader looking for the note on one
field still finds it and the data stays scannable.

The rule is not specific to a config: it is the same one `model-structure` states for a schema and
`controller-structure` states for a response shape. No comment goes between the braces of any
object literal — a filter object, a Joi schema, a `derived_filters` entry, a populate spec. Inside
a **function body** a `//` note above the statement it explains is right and expected; that is
code, not data.

### moment and lodash

Reach for them **whenever the logic needs them** rather than hand-rolling the equivalent — but a
config is the wrong place for either. A `to_filter` is a pure mapping from a validated value onto a
Mongo condition, and a `date_filters` entry names a column and nothing else; the date parsing they
imply already lives in `parse_date_boundary`, which is where `moment` is imported and where the IST
boundary rules are decided. A config that has grown a `moment` or `lodash` import is a config doing
work that belongs in `src/helpers/list_query/`.

```js
/**
 * What the user table may be narrowed by.
 *
 * `base_filter` is always applied and cannot be switched off by the caller:
 * super admins are never listed, so the endpoint cannot be used to enumerate
 * the accounts that administer the system.
 *
 * `text_filters` are the per column boxes in the table header. Each narrows
 * independently, so they combine with AND.
 */
const user_filter_config = Object.freeze({
  base_filter: Object.freeze({ user_type: { $in: manageable_user_types } }),
  text_filters: Object.freeze(["first_name", "last_name", "email"]),
});
```

Not this:

```js
const user_filter_config = Object.freeze({
  // Super admins are never listed here...     <- no comments inside the object
  base_filter: Object.freeze({ ... }),
});
```

What the header must carry:

- what the file is, in one line;
- for each key, why it holds the values it does — not what the key means, which §4 already says;
- any invariant a reader could otherwise undo. The user filter config, for example, records that
  its `base_filter` scope is overridden by the `user_type` exact filter beside it, so only that
  filter's Joi `valid(...)` list keeps super admins out of reach. The employee filter config records
  the opposite decision -- that it exposes no `user_type` filter at all -- because an absent
  parameter is invisible, and a reader has to be told it is missing on purpose.

Never restate a key name. `// the columns that can be sorted` above `sort_fields` earns nothing.

### Freeze at every level

`Object.freeze` on the outer object only stops keys being added or replaced — the arrays and objects
inside stay mutable. Freeze those too:

```js
sort_fields: Object.freeze(["first_name", "last_name"]),
base_filter: Object.freeze({ user_type: { $in: manageable_user_types } }),
```

A config is read on every request and shared across them. An accidental `config.sort_fields.push(...)`
anywhere is a mutation that outlives the request that caused it.

---

## 11. Adding a capability to the shared builder

When no config key can express what a resource needs, the builder grows a key — once, for everyone.
Never work around it inside a single config.

Known gap: **numeric ranges**. Eight columns across product and purchase are sortable but cannot be
filtered by range — `purchase_price`, `sale_price`, `bill_amount`, `gst_amount`,
`actual_paid_amount`, `actual_received_amount`, `quantity_purchased`, `quantity_sold`. The intended
shape mirrors `date_filters` exactly:

```js
range_filters: ["purchase_price", "sale_price"],
// ?purchase_price_min=500&purchase_price_max=2000
// → { purchase_price: { $gte: 500, $lte: 2000 } }
```

Adding one takes four coordinated edits, and all four are required or the two halves drift:

1. `src/validators/query_params/factory/` — a new builder file beside the others, generating the
   parameter schemas from the new key, plus a line spreading it into `build_list_query_schema` in
   that folder's `index.js`. Cross-field checks (`min` must not exceed `max`, as the date ranges
   already do) go on the assembled schema, as `build_date_range_validator` does.
2. `@helpers/list_query/utils/build_filter.js` — the loop that turns validated values into conditions.
3. The shared builder's config-shape comment in `@helpers/list_query/utils/build_list_query.js`.
4. This skill's §4 table.

Report the gap and get agreement before doing it. A builder change touches every list endpoint at
once, and there is currently no test suite to catch a regression.

---

## 12. Definition of done

- [ ] Each concern lives in its own file under `<feature>/config/` — `filter_config.js`, `search_config.js`, `sort_config.js` — exporting `<feature>_<concern>_config`.
- [ ] `list_<feature>_config.js` only spreads those files. No key is declared or overridden there, and no key appears in two concern files.
- [ ] The composed export is still named `list_<feature>_config`, so the validator, controller and barrels are untouched by the split.
- [ ] Every object and every array is `Object.freeze`d, not just the outer one.
- [ ] No comment sits inside an `Object.freeze` block. All reasoning is in the `/** */` header above the `const`, keyed by field name.
- [ ] `search_fields` is declared explicitly, not left to fall back to `text_filters`.
- [ ] Identifier columns (email, username, emp_id, GST, phone) are out of `search_fields` unless the table exists to look them up.
- [ ] Every `text_sort_fields` entry also appears in `sort_fields`; dates, enums, booleans and numbers are not in `text_sort_fields`.
- [ ] `exact_filters` entries carry a real Joi schema (`valid(...)` for enums), not a bare `joi.string()`.
- [ ] `derived_filters.to_filter` is synchronous and queries nothing; anything that queries is a `reference_filter`.
- [ ] A config with `reference_filters` or `reference_search` says so in its header, because its controller must await `apply_reference_filters`.
- [ ] A `reference_search` entry is a bare async function of the search term, not a `{ schema, to_filter }` pair; it has no parameter of its own to validate.
- [ ] Lookup functions live in a helper, never inline in the config.
- [ ] `base_filter` is a security or tenancy boundary, and no column it scopes is also exposed as an `exact_filter` unless overriding it is intended.
- [ ] No pagination keys in the config — `page` and `limit` come from `pagination_defaults`.
- [ ] The validator file exists, wraps at 80 columns, and is registered in the feature `index.js` **and** the root `index.js`, both blocks, length-sorted.
- [ ] The route mounts `validate_query(<schema>)` before `async_handler(<controller>)`.
- [ ] The header explains what the file is and why each key holds the values it does; no comment restates a key name, and no comment sits inside an object literal.
- [ ] The config imports neither `moment` nor `lodash`; date handling and value coercion belong to the shared builder, not to one resource's contract.
- [ ] Nothing under `src/helpers/list_query/` was edited. A missing capability was **reported** (§11), not worked around in a config.
- [ ] Rejection verified for at least one out-of-contract case:
      `node -r module-alias/register -e 'const {s}=require("@validators/query_params"); console.log(s.validate({bogus:1}).error?.message)'`
