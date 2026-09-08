---
name: comment-placement
description: Where a comment goes in any file in the AIRSTONE project. Use whenever writing or editing JavaScript here — a model, controller, helper, validator, config, route, migration or script — and whenever reviewing a diff for comment style. The rule is that explanation sits above the thing it explains and never between the braces of an object or array literal, so data stays scannable and reasoning stays findable.
---

# Comment Placement

**A comment goes above the code it explains. It never goes inside an object or
array literal.**

That is the whole rule. The rest of this file is what counts as a literal, where
the explanation goes instead, and the two habits that follow from it.

---

## 1. Why

An object literal is data. A reader scanning a schema for "what type is this
field, is it required, what are the bounds", or scanning an aggregation for
"what are the stages", is reading a list. Prose between the entries makes them
step over paragraphs to reach the next one, and pushes the answer they came for
three screens further down than it needs to be.

The reasoning is not the problem — it is usually the most valuable thing in the
file. The placement is. Moved into a `/** */` block above the `const`, the same
words stay findable and the data stays a list.

---

## 2. The boundary

| Where | Comment? | Why |
|---|---|---|
| Above a `const`, function or export | **Yes** — `/** */` | This is where reasoning belongs |
| Above a statement inside a function body | **Yes** — `//` | That is code, not data |
| Between the braces of an object literal | **Never** | Data |
| Between the elements of an array literal | **Never** | Data |

Inside a function body a `//` note above the statement it explains is right and
expected:

```js
// Money cannot arrive before it was sent.
if (moment(received_payment_date).isBefore(moment(payment.payment_date))) {
```

That is not what this rule is about. The rule is about the braces of a literal.

---

## 3. What counts as a literal

All of these are data, and none of them may carry a comment between their
braces:

- a `new mongoose.Schema({ ... })` field block, and a field's own options object
- an `Object.freeze({ ... })` — a constants map, a messages map, an enum, a
  response-shape config, a list-query config
- a Joi schema object, a `.messages({ ... })` map, a `validate: { ... }` option
- a mongoose filter, projection, sort spec, populate spec or update object
- **an aggregation pipeline** — the array, its stages, and any stage's own
  object, including a `$facet` branch
- a `send_response` payload, a route handler's middleware array

The aggregation pipeline is the one that gets missed, because it reads like a
sequence of steps rather than like a config. It is not. It is an array of
objects handed to the driver, and a stage that needs explaining gets that
explanation in the header, walking the stages in the order they run.

---

## 4. Where the explanation goes instead

A `/** */` block above the `const`, written as prose keyed by the name of the
thing it explains, so a reader looking for the note on one field still finds it:

```js
/**
 * The shape every product response is built from.
 *
 * `agency` is a reference rather than a name the product carries, so every
 * endpoint expands it -- a client that used to read "CG" off the row would
 * otherwise get a bare id.
 */
const product_response = Object.freeze({
  default: Object.freeze({ select: PRODUCT_SELECT, populate: [company_ref("agency")] }),
});
```

For a pipeline, key the prose by stage instead, in pipeline order:

```js
/**
 * The three product lists, in one pass over the catalogue.
 *
 * What each stage is for, in the order they run:
 *
 * `$match` drops deactivated products at the front, so nothing downstream
 * carries a line the store has stopped selling.
 *
 * The first `$lookup` counts units rather than fetching them -- a sub-pipeline
 * ending in `$count` returns one small row per product, where pulling ten
 * thousand unit documents through to take their length reaches the same number
 * the expensive way.
 *
 * `$addFields` coalesces that to a plain number, because `$count` yields no row
 * at all for a product with no units -- and zero is the value the whole
 * out-of-stock list is built from.
 */
```

---

## 5. Two habits that follow

**If a literal needs a comment to be readable, name it instead.** A condition
that had to be explained inline is a condition that wanted a name:

```js
// before -- a literal that needed prose to be understood
out_of_stock: [{ $match: { stocks: 0 } }, { $sort: { name: 1 } }],

// after -- the name carries it, and the header explains the choice once
const OUT_OF_STOCK_ONLY = Object.freeze({ stocks: 0 });
const BY_NAME = Object.freeze({ name: 1 });

out_of_stock: [{ $match: OUT_OF_STOCK_ONLY }, { $sort: BY_NAME }],
```

Watch for the tell: when a comment is deleted and the line collapses to fit
comfortably, the comment was carrying weight the code should have carried.

**Never restate a name.** `// the columns that can be sorted` above
`sort_fields` earns nothing, and neither does `// find the user` above
`findOne`. Explain the reasoning, not the mechanics. A line that needs no
explanation gets no comment.

---

## 6. Scope

Every file in `src/`, `scripts/` and `test/`. This is the project-wide statement
of the rule; `controller-structure`, `model-structure` and `query-params` each
restate it for their own layer, and none of them narrows it — a helper, a route
file, a migration and a seed script are all bound by it too.

---

## 7. Definition of done

- [ ] No comment sits between the braces of any object or array literal — schema, config, Joi schema, filter, populate spec, aggregation pipeline or facet branch included.
- [ ] Every explanation a literal needs is in the `/** */` block above its `const`, keyed by field name — or by stage name, in pipeline order, for an aggregation.
- [ ] `//` notes inside function bodies sit above the statement they explain, never trailing it and never mid-expression.
- [ ] A condition that wanted an inline comment was given a name instead, and the name is `Object.freeze`d beside its siblings.
- [ ] No comment restates a field name, a function name or what a mongoose method does.
- [ ] Swept the changed files for stragglers. This finds candidates, and hits inside function bodies are expected and fine — the ones to fix are those inside a literal:

      awk 'BEGIN{d=0} { if ($0 ~ /^[[:space:]]*\/\// && d > 0) printf "%s:%d: %s\n", FILENAME, NR, $0; o=gsub(/[{[]/,"&"); c=gsub(/[}\]]/,"&"); d += o - c }' <file>
