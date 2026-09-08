---
name: helper-structure
description: Create, modify, review, or refactor helpers in the AIRSTONE project. Use whenever adding or changing anything under src/helpers, adding a database lookup or a piece of shared logic, deciding whether something is a helper or a util, or when asked "where does this function go". Enforces the folder shape every helper feature follows — index.js, constants/, db/, utils/ — one exported function per file, the import rules that keep the folders free of cycles, and the JSDoc comment every helper file carries.
---

# Helper Structure

**A helper feature is a folder with an `index.js`. Inside it, `constants/` holds values, `db/` holds
anything that touches the database, and `utils/` holds pure logic. One exported function per file.**

Helpers are where a controller's work goes when it is longer than a few named steps, or when a
second controller would otherwise copy it.

---

## 1. The folder shape

```
src/helpers/<feature>/
  index.js                    the feature's public surface
  constants/
    index.js
    <name>_constants.js
    <feature>_response.js     the response shape config, when the feature has one
  db/
    index.js
    <function_name>.js        one file, one exported function
  utils/
    index.js
    <function_name>.js        one file, one exported function
```

Rules:

- **Every folder has an `index.js`.** No exceptions, including `db/`, `utils/` and `constants/`.
- **A file is named after the function it exports**, in snake_case: `get_next_emp_id.js` exports
  `get_next_emp_id`. A reader looking for a function knows the filename before searching.
- **One exported function per file.** A private function used only by that one export stays in the
  same file, above it, and is not exported — `escape_regex` lives inside `contains.js`.
- **Create `constants/` only when the feature has values worth naming.** An empty barrel is noise.
  Same for `db/` in a feature that reads nothing, and `utils/` in a feature that is all queries.
- The feature folder holds nothing but those four entries. A loose `<feature>_helper.js` beside them
  is the shape this skill replaced.

---

## 2. Which folder does it go in

| The function… | Folder | Why |
|---|---|---|
| runs a query, or awaits something that runs one | `db/` | it needs a database to work at all |
| is a pure function of its arguments | `utils/` | it can be tested and read without a database |
| is a frozen value, a pattern, a format list, a response shape | `constants/` | it is data, not behaviour |

The test for `db/` is **"could this run with the database switched off?"** — not "does it import a
model". `apply_reference_filters` imports no model and still belongs in `db/`, because every branch
it takes awaits a lookup somebody else runs.

If a function touches no database, no `req` and no `res`, it may not belong in `src/helpers` at
all. `src/utils` is for that: `projection`, `financial_year`, `reference_error`. Purity is the
whole test — a util may still read this project's constants and build its errors. What separates
the two is that a helper may query and a util may not. `project-structure` §5a has the shape.

**A feature owns its helpers.** Something goes in `common/` only when a *second* feature already
imports it. Until then it lives with the feature that uses it. Moving one file later is cheap;
untangling a `common/` folder that grew into everything is not.

---

## 3. Import rules

These three rules are what keep the folders free of import cycles. They are not style.

1. **From outside a feature, import the feature's `index.js` and nothing deeper.**
   `require("@helpers/auth")` — never `@helpers/auth/db/get_next_emp_id`. A file can then move
   between `db/`, `utils/` and `constants/` without breaking a caller.

2. **From one folder to another inside the same feature, import the other folder's `index.js`.**
   `db/get_next_emp_id.js` imports `@helpers/auth/utils`. Safe in that direction because `utils/`
   never imports `db/`.

3. **Inside one folder, import the sibling file directly — never the folder's own `index.js`.**
   `utils/build_filter.js` imports `@helpers/list_query/utils/contains`, not
   `@helpers/list_query/utils`. Going through the barrel would make the folder import itself, and
   Node resolves that by handing one file a half-built module — which fails at boot, or worse, on
   the first request.

Every import uses a path alias. No relative paths, anywhere.

Direction of dependency inside a feature: `constants/` ← `utils/` ← `db/` ← `index.js`. Nothing
points back up that chain.

---

## 4. `index.js`

A barrel and nothing else. No logic, no conditionals, no re-shaping.

```js
/**
 * Everything the auth feature offers, in one import.
 *
 * This is the only path other features use: `require("@helpers/auth")`.
 * Reaching past it into `db/`, `utils/` or `constants/` from outside this folder
 * is not allowed, so a file can move between those three without breaking a
 * caller.
 *
 *   constants/  values only auth uses, and the signin response shape
 *   db/         reads against the users collection
 *   utils/      pure logic: tokens, employee id formatting, error translation
 */
const { auth_response } = require("@helpers/auth/constants");
const { get_next_emp_id } = require("@helpers/auth/db");
const { generate_auth_token } = require("@helpers/auth/utils");

module.exports = { auth_response, get_next_emp_id, generate_auth_token };
```

- The feature's `index.js` re-exports the three folder barrels flat, so a caller writes one
  destructure.
- A folder's `index.js` re-exports its own files.
- Sort the `require` lines by length, shortest first, matching the controller convention.
- The header says what the folder is for and what each subfolder holds — that is the map a new
  developer reads first.

---

## 5. Comments

Every helper file opens with a JSDoc block: verb-first summary, a paragraph only where there is a
reason to record, then `@param`, `@returns`, `@throws`.

The one this layer must never skip: **`@returns` says what an empty, false or null result means** —
every reason it can happen. "False when the id is empty, malformed, unknown or belongs to a
deactivated user" tells a caller they cannot tell those four apart, which is the real contract.

**`helper-comments` is the full rule** — the function header, what a barrel header must name, what
a constants block records, and the checklist. Read it before writing or reviewing a helper's
comments. Do not restate its rules here.

---

## 6. Worked example

`src/helpers/auth/db/get_last_emp_id_sequence.js` — one exported function, named after the file,
in `db/` because it queries:

```js
/**
 * Reads the highest counter already issued for one `YYMM` prefix.
 *
 * Sorting by `emp_id` as text is safe because every id sharing a prefix is the
 * same length, so text order and number order agree. That saves keeping a
 * separate counter document in step with the rows it counts.
 *
 * @param   {string} prefix  The `YYMM` half of the id, from `build_emp_id_prefix`.
 * @returns {Promise<number>} The highest counter used this month, or 0 when the
 *                            month has no accounts yet.
 * @throws  {app_error} 500 `EMP_ID_GENERATION_FAILED` when a stored id does not
 *                      end in a number. Failing loudly is the point: treating it
 *                      as 0 would restart the month and hand out an id that
 *                      already exists.
 */
```

The paragraph explains a decision the code cannot: *why* a text sort is correct here. The `@throws`
explains *why* it throws rather than defaulting to 0 — which is exactly the "simplification" a
future developer would otherwise make.

---

## 7. Adding a function to an existing feature

1. Decide the folder with the table in §2.
2. Create `<function_name>.js`. One export, named after the file.
3. Write the JSDoc header before the body — it is quicker to write while the reasoning is fresh.
4. Add it to that folder's `index.js`, in both the require block and the exported object.
5. Add it to the feature's `index.js`, in both places.
6. Check the direction of every import against §3.
7. Load it: `node -r module-alias/register -e "require('@helpers/<feature>')"`.

---

## 8. Definition of done

- [ ] Every folder touched has an `index.js`.
- [ ] Each new file exports exactly one function, named the same as the file, snake_case.
- [ ] `db/` holds everything that reads or awaits the database; `utils/` is pure; `constants/` is
      values only.
- [ ] Nothing outside the feature imports deeper than the feature's `index.js`.
- [ ] No file imports its own folder's `index.js`.
- [ ] Every import uses a path alias.
- [ ] The new function is registered in both barrels, require block and exported object.
- [ ] Every file has a JSDoc header: verb-first summary, a paragraph only where there is a reason to
      record, `@param` per argument with optionals in brackets, `@returns` including what an empty
      result means, `@throws` per failure raised here.
- [ ] No comment sits inside an object or array literal.
- [ ] It went in `common/` only because a second feature already imports it.
- [ ] `require('@helpers/<feature>')` loads without error.
