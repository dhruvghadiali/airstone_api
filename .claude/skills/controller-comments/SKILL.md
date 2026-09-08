---
name: controller-comments
description: Write or review the JSDoc header on a controller in the AIRSTONE project. Use whenever adding a controller under src/controllers, changing what a controller accepts or returns, mounting an existing controller under another role, or when asked to "add comments", "document this endpoint", "the comments are unclear", or "explain what this controller does". Enforces one header format across every controller so a developer who has never opened the file can tell what it does, who may call it, what it accepts and how it fails without reading the validator, the route tree or the helper.
---

# Controller Comments

**Every controller opens with a JSDoc block. Standard tags only, plain English prose.**

Standard tags, because an editor tooltip, a doc generator and the next developer all read the same
thing. Plain English, because the block exists for the person who arrives six months from now and
has to change the endpoint safely.

This is the header rule referenced by `controller-structure` §9. That skill owns the shape of the
whole controller file; this one owns the block at the top of it.

---

## 1. The template

```js
/**
 * One line saying what the endpoint does.
 *
 * Then a short paragraph for each rule the code enforces that a reader could
 * not work out from the signature: what is forced instead of accepted, which
 * rows are eligible, what is retried and what is returned to the caller, what
 * is deliberately not revealed, and why.
 *
 * @route   POST /super-admin/employees
 * @access  Super admin
 *
 * @param   {import("express").Request} req
 * @param   {Object} req.body Validated by `create_employee_schema`, which
 *                            rejects unknown fields.
 * @param   {string} req.body.first_name Required. 1-100 chars, trimmed.
 * @param   {string} [req.body.notes]    Optional. Up to 500 chars.
 * @param   {Object} req.params
 * @param   {string} req.params.id       Required. 24 char hex ObjectId.
 * @param   {Object} req.validated_query
 * @param   {number} [req.validated_query.page] Optional. Defaults to 1.
 * @param   {import("express").Response} res
 *
 * @returns {Promise<void>} 201 with the columns listed in `employee_response`.
 *
 * @throws  {app_error} 404 `NOT_FOUND` when no active employee has that id.
 * @throws  {app_error} 409 `ALREADY_EXISTS` when the email is taken.
 */
```

Tag order is fixed: summary, prose, `@route`, `@access`, `@param`, `@returns`, `@throws`. A blank
`*` line separates each group.

---

## 2. The summary line

One sentence, present tense, starting with a verb: "Creates a super admin account.", "Signs an
employee in and issues the JWT their later requests carry."

Not "This function is used to create..." and not a restatement of the filename. If the one line is
all a reader gets, it should still tell them whether this is the endpoint they are looking for.

---

## 3. The prose paragraphs

This is the part that earns its keep, and the part a generated comment always misses. Write a short
paragraph for each rule a reader cannot see in the code, and say **why**, not just what:

| Write a paragraph when the controller… | Because a future change will otherwise… |
|---|---|
| forces a value instead of accepting it (`user_type`, `is_active`) | quietly add it to the validator and open a privilege hole |
| generates a value server side (`emp_id`, a reference number) | let a caller send their own |
| retries one failure but returns another | wrap the wrong call and turn a server clash into a 409 the caller cannot fix |
| answers two different failures with one message | "helpfully" split them and leak which usernames exist |
| filters on `is_active` / `is_deleted` | reintroduce soft deleted rows into a list |
| reads a column the response never carries (a password hash) | assume the column is safe to return |

Skip the paragraph when the code already says it. `findById(req.params.id)` needs no prose.

**No route paths in the prose** — `@route` owns those. **No field lists in the prose** — `@param`
owns those. Prose that repeats a tag goes stale independently of it.

---

## 4. `@route` and `@access`

```js
 * @route   GET  /employee/stocks
 * @route   GET  /super-admin/stocks
 * @route   GET  /admin/stocks
 * @access  Employee, super admin, admin
```

- One `@route` line per mount, method then path. A controller mounted under three roles carries
  three lines.
- **Mounting a controller somewhere new means adding its `@route` line in the same change.** This is
  the one line in the block that can silently go stale, and that rule is the whole mitigation.
- `@access` states roles, never a URL — `Public`, `Super admin`, `Employee, admin`. `Public` means
  no token is required.

---

## 5. `@param`

One line per field the endpoint accepts, addressed by its real path so JSDoc and the IDE understand
it:

```js
 * @param   {string}  req.body.email          Required. Valid email, stored lower case.
 * @param   {string}  [req.body.notes]        Optional. Up to 500 chars.
 * @param   {string}  req.params.id           Required. 24 char hex ObjectId.
 * @param   {number}  [req.validated_query.page] Optional. Defaults to 1.
```

- **Brackets mean optional** — `[req.body.notes]`. That is JSDoc's own spelling; do not invent
  another.
- After the type, write `Required.` or `Optional.`, then the limits and any transformation the
  caller should expect — `trimmed`, `stored lower case`, `must be unique`.
- **Copy limits from the constants**, never from memory. If the file says
  `USERNAME_MAX: 50`, the comment says 50.
- Query input is read from `req.validated_query`, so document it there — never `req.query`.
- Name the validator once, on the `req.body` line: ``Validated by `create_employee_schema`, which
  rejects unknown fields.`` That is the pointer from prose to the source of truth — change the
  schema and the diff shows you the comment naming it.
- Call out any field the server sets and refuses from the caller, on the `req.body` line or in the
  prose.
- **Leave a part out entirely when the endpoint does not use it.** No `req.params` line on an
  endpoint with no route params — an absent tag already means "none". Never write a placeholder.
- `req` and `res` themselves are typed `{import("express").Request}` / `{import("express").Response}`
  and need no description.

---

## 6. `@returns` and `@throws`

```js
 * @returns {Promise<void>} 200 with the columns listed in `employee_response`.
 *
 * @throws  {app_error} 404 `NOT_FOUND` when no active employee has that id.
```

- `@returns` is always `{Promise<void>}`. A controller returns `send_response`, not data. Follow it
  with the success status and the response-shape config the columns come from — never an inline
  field list, which would duplicate the config and drift from it.
- `@throws` gets one line per failure **this controller raises itself**: the status, the message
  constant, and the condition. Order by status code.
- Do **not** list failures raised by shared middleware — validation 400s from `validate_request`,
  401s from `authenticate_user`, 403s from `authorize_user_types`, 500s from `error_handler`.
  Repeating those on every controller is noise nobody maintains.

---

## 7. Worked example

```js
/**
 * Signs an admin in and issues the JWT their later requests carry.
 *
 * Public because this is one of the endpoints that hands a token out rather
 * than asking for one.
 *
 * The user type is fixed to `user_type.ADMIN` here and never read from the
 * request, so a super admin or an employee must use their own signin
 * endpoint. An account must also be active; one that was deactivated cannot
 * sign back in even with the right password.
 *
 * An unknown username and a wrong password fail with the same 401 on purpose.
 * Telling them apart would turn this into a way of discovering which usernames
 * exist.
 *
 * @route   POST /admin/auth/signin
 * @access  Public
 *
 * @param   {import("express").Request} req
 * @param   {Object} req.body Validated by `admin_signin_schema`, which rejects
 *                            unknown fields.
 * @param   {string} req.body.username Required. 3-50 chars, matched lower case.
 * @param   {string} req.body.password Required. 8-20 chars.
 * @param   {import("express").Response} res
 *
 * @returns {Promise<void>} 200 with the account columns listed in
 *                          `auth_response`, plus `token`.
 *
 * @throws  {app_error} 401 `INVALID_CREDENTIALS` when no active admin
 *                      matches the username, or the password is wrong.
 */
```

Read it against the rules: the summary is one verb-first sentence; each paragraph explains a rule
the signature cannot show and says why; `@access Public` states a role rather than repeating the
path; the validator is named once; the limits match `user_validation_limits`; `@returns` points at
`auth_response` instead of listing columns; the only `@throws` is the 401 this controller's helper
raises — the 400 from `validate_request` is not repeated.

---

## 8. Keeping it true

The header is part of the change, not a follow-up:

- Add or remove a field in the validator → add or remove its `@param` line.
- Change a limit in the constants → change the number in the `@param` line.
- Mount the controller under another role → add an `@route` line and widen `@access`.
- Add a `throw` → add a `@throws` line.
- Change what the response config selects → the `@returns` line still points at the config, so
  nothing to do. That is why it points at the config.

A comment that contradicts the code is worse than no comment, because it is believed.

---

## 9. Definition of done

- [ ] Summary is one verb-first sentence.
- [ ] Every rule the signature cannot show has a prose paragraph that says why.
- [ ] Prose contains no route paths and no field lists.
- [ ] One `@route` per mount; `@access` names roles, not URLs.
- [ ] One `@param` per accepted field, real dotted paths, optionals in brackets, limits copied from
      the constants.
- [ ] Validator named once on the `req.body` line.
- [ ] Query fields documented as `req.validated_query.*`.
- [ ] Unused parts (`req.params`, `req.body`) omitted, not written as placeholders.
- [ ] `@returns {Promise<void>}` with the success status and the response-shape config.
- [ ] `@throws` covers what this controller raises and nothing raised by shared middleware.
- [ ] Every number and name in the block matches the code it describes.
