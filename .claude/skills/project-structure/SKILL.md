---
name: project-structure
description: The AIRSTONE project's conventions — where every kind of file lives, how folders and files are named and imported, and the one JSDoc comment pattern every file follows. Read this FIRST whenever adding a file, adding a feature, or wondering "where does this go", "what do I name it", "how do I comment it", "what's the convention here". It routes to the skill that owns each layer, so any file written from it looks like the ones already there regardless of who — or which AI — wrote it.
---

# Project Structure

**One shape for every folder. One name for every file. One comment pattern for every layer.**

The point is that a developer opening any file recognises it. Read this before adding anything, then
read the skill that owns the layer you are touching.

---

## 1. Where everything lives

| What | Where | Skill that owns it |
|---|---|---|
| App wiring, global middleware, router mounts | `src/app.js`, `src/server.js` | this file |
| Database connection | `src/config/database.js` | this file |
| Role routers, feature routers, route files | `src/routes/<role>/<feature>/` | `route-structure`, `route-comments` |
| Request handlers | `src/controllers/<feature>/` | `controller-structure`, `controller-comments` |
| Shared logic and queries | `src/helpers/<feature>/` | `helper-structure`, `helper-comments` |
| Mongoose schemas | `src/models/<entity>/` | `model-structure`, `model-comments` |
| Pure logic — no database, no `req`, no `res` | `src/utils/` | `utils-structure` |
| Frozen value sets | `src/enums/<entity>_enums.js` | `enum-structure`, `enum-comments` |
| The validators tree, `constants/`, `messages/` | `src/validators/` | `validators-structure` |
| Request body schemas | `src/validators/request_body/<feature>/` | `request-body-structure` |
| Route param schemas | `src/validators/route_params/` | `route-params-structure` |
| List query schemas and configs | `src/validators/query_params/<feature>/` | `query-params` |
| Express middleware | `src/middlewares/` | this file |
| Data migrations | `scripts/migrations/` | `mongoose-migrations` |
| Where a comment may sit | everywhere | `comment-placement` |
| How a comment or document is worded | everywhere | `plain-english` |

**Never invent a new top-level folder.** If something fits nowhere above, it is nearly always a
helper or a util — see §3.

---

## 2. Folder and file rules

These hold everywhere, in every layer.

- **Every folder has an `index.js`.** It is a barrel: requires and re-exports, no logic. It is what
  other folders import.
- **Import a folder, not a file inside it.** `@helpers/auth`, `@validators/messages`, `@enums`.
  Reaching deeper couples a caller to a layout that is allowed to change.
- **Inside one folder, import the sibling file directly — never your own `index.js`.** Going through
  your own barrel makes the folder import itself; Node answers that with a half-built module, which
  fails at boot or, worse, on the first request only.
- **snake_case for every file and folder.** `get_next_emp_id.js`, `company_address/`.
- **A file is named after what it exports.** `get_next_emp_id.js` exports `get_next_emp_id`;
  `create_employee.js` exports `create_employee`.
- **One export per file** in `controllers/`, `helpers/db/`, `helpers/utils/` and `validators/`. A
  private function used only by that export stays in the same file, above it, unexported.
- **Path aliases only.** Never `../../models`. A new alias goes in both `package.json`
  `_moduleAliases` and `jsconfig.json` `paths`, in the same change.
- **Sort `require` lines by length, shortest first,** in groups: third-party, then models and
  `app_error`, then single-line destructured, then multi-line destructured. A blank line between
  groups.

---

## 3. Deciding where something goes

Ask in this order:

1. **Does it handle a request?** → a controller.
2. **Does it read or write the database, or await something that does?** → the feature's
   `helpers/<feature>/db/`.
3. **Is it logic this project's vocabulary needs — a response envelope, a filter builder, a token?**
   → the feature's `helpers/<feature>/utils/`.
4. **Is it pure — no database, no `req`, no `res`?** → `src/utils/`. A util may still read this
   project's constants and build its errors; `reference_error` does both. What makes it a util is
   that it queries nothing and touches no request.
5. **Is it a value rather than behaviour?** → `helpers/<feature>/constants/` when only that helper
   reads it, `src/validators/constants/` when a model or validator reads it too.

`src/helpers/common/` is only for what a **second** feature already imports. Until then it lives
with the feature that uses it. Moving one file later is cheap; untangling a `common/` that grew into
everything is not.

---

## 4. The comment pattern

**Every file opens with a JSDoc block. Standard tags only. Plain, simple English.**

Standard tags because an editor tooltip, a doc generator and the next developer all read the same
thing. Plain English because the block exists for the person who arrives six months from now and has
to change the file safely.

### The shape, everywhere

```js
/**
 * One sentence, verb first, saying what this does.
 *
 * Then a short paragraph for anything a reader could not work out from the
 * code: why it exists, what is forced rather than accepted, what is
 * deliberately not done, why a failure is shaped the way it is.
 *
 * @param   {string} name  What it is, and what makes it invalid.
 * @returns {Type} What comes back, and what an empty result means.
 * @throws  {app_error} 409 `MESSAGE_CONSTANT` when …
 */
```

### Per layer

| Layer | Header carries | Full rule |
|---|---|---|
| Controller | summary, prose, `@route` per mount, `@access` by role, `@param` per accepted field, `@returns`, `@throws` | `controller-comments` |
| Helper | summary, prose where there is a reason to record, `@param`, `@returns` (including what an empty result means), `@throws` | `helper-comments` |
| Util | the same, plus why it is a util rather than a helper | `utils-structure` §6 |
| Model | what the entity is, and any rule the schema cannot state — per field, above the schema, keyed by field name | `model-comments` |
| Enum | what the set is and why it is that set, above the `const`; every derived list states its exclusions | `enum-comments` |
| Route | almost none. The feature router's `index.js` says who may reach the resource; anything not mounted says why | `route-comments` |
| Validator | what the schema refuses and why; a builder says what it actually returns | `validators-structure` §8 |
| `index.js` barrel | what the folder is for, one line per subfolder, and any folder-private file it left out | §5 below |
| Constants file | what kind of values it holds, then a block above each value saying what it means and why | §5 below |

### Rules that never change

- **Verb-first summary.** "Reads the highest counter already issued for one prefix." Not "This
  function is used to…".
- **Write the paragraph only when there is something to say.** A three line wrapper gets a summary
  and its tags, nothing more. Prose that restates the code is worse than none — it is one more thing
  to keep true.
- **Say why, not what.** The code already says what. Worth recording: a value forced rather than
  accepted; two different failures answered with one message on purpose; a clash retried rather than
  returned; a query reading a column the response never carries; a choice that is affordable now and
  is the first thing to revisit later.
- **Optionals in brackets** — `@param {string} [options.flag]` — with the default. That is JSDoc's
  own spelling.
- **Numbers come from the constants**, never from memory. If the file says `USERNAME_MAX: 50`, the
  comment says 50.
- **`@returns` says what an empty or falsy result means.** "False when the id is empty, malformed,
  unknown or belongs to a deactivated user" tells a caller they cannot tell those apart, which is
  the point.
- **`@throws` per failure raised here.** Not failures raised by shared middleware — validation 400s,
  auth 401s — repeating those on every file is noise nobody maintains.
- **No comment inside an object or array literal**, ever. Prose about a key goes in the block above
  the `const`, keyed by that key's name. That is `comment-placement`, and it holds in every layer.
- **`//` why-notes above the statement they explain**, at each non-obvious decision. Never
  `// find the user` above `findOne`.
- **The comment is part of the change.** Add a field → add its `@param`. Change a limit → change the
  number. Add a mount → add the `@route`. Add a `throw` → add the `@throws`. A comment that
  contradicts the code is worse than no comment, because it is believed.

---

## 5a. `src/utils`

A util is pure logic: no database, no `req`, no `res`. That is the whole test — a util may still
read this project's constants and build its errors. Anything that queries is a helper.

**`utils-structure` is the full rule** — folder versus flat file, shared internals that stay out of
the barrel, and the comment rules.

---

## 5. `index.js`

Two kinds, both barrels, both carrying a header.

**A feature's `index.js`** — the public surface. It says what the feature offers and what each
subfolder holds:

```js
/**
 * Everything the auth feature offers, in one import.
 *
 * This is the only path other features use: `require("@helpers/auth")`.
 *
 *   constants/  values only auth uses, and the signin response shape
 *   db/         reads against the users collection
 *   utils/      pure logic: tokens, employee id formatting, error translation
 */
```

**A folder's `index.js`** — says what the folder holds, and repeats the import rule so the next
person adding a file sees it:

```js
/**
 * The auth helper's database reads. Everything in here touches the `users`
 * collection.
 *
 * Other folders import from this file. Files inside `src/helpers/auth/db` import
 * each other directly, never through this file.
 */
```

No logic in a barrel. No conditionals, no re-shaping, no computed exports.

---

## 6. Adding a feature end to end

In this order, so each step has what it needs:

1. **Model** — `src/models/<feature>/<feature>_model.js` and its `index.js` barrel, plus its limits, patterns and messages.
   → `model-structure`, and `enum-structure` for any fixed value set
2. **Validators** — request body, route params, and the list query config.
   → `request-body-structure`, `route-params-structure`, `query-params`
3. **Helpers** — the feature's `index.js`, `constants/`, `db/`, `utils/`, including its
   `<feature>_response.js` shape config. → `helper-structure`
4. **Controllers** — one file per action, registered in the feature's `index.js`.
   → `controller-structure`, `controller-comments`
5. **Routes** — one file per operation, a feature router, mounted on each role router that may reach
   it. → `route-structure`
6. **Migration**, if existing documents need a new field. → `mongoose-migrations`

Register every new file in its folder's `index.js` — both the require block and the exported object
— in the same change that creates it.

---

## 7. Definition of done

- [ ] The file is in the folder §1 names, and no new top-level folder was invented.
- [ ] snake_case; the filename matches what it exports; one export per file where §2 requires it.
- [ ] Every folder touched has an `index.js`, and the new file is registered in it — require block
      and exported object.
- [ ] Imports use aliases, address folders rather than files inside them, and no file imports its own
      folder's `index.js`.
- [ ] Require lines are grouped and sorted shortest first.
- [ ] The JSDoc header has a verb-first summary; a paragraph only where there is a reason to record;
      `@param` per argument with optionals in brackets; `@returns` including what an empty result
      means; `@throws` per failure raised here.
- [ ] Every number and name in the header matches the code it describes.
- [ ] No comment sits inside an object or array literal.
- [ ] It loads: `node -r module-alias/register -e "require('<alias path>')"`.
