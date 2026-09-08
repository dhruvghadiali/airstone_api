---
name: route-params-structure
description: Create, modify, review, or refactor Joi route-parameter validators and routes in the AIRSTONE project. Use whenever adding a new router with path parameters, adding or changing files under src/validators/route_params, wiring validate_params, or validating resource ids. Every feature must follow the same schema, naming, barrel, middleware-order, constants, and validation-message conventions.
---

# Route Params Structure

Route-parameter validation is the boundary for values captured from an Express path such as
`/:id`. It must reject malformed values before the controller runs, preserve the normalized
`req.params` contract, and use the same structure for every resource.

Route-parameter Joi validation checks shape and format only. It must not query MongoDB, confirm that
the resource exists, check ownership, or check whether the resource is active. The controller owns
those checks through the project's database helpers.

## 1. Where things live

| What | Path | Import |
|---|---|---|
| Resource parameter schema | `src/validators/route_params/<feature>_id_params_validator.js` | `@validators/route_params` |
| Route-parameter barrel | `src/validators/route_params/index.js` | `@validators/route_params` |
| Validation limits | `src/validators/constants/common.js` | `@validators/constants` |
| Resource messages | `src/validators/messages/<feature>_message.js` | `@validators/messages` |
| Shared middleware | `src/middlewares/validate_request.js` | `@middlewares/validate_request` |
| Resource controller | `src/controllers/<feature>/` | `@controllers/<feature>` |
| Resource routes | `src/routes/<role>/<feature>/` | — |

Use CommonJS `require(...)` and project aliases. Match the existing file's quote and indentation
style when editing; new route-param files should use the repository's established Joi schema shape.

## 2. Inspect before editing

Before adding or changing a route parameter:

1. Read the route and controller to identify the exact path placeholder and the value the controller
   reads from `req.params`.
2. Read a neighboring route-param validator and `src/validators/route_params/index.js`.
3. Read the resource message file and reuse its `INVALID_ID` message.
4. Read `src/validators/constants/index.js` and use the shared ObjectId length constant.
5. Check whether the route already validates parameters before the controller; do not add a second
   validator or alter unrelated middleware.

The route placeholder and Joi object key must match exactly. For `/:id`, the schema key is `id`.
If a route uses `/:company_id`, either validate `company_id` explicitly or change the route and all
controller consumers together; never validate `id` while Express supplies `company_id`.

## 3. Canonical resource-id schema

For a resource whose route uses `/:id`, create one file named
`<feature>_id_params_validator.js` and export `<feature>_id_params_schema`:

```js
const joi = require("joi");

const { validation_limits } = require("@validators/constants");
const { item_messages } = require("@validators/messages");

const item_id_params_schema = joi
  .object({
    id: joi
      .string()
      .hex()
      .length(validation_limits.OBJECT_ID_LENGTH)
      .required()
      .messages({
        "any.required": item_messages.INVALID_ID,
        "string.base": item_messages.INVALID_ID,
        "string.empty": item_messages.INVALID_ID,
        "string.hex": item_messages.INVALID_ID,
        "string.length": item_messages.INVALID_ID,
      }),
  })
  .unknown(false);

module.exports = item_id_params_schema;
```

Rules:

- Keep the outer object strict with `.unknown(false)` so extra path parameters are not silently
  accepted.
- Use `.string().hex().length(validation_limits.OBJECT_ID_LENGTH).required()` for Mongo ObjectIds.
- Use the feature's existing `<feature>_messages.INVALID_ID`; do not inline user-facing text.
- Map all relevant Joi errors to the same invalid-identifier message so malformed ids have one
  stable API response.
- Do not use `.external()`, database models, Mongoose queries, or controller helpers in the schema.
- Do not use `moment` or `lodash` for an ObjectId path parameter. They add no validation value here.
- If a feature has a non-ObjectId path parameter, first inspect an existing equivalent contract;
  define its format and constants/messages explicitly rather than forcing an ObjectId rule.

## 4. Naming and barrels

Use these names consistently:

| Resource | File | Schema export |
|---|---|---|
| `company` | `company_id_params_validator.js` | `company_id_params_schema` |
| `company_address` | `company_address_id_params_validator.js` | `company_address_id_params_schema` |
| `company_contact` | `company_contact_id_params_validator.js` | `company_contact_id_params_schema` |
| `employee` | `employee_id_params_validator.js` | `employee_id_params_schema` |
| `product` | `product_id_params_validator.js` | `product_id_params_schema` |
| `purchase` | `purchase_id_params_validator.js` | `purchase_id_params_schema` |
| `sale` | `sale_id_params_validator.js` | `sale_id_params_schema` |
| `stock` | `stock_id_params_validator.js` | `stock_id_params_schema` |

When adding a validator:

1. Create the resource validator file with the canonical structure.
2. Require it in `src/validators/route_params/index.js`.
3. Add its schema to that barrel's `module.exports` block.
4. Import the schema from `@validators/route_params` in routes, not from an individual validator
   file.

A validator that is missing from the barrel is incomplete even if its file works in isolation.
Preserve the barrel's existing ordering convention when inserting the new require and export.

## 5. Route wiring

Every route containing a path parameter validates it before the async controller:

```js
const express = require("express");

const { get_item } = require("@controllers/item");
const { validate_params } = require("@middlewares/validate_request");
const { item_id_params_schema } = require("@validators/route_params");

const async_handler = require("@middlewares/async_handler");

const router = express.Router();

router.get(
  "/:id",
  validate_params(item_id_params_schema),
  async_handler(get_item),
);

module.exports = router;
```

For routes that also have a request body, validate path parameters before the body and before the
async controller:

```js
router.patch(
  "/:id/reassign",
  validate_params(item_id_params_schema),
  validate_body(reassign_item_schema),
  async_handler(reassign_item),
);
```

Do not put `validate_params` after `async_handler`. A malformed parameter must never reach the
controller or a database query. Do not add `validate_params` to routes with no path parameters.

## 6. Model and controller boundary

The schema only proves that the path value has the right syntactic shape. The controller must still:

- convert or use the validated id according to the existing controller pattern;
- check that the referenced document exists;
- check `is_active` when the feature uses soft deletion;
- enforce role, tenant, parent-resource, or ownership constraints;
- return the feature's existing not-found or invalid-resource response.

Do not make a route-param validator query the database to perform any of these checks. Doing so
couples middleware to persistence and makes the same schema unsafe to reuse across roles.

## 7. Comments

**The header block itself follows the project-wide JSDoc pattern** — verb-first summary, a
paragraph only where there is a reason to record, then standard tags. `project-structure` §4 is
the full rule; this section covers only where a comment may sit in a params validator.


Every comment sits **above the declaration it explains**, and none goes inside an object literal --
not inside a Joi schema object, a route handler's option object, an `Object.freeze`, a filter or an
update's `$set`. Those objects are data, and prose between their keys makes a reader step over it
to reach the next field.

Anything a key needs said about it belongs in the `/** */` block above the `const`, as prose keyed
by that key's name. Inside a **function body** a `//` note above the statement it explains is right
and expected -- that is code, not data.

This is the same rule `model-structure` states for a schema, `controller-structure` for a response
shape and `query-params` for a list config; it holds in every file of the project.

A params schema is small, so the header carries everything: what the id addresses, and -- where a
schema takes two ids, as a subdocument route does -- why each carries its own message.

```js
/**
 * A payment is a subdocument, so it is addressed by two ids: the credit that
 * holds it and its own. Each carries its own message, because an invalid
 * payment id and an invalid supplier credit id send a caller looking in two
 * different places.
 */
const supplier_credit_payment_id_params_schema = joi.object({ ... });
```

---

## 8. moment and lodash

Both are project dependencies (`moment ^2.30.1`, `lodash ^4.18.1`). Reach for them **whenever the
logic needs them** rather than hand-rolling the equivalent -- `moment` for every date computation
beyond passing a `Date` through, `lodash` for defensive access (`_.get`), key-set comparison
(`_.difference`), and coercion (`_.toNumber` then `_.isInteger`). Offsets and format strings come
from `@validators/constants`, never inlined.

Not where the language already reads better: `map`/`filter`/`find` on a plain array, optional
chaining rather than `_.get` on a value Joi already guaranteed, `Object.assign` rather than
`_.merge`.

A params schema should need neither: it validates ids, and an id is a hex string of fixed length.

---

## 9. Verification checklist

After editing, verify all of the following:

1. The validator can be required with `node -r module-alias/register`.
2. The root route-params barrel exports the new schema.
3. A valid 24-character hexadecimal id passes.
4. Missing, empty, non-hex, short, long, and non-string ids fail with the feature's `INVALID_ID`
   message.
5. Extra parameter keys fail because the schema is `.unknown(false)`.
6. The route placeholder matches the schema key exactly.
7. `validate_params` appears before any async controller and before database work.
8. No comment sits inside the schema object; the header above the `const` says what the id
   addresses and, for a two-id schema, why each carries its own message.
8. No route-param file contains a database lookup, inline message, hardcoded ObjectId length, or
   unused dependency.

Keep route-parameter changes focused. Do not refactor controllers, models, or unrelated route
groups while adding one validator.