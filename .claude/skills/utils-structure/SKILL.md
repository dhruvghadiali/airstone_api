---
name: utils-structure
description: Create, modify or review anything under src/utils in the AIRSTONE project — folder shape, file naming, imports and comments. Use whenever adding a pure function, deciding whether something is a util or a helper, or when asked "where does this go", "is this a util". A util is pure logic: no database, no req, no res. Anything that queries is a helper.
---

# Utils Structure

**A util is pure logic: no database, no `req`, no `res`. That is the whole test.**

A util may read this project's constants and build its errors — `reference_error` does both — and
it is still a util, because it queries nothing and touches no request. Anything that queries, or
awaits something that does, is a helper under `src/helpers/<feature>/`. See `helper-structure`.

---

## 1. The shape

```
src/utils/
  index.js                  the registry
  constants/                values the utils share
    index.js
    <topic>_constants.js
  <topic>/                  a util with more than one export, or shared internals
    index.js
    <function_name>.js
  <function_name>.js        a single standalone function stays a flat file
```

As it stands:

```
src/utils/
  index.js
  constants/index.js, projection_constants.js
  projection/       index.js, to_paths.js, project.js, to_projection.js
  financial_year/   index.js, in_ist.js, financial_year_start.js,
                    get_financial_year.js, build_financial_year_months.js
  reference_error.js
```

---

## 2. Folder or flat file

- **A folder** when the topic has more than one exported function, or internals those functions
  share. `projection/` holds `project` and `to_projection`, both built on `to_paths`.
- **A flat file** when it is one standalone function with nothing to share. `reference_error.js`
  is one function; wrapping it in a folder of its own would be ceremony.

A folder is not created in advance. A flat file that grows a second export becomes a folder in the
change that adds it.

---

## 3. Shared internals

A function used by two siblings gets its own file **and is left out of the folder's `index.js`**:

```
projection/
  to_paths.js        <- imported by project.js and to_projection.js
  index.js           <- exports project and to_projection only
```

This is how one-export-per-file survives shared logic. The alternative — exporting `to_paths`
publicly — widens the surface for something no caller outside the folder has any use for.

**Say in the barrel header which files were left out and why.** A silently omitted file reads as an
oversight, and the next person adds it to the exports "for consistency".

---

## 4. Imports

- Outside `src/utils`, import the topic: `require("@utils/projection")`. Never a file inside it.
- Inside a topic folder, import the sibling file directly — never the folder's own `index.js`, which
  would make the folder import itself.
- Path aliases only.

**`src/utils/index.js` is a registry, not a convenience import.** Destructuring it would load every
util — moment and lodash included — on every request, so callers name the one they want. The file
exists so a reader sees them all in one place, and so a new util is registered somewhere rather
than only found by searching. `src/helpers/index.js` and `src/validators/index.js` are the same
idea for the same reason.

---

## 5. Naming

- snake_case, file named after what it exports: `to_projection.js` exports `to_projection`.
- A topic folder is named for the topic, not for one of its functions: `financial_year/`, not
  `get_financial_year/`.
- One export per file.

---

## 6. Comments

The project-wide JSDoc pattern — `project-structure` §4 — with two things this layer leans on
hardest.

**Say why it is a util.** A util that touches the project's vocabulary looks like a helper at first
glance, so the header records the test it passed:

```
 * It is a util rather than a helper because it touches no database, no `req`
 * and no `res`. It is also not any one feature's: product, purchase, sale,
 * stock and address all raise it about references of their own, and putting it
 * in one of their folders would have the other four reaching across a feature
 * boundary for it.
```

**Say what an empty result means.** A pure function's contract is entirely in its return value:

```
 * @returns {Object|Object[]|null} The same shape that was passed in, narrowed.
 *   A falsy `document` is returned unchanged so a caller can project a "not
 *   found" result without checking first. An empty `select` returns the whole
 *   document.
```

Both branches of "nothing came back" are named, so a caller knows an empty select means *no
opinion* rather than *return nothing*.

Folder-private files say so in their own header — "Folder-private: used by both projection utils,
and not re-exported by `index.js`, because a caller has no reason to …".

---

## 7. Adding a util

1. Check the purity test in §0 above. If it queries, it is a helper — stop.
2. Check it is not already there under another name.
3. Flat file, or a new file inside the topic folder it belongs to.
4. Write the JSDoc header, including what an empty result means.
5. Register it: the topic's `index.js` if it has one, then `src/utils/index.js`.
6. Load it: `node -r module-alias/register -e "require('@utils/<topic>')"`.

---

## 8. Definition of done

- [ ] It is pure — no database, no `req`, no `res`. Anything else is a helper.
- [ ] snake_case; the filename matches what it exports; one export per file.
- [ ] A folder only because the topic has several exports or shared internals; otherwise a flat
      file.
- [ ] Shared internals live in their own file and are **not** re-exported by the barrel.
- [ ] Every barrel header names the files it left out and why.
- [ ] Nothing outside `src/utils` imports deeper than the topic; no file imports its own folder's
      `index.js`.
- [ ] Registered in `src/utils/index.js`.
- [ ] The header says what an empty, null or falsy return means, in every case it can happen.
- [ ] `require('@utils/<topic>')` loads without error.
