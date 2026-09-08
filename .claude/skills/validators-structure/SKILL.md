---
name: validators-structure
description: The shape of src/validators in the AIRSTONE project — its five layers, how they are named, imported and commented. Use whenever adding or changing anything under src/validators, or when asked "where does this limit go", "which file holds this message", "how do I add a validator". Routes to request-body-structure, route-params-structure and query-params for the schema layers; owns the tree itself, plus constants/ and messages/.
---

# Validators Structure

**Validation runs before a controller does. A controller never re-checks a shape, and never sees a
value it was not promised.**

`validate_request` runs the schema and puts the validated value back on the request, so by the time
a controller runs, the body has been trimmed, lower-cased, defaulted and type-checked. That is why
a controller carries no `if (!req.body.email)`.

---

## 1. The five layers

```
src/validators/
  index.js          the registry
  constants/        limits and patterns every layer agrees on
  messages/         the wording a caller is shown
  request_body/     what a POST or PATCH body may contain
  route_params/     what a `:id` in the path may look like
  query_params/     what a list endpoint's query string may ask for
```

| Layer | Full rule |
|---|---|
| `request_body/` | `request-body-structure` |
| `route_params/` | `route-params-structure` |
| `query_params/` | `query-params` |
| `constants/`, `messages/`, the tree itself | this skill |

---

## 2. `constants/`

`<entity>_constants.js`, plus `common.js` for what crosses entities.

- **A value goes here when a second layer needs it.** `USERNAME_MAX` is in the model, in the Joi
  field, and inside the message a caller is shown — three readers, one value. A value only one
  helper reads belongs in that helper's own `constants/` folder instead.
- `Object.freeze` every map. Keys `UPPER_SNAKE_CASE`.
- Limits are `<entity>_validation_limits`, regexes are `<entity>_validation_patterns`. Pattern keys
  are named for the meaning — `EMAIL`, `PHONE_NUMBER` — with no `_REGEX` suffix.
- **Never write a number twice.** If the model says 50 and the validator says 50, one of them is
  about to be wrong.

## 3. `messages/`

`<entity>_message.js`, exporting two maps:

- `<entity>_messages` — what an endpoint says when it succeeds or fails.
- `<entity>_validation_messages` — what one field says when it is wrong.

Rules:

- **No string literal anywhere else.** Not in a controller, not in a model, not in a schema.
- **Build a message that lists values, never type it.** A message naming the accepted roles or sort
  orders is the copy that goes stale unnoticed, because nothing fails when it does — the request is
  still refused, just with wording that names a value which no longer exists:

  ```js
  const user_types = Object.values(user_type).join(", ");
  USER_TYPE_INVALID: `User type must be one of: ${user_types}`,
  ```

- **Build a message that quotes a limit, never type it.** `` `must be at least ${limits.MIN}` ``,
  read from the constants.
- A message that needs per-resource data is a **function**, not a constant —
  `sort_field_message(sort_fields)` names the columns a resource allows, which are only known once
  a config is in hand. Export it from the barrel like anything else.

---

## 4. Barrels and imports

Every folder has an `index.js`, and it is what other folders import.

- **Import the folder**: `@validators/messages`, `@validators/constants`,
  `@validators/request_body`. Never a file inside one.
- **Inside a folder, import siblings directly** — `user_constants.js` reads `app_time` from
  `common.js` by path, and the barrels require their own files by path. Going through your own
  barrel makes the folder import itself.
- **If something is not on the barrel, add it to the barrel** rather than reaching past it. That is
  what went wrong with `sort_field_message`: it was exported by its file but not by
  `messages/index.js`, so two callers reached in by path and the barrel quietly stopped being the
  whole surface.
- `request_body/index.js` is flat, not grouped by feature: a route file wants one schema and should
  not have to know which feature folder declared it.
- `src/validators/index.js` is a registry. Callers name the layer they want, so a route file pulls
  in the schemas and not the whole validation tree.

---

## 5. Naming

- `<entity>_constants.js`, `<entity>_message.js`.
- `<action>_<entity>_validator.js` exporting `<action>_<entity>_schema` —
  `admin_signin_validator.js` exports `admin_signin_schema`.
- `<entity>_fields.js` for the shared field definitions a feature's validators are built from.
- `<entity>_id_params_validator.js` for route params.

---

## 6. Shared fields

A feature's validators are built from one `<entity>_fields.js`. A signup names six fields and a
signin names two, but a username is a username either way — defining it once is what stops the two
endpoints disagreeing, and makes "allow longer passwords" one edit rather than four.

Every field there is `required()`. A validator needing a subset marks them optional itself rather
than the fields file carrying an optional variant of each.

---

## 7. `unknown(false)` on every body schema

A field the schema does not name is **refused**, not ignored. A caller sending `user_type` or
`role` is told plainly that it is not accepted, rather than assuming it took effect. That is what
makes "the server decides the role" enforceable rather than a convention.

---

## 8. Comments

The project-wide JSDoc pattern — `project-structure` §4 — with what each layer leans on:

- **Constants and messages are pure data.** No comment inside an `Object.freeze` or a map. Every
  word about a key belongs in the block above the `const`, keyed by that key's name.
  `comment-placement` holds here exactly as it does in a schema.
- **A field definition says why, not what.** `.trim()` needs no note; *not* trimming does — "a
  leading space is a character the person chose, and silently removing it would lock them out of an
  account they typed correctly."
- **A schema header names what it refuses.** The absence of `emp_id` and `user_type` from a signup
  schema is the security property; say it is deliberate and say what happens when a caller sends
  them anyway.
- **A builder says what it returns.** The query factory's builders return a *map of parameter name
  to schema, to be spread* — not a schema. `@returns {Object<string, import("joi").Schema>}` with a
  sentence, because the name alone reads like it returns a schema.
- **Curried validators say they are curried** — called once per endpoint, and the function they
  return is what Joi runs per request.

---

## 9. Definition of done

- [ ] Every folder has an `index.js`; the new file is registered in it, require block and exported
      object.
- [ ] Cross-folder imports go through the barrel; sibling imports inside a folder go by path.
- [ ] Nothing reaches past a barrel — if a name is missing from one, it was added to the barrel.
- [ ] No number, regex or message string is written twice; limits come from `constants/`, wording
      from `messages/`.
- [ ] A message listing enum values or quoting a limit is built from the source, not typed.
- [ ] Every body schema sets `unknown(false)`.
- [ ] Fields shared by more than one validator live in `<entity>_fields.js`.
- [ ] No comment sits inside a Joi schema object, an `Object.freeze` or a constants map.
- [ ] Headers say what a schema refuses and why, and what a builder actually returns.
- [ ] `require('@validators/<layer>')` loads without error.
