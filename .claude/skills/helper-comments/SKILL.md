---
name: helper-comments
description: Write or review the comments on a helper file in the AIRSTONE project. Use whenever adding or changing anything under src/helpers, or when asked to "comment this helper", "document this function", "the comments here are unclear". Covers the JSDoc header on a function file, what a barrel header must name, what a constants block records, and the one thing this layer must always document — what an empty or falsy return means.
---

# Helper Comments

**Every helper file opens with a JSDoc block. Standard tags, plain English, and a paragraph only
where there is a reason to record.**

`helper-structure` owns the folder shape and the import rules. This skill owns the comments.

---

## 1. A function file

```js
/**
 * One sentence, verb first, saying what it does or returns.
 *
 * Then a paragraph for anything a reader could not work out from the code: why
 * it lives in this folder, what it deliberately does not do, why a failure is
 * shaped the way it is, what would break if it changed.
 *
 * @param   {string} value            What it is, and what makes it invalid.
 * @param   {Object} [options={}]     Brackets mean optional.
 * @param   {boolean} [options.flag]  Its default, and what it changes.
 * @returns {Promise<Object|null>} What comes back, and what an empty result
 *                                 means.
 * @throws  {app_error} 409 `ALREADY_EXISTS` when …
 */
```

- **Verb-first summary.** "Reads the highest counter already issued for one `YYMM` prefix." Not
  "This function is used to…", not the filename in a sentence.
- **A paragraph only when there is something to say.** A three line wrapper gets a summary and its
  tags. Prose that restates the code is worse than none — it is one more thing to keep true.
- **`@param` per argument**, real names, optionals in brackets with their default. Say what makes a
  value invalid, not only its type.
- **`@throws` per failure raised here**, with the status and the message constant. Not failures
  raised by shared middleware.

---

## 2. Always say what an empty return means

This is the rule this layer gets wrong most often. A helper's caller cannot see inside it, so
"returns false" is not an answer — false *for which reasons* is.

```js
 * @returns {Promise<boolean>} False when the id is empty, malformed, unknown or
 *                             belongs to a deactivated user.
```

That sentence tells a caller they **cannot tell those four apart**, which is the actual contract.
A caller who needs to distinguish "no such user" from "user is deactivated" now knows to ask a
different question rather than reading meaning into a boolean that does not carry it.

The same for a nullable read: `null` when the id is malformed, missing, or the row is soft deleted
— one word each, and the caller knows what it may conclude.

---

## 3. Record why, not what

The code says what. Worth a paragraph, because nothing else records it:

| Situation | What the paragraph saves |
|---|---|
| a value is forced rather than accepted | someone adds it to the validator and opens a hole |
| one failure is retried and another returned | someone wraps the wrong call and turns a server clash into a 409 nobody can fix |
| two failures answer with one message | someone "helpfully" splits them and leaks which usernames exist |
| a query reads a column the response never carries | someone assumes the column is safe to return |
| a filter is on `is_active` / `is_deleted` | someone drops it and revives soft deleted rows |
| the approach is affordable now, not forever | someone hits the wall with no idea what to change |

Example of the last, from `contains`:

```
 * Matching is unanchored, which no index can serve. That is affordable at the
 * row counts this API carries today, and it is the first thing to revisit if a
 * list ever slows down -- either a text index behind `$text`, or an anchored
 * prefix match a btree can answer.
```

---

## 4. A barrel header

Says what the folder holds, repeats the import rule, and **names the files it deliberately left
out**:

```js
/**
 * Narrowing a document, or an aggregation stage, down to the columns a response
 * config names.
 *
 * Other folders import from this file. Files inside this folder import each
 * other directly, never through it.
 *
 * `to_paths` is deliberately not re-exported. It is the shared reader both
 * functions below are built on, and it is of no use on its own.
 */
```

That last paragraph is not optional. A folder-private file that the barrel silently omits reads as
an oversight, and the next person adds it to the exports "for consistency" — widening the public
surface for no reason. Saying it was left out on purpose is what prevents that.

A feature's own `index.js` also lists its subfolders and what each holds. That list is the map a
new developer reads first.

---

## 5. A constants file

A block at the top of the file saying what kind of values it holds, then a block above each value
saying what it means and why it is that number or pattern:

```js
/**
 * How text columns are compared when sorting.
 *
 * Mongo compares strings byte by byte, so "Bob" sorts before "alice". English
 * collation at strength 2 is what makes an alphabetical column read the way a
 * person expects.
 *
 * Exported rather than kept private because an aggregation that orders by a
 * human readable name needs the same collation a sorted `find()` uses, and two
 * definitions would drift.
 *
 * @type {Readonly<{locale: string, strength: number}>}
 */
const TEXT_COLLATION = Object.freeze({ locale: "en", strength: 2 });
```

Four lines for one small object, and every one earns its place: what it does, why it is needed at
all, and why it is exported. **Never a comment inside the braces** — that is `comment-placement`.

---

## 6. Why-notes

`//` above the statement they explain, inside a function body, at each non-obvious decision. Never
`// find the user` above `findOne`. If a line needs no explanation, it gets no comment.

---

## 7. Worked example

`src/helpers/auth/db/get_last_emp_id_sequence.js`:

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

The paragraph explains a decision the code cannot: *why* a text sort is correct here. `@returns`
says what 0 means. The `@throws` explains why it throws rather than defaulting to 0 — which is
exactly the simplification a future developer would otherwise make.

---

## 8. Definition of done

- [ ] Every file has a JSDoc header with a verb-first summary.
- [ ] A paragraph exists only where there is a reason to record, and it says why rather than what.
- [ ] `@param` per argument, real names, optionals in brackets with their defaults.
- [ ] `@returns` says what an empty, false or null result means — every reason it can happen.
- [ ] `@throws` per failure raised in this file, with status and message constant; nothing repeated
      from shared middleware.
- [ ] Every barrel header says what the folder holds, repeats the import rule, and names any
      folder-private file it left out and why.
- [ ] A feature's `index.js` lists its subfolders and what each holds.
- [ ] Constants carry a block each, saying what the value means and why it is that value.
- [ ] No comment sits inside an object or array literal.
- [ ] Every number and name in a header matches the code it describes.
