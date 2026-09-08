---
name: request-body-structure
description: Create, modify, review, or refactor Joi request-body validators for CRUD operations in the AIRSTONE project. Use whenever adding or changing files under src/validators/request_body, adding create/update/reassign validation, or changing the fields accepted by a route. Validators must follow the corresponding Mongoose model and reuse src/validators/constants and src/validators/messages; use moment or lodash only when an existing validation rule genuinely needs them.
---

# Request Body Structure

A request-body validator is the API contract at the boundary of a CRUD route. It must accept the
same valid values the corresponding Mongoose model can store, reject unsupported input before the
controller runs, and give callers the project's shared validation messages.

The model remains the persistence authority. Joi duplicates the model's field shape at the HTTP
boundary because invalid input should be rejected before a database write. Do not put database
lookups, uniqueness checks, or referenced-document existence checks in Joi; controllers perform
those checks with the project's database helpers.

## 1. Scope and file locations

| What | Path | Import |
|---|---|---|
| Resource body validators | `src/validators/request_body/<feature>/` | `@validators/request_body/<feature>` |
| Shared field definitions | `src/validators/request_body/<feature>/<feature>_fields.js` | feature path alias |
| Create schema | `create_<feature>_validator.js` | feature barrel |
| Update schema | `update_<feature>_validator.js` | feature barrel |
| Reassign/action schema | `<action>_<feature>_validator.js` | feature and root barrels |
| Validation limits and patterns | `src/validators/constants/<feature>_constants.js` | `@validators/constants` |
| Validation messages | `src/validators/messages/<feature>_message.js` | `@validators/messages` |
| Route middleware | `src/middlewares/validate_request.js` | `@middlewares/validate_request` |
| Mongoose shape | `src/models/<feature>/<feature>_model.js` | `@models/<feature>` |

Use CommonJS `require(...)` and project aliases. Match the existing file's quote and indentation
style when editing; new files should follow the repository's established style.

## 2. Inspect before editing

Before changing a validator, read the related:

1. Mongoose model, including nested fields, defaults, enums, normalization, bounds, and custom
   validation.
2. Existing `*_fields.js`, create/update validators, and feature/root barrels.
3. Entity constants, messages, enums, and any helper used by the model or neighboring validator.
4. Route and controller to confirm whether the schema is used for create, update, or a special
   action.

For every request field, identify its name, type, requiredness, nullability, empty-string policy,
normalization, min/max, enum, format, and whether it is create-only or updateable. Do not guess
missing business rules. Ask one consolidated question if the model and request requirements do not
resolve them.

## 3. CRUD validator layout

Put fields shared by create and update in `<feature>_fields.js` and export a plain object named
`base_<feature>_fields`:

```js
const joi = require("joi");

const { item_validation_limits } = require("@validators/constants");
const { item_validation_messages } = require("@validators/messages");

const base_item_fields = {
  name: joi
    .string()
    .trim()
    .min(item_validation_limits.NAME_MIN)
    .max(item_validation_limits.NAME_MAX)
    .required()
    .messages({
      "any.required": item_validation_messages.NAME_REQUIRED,
      "string.base": item_validation_messages.NAME_BASE,
      "string.empty": item_validation_messages.NAME_EMPTY,
      "string.min": item_validation_messages.NAME_MIN,
      "string.max": item_validation_messages.NAME_MAX,
    }),
};

module.exports = { base_item_fields };
```

Create schemas use the base fields, reject unknown keys, and are exported as `<operation>_<feature>_schema`:

```js
const joi = require("joi");

const { item_validation_messages } = require("@validators/messages");
const { base_item_fields } = require("@validators/request_body/item/item_fields");

const create_item_schema = joi
  .object(base_item_fields)
  .unknown(false)
  .messages({
    "object.unknown": item_validation_messages.UNKNOWN_FIELD,
  });

module.exports = create_item_schema;
```

Update schemas make shared fields optional, require at least one field, reject unknown keys, and
disable defaults so a patch does not silently populate omitted values:

```js
const update_fields = Object.fromEntries(
  Object.entries(base_item_fields).map(([key, schema]) => [key, schema.optional()]),
);

const update_item_schema = joi
  .object(update_fields)
  .min(1)
  .unknown(false)
  .prefs({ noDefaults: true })
  .messages({
    "object.min": item_validation_messages.UPDATE_MIN,
    "object.unknown": item_validation_messages.UNKNOWN_FIELD,
  });
```

Do not make immutable, server-owned, or controller-derived fields updateable merely because they
exist on the model. Define action-specific schemas for operations such as reassigning a contact.

## 4. Joi rules and model parity

- Use `joi.string()`, `joi.number()`, `joi.boolean()`, `joi.date()`, `joi.object()`, and arrays to
  match the model's shape.
- Mirror model `required`, `min`, `max`, `minlength`, `maxlength`, enum, trim, lowercase,
  uppercase, and `default: null` semantics.
- For Mongo ObjectIds, use a trimmed hexadecimal string with the shared object-id length constant,
  then let the controller verify that the referenced document exists and is active.
- Use `valid(...Object.values(enum_object))` for fixed values; never duplicate enum literals in a
  validator.
- Use `.allow(null)` only when the model and API semantics permit clearing the value. Decide
  explicitly whether empty strings are allowed; `.trim()` alone does not make an empty string valid.
- Add `.unknown(false)` to every request object. `validate_request` deliberately uses
  `stripUnknown: false`, so unsupported fields produce a 400 instead of disappearing silently.
- Add `.messages(...)` for relevant Joi error codes, including `any.required`, `string.base`,
  `string.empty`, `string.min`, `string.max`, `number.base`, `number.min`, `number.max`,
  `any.only`, `object.unknown`, and `object.min` when applicable.
- Keep cross-field rules in Joi when they describe the request shape, using `.custom()` or
  `.when()`, and map failures to a named message constant. Still repeat essential invariants in
  the controller/model boundary if a non-HTTP caller can bypass Joi.
- Do not use Joi `.external()` for database queries; validation middleware is synchronous and the
  controller owns reference and uniqueness checks.

When a model has a custom precision, range, or domain rule, reuse the existing helper if one exists
and apply the same rule in Joi. The validator must not accept a value that the model will reject.

## 5. Constants, messages, enums, and barrels

Do not inline validation limits, regular expressions, enum values, or user-facing messages.

- Put numeric/string limits and reusable patterns in `src/validators/constants/<feature>_constants.js`.
- Put validation text in `src/validators/messages/<feature>_message.js` under the entity's frozen
  validation-message object. Reuse shared error messages when their meaning matches.
- Put fixed value sets in `src/enums` and import them through `@enums`.
- When adding a constants or message file/value, update that folder's `index.js` require block and
  `module.exports` block, preserving the repository's ordering convention.
- Export every new validator from its feature `index.js` and from
  `src/validators/request_body/index.js` when it is part of the public validator surface.
- Import feature validators through the feature barrel where possible; the barrel is the contract
  for route consumers.

## 6. Comments

**The header block itself follows the project-wide JSDoc pattern** — verb-first summary, a
paragraph only where there is a reason to record, then standard tags. `project-structure` §4 is
the full rule; this section covers only where a comment may sit in a validator.


Every comment sits **above the declaration it explains**, and none goes inside an object literal --
not inside a Joi schema object, a route handler's option object, an `Object.freeze`, a filter or an
update's `$set`. Those objects are data, and prose between their keys makes a reader step over it
to reach the next field.

Anything a key needs said about it belongs in the `/** */` block above the `const`, as prose keyed
by that key's name. Inside a **function body** a `//` note above the statement it explains is right
and expected -- that is code, not data.

This is the same rule `model-structure` states for a schema, `controller-structure` for a response
shape and `query-params` for a list config; it holds in every file of the project.

A validator file is dense with object literals -- every Joi field is one -- so this is the skill
where the rule bites hardest. The reasoning for a field goes in the `/** */` block above the
exported field map or the schema, keyed by field name:

```js
/**
 * What a payment may be changed to after it exists.
 *
 * `received_payment_date` appears only here, never on create: the supplier has
 * not confirmed a payment that was only just entered.
 *
 * `payment_date` is absent: it is when the money left the account, which is a
 * fact rather than an opinion.
 */
const update_credit_payment_fields = { ... };
```

---

## 7. `moment` and `lodash`

Use these dependencies only when they remove real validation complexity and the rule cannot be
expressed clearly with Joi alone:

- Use `moment` only for an existing project date-format or date-range requirement. Parse strictly,
  preserve the API's intended timezone semantics, and add a named message for invalid dates. Do
  not accept a date in Joi and silently reinterpret it in a different timezone.
- Prefer Joi's `date().iso()`, `.min()`, `.max()`, `.custom()`, or `.when()` for simple date rules.
- Use `lodash` only for an established object/array transformation or comparison that is awkward
  and error-prone to write inline. Do not use it to hide field definitions or silently strip input.
- Never add a package just for a one-line operation; both packages are already project dependencies.

## 8. Route wiring and verification

No comment sits inside a Joi object; every field's reasoning is in the `/** */` header above the
exported field map, keyed by field name.

The route must validate before the async controller:

```js
router.post(
  "/items",
  validate_body(create_item_schema),
  async_handler(create_item),
);
```

For an update route, use the update schema. Confirm the controller reads the normalized `req.body`
that `validate_request` writes back after successful conversion.

After editing, verify:

1. The new or changed validator can be required with `node -r module-alias/register`.
2. A valid create/update body passes, an empty update fails, and an unknown field fails.
3. Invalid types, bounds, enum values, ObjectIds, nullability, and cross-field rules return the
   configured messages.
4. The model and validator agree on normalization and accepted values.
5. The relevant route imports the barrel export and places `validate_body` before the controller.

Do not fix unrelated model, controller, or route defects while changing request-body validation.