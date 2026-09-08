---
name: plain-english
description: The English used in every comment, JSDoc block, README line, doc file and commit message in the AIRSTONE project. Use whenever writing or editing prose here — a new comment, a changed comment, a new document, an edit to an existing one. The rule is short sentences and common words, so a reader who is tired, in a hurry, or reading English as a second language gets the point on the first pass.
---

# Plain English

**Write every comment and every document in short sentences and common words.**

This skill is about how a sentence reads. It does not change *where* a comment
sits — that is `comment-placement`. It does not change *what* a comment must
record — that is `model-comments`, `controller-comments`, `helper-comments`,
`route-comments` and `enum-comments`.

---

## 1. Why

A comment is written once and read many times. It is read by someone who is
debugging at speed, and often by someone who reads English as a second
language. A long sentence with a rare word costs that reader a second pass.

Plain English is not a smaller amount of information. It is the same
information in words that land the first time.

---

## 2. The six rules

**One idea per sentence.** Aim for about fifteen words. Twenty is the ceiling.
If a sentence has an "and", a "which" or a "because" in the middle, it is
usually two sentences.

**Use the common word.** See the table in §3. If a shorter word means the same
thing, use the shorter word.

**Say who does what.** Write "the controller checks the reference", not "the
reference is checked". The passive voice hides the actor, and the actor is
usually the point.

**Start with the point.** The first sentence of a block says what the thing is.
Background comes after it, if it is needed at all.

**Use one word for one thing.** Pick a name and repeat it. Do not swap between
"reference", "link", "pointer" and "relation" for the same field. Variety reads
as four things, not one.

**No idioms, no metaphors, no jokes.** "The escape hatch", "bites you later",
"throat-clearing" — all of these need cultural knowledge to decode. Say the
plain thing instead.

Two more habits follow from these:

- A paragraph is three or four sentences. Break it when it grows.
- Three or more items become a list, not a sentence with commas.

---

## 3. Words to swap

| Do not write | Write |
| --- | --- |
| utilise, leverage | use |
| in order to | to |
| prior to | before |
| subsequent to, following | after |
| in the event that | if |
| at this point in time | now |
| possesses, holds | has |
| is able to | can |
| attempt to | try |
| commence | start |
| terminate | stop, end |
| sufficient | enough |
| approximately | about |
| additional | more |
| numerous | many |
| demonstrate | show |
| facilitate | help |
| regarding, with respect to | about |
| however | but, or a new sentence |
| therefore | so |
| nevertheless | still |
| it should be noted that | *delete it and state the note* |

Write "need" rather than "require" in prose. Keep "required" when it names the
Mongoose or Joi option.

---

## 4. What does not change

Plain English is about the sentence. It is not about hiding the domain or the
code.

- **Domain terms stay.** GST number, PAN number, pincode, soft delete, index,
  barrel, populate, migration, require cycle. These are the correct words. A
  reader of this codebase knows them, and a vague word in their place is worse.
- **Code names stay exact.** `is_active`, `company_address`, `find_active_company_address`.
  Never paraphrase an identifier.
- **Message strings are not prose.** The wording in `src/validators/messages` is
  a contract with the caller. Change it only when the message itself is being
  changed, and follow `validators-structure`.
- **A file you are not editing stays as it is.** Do not rewrite a whole header
  because one line below it changed. See §6.

---

## 5. Before and after

A model block:

> **Before** — `gst_number` and `pan_number` are the two things that actually
> identify the firm, so they carry the unique indexes and `company_name` does
> not — two traders really can both be "Shree Stone Traders".
>
> **After** — `gst_number` and `pan_number` identify the firm, so both are
> unique. `company_name` is not unique, because two firms can share a name.

A helper header:

> **Before** — Keeping these out of the schemas is what lets this file import
> its model at the top like every other file: a model that verified its own
> references would have to import this helper, and the two would then import
> each other.
>
> **After** — This check lives here, not in the schema. A schema that ran it
> would have to import this file. This file already imports the model, so the
> two would import each other. Node answers that cycle with a half-built
> module.

A line in a document:

> **Before** — In the event that the company has been deactivated, the
> reference is deemed invalid.
>
> **After** — If the company is not active, the reference is invalid.

Each "after" is the same fact. It is shorter because the words are shorter, not
because something was dropped.

---

## 6. Editing prose that already exists

Rewrite the sentences you are already changing. Leave the rest.

- Changed a field, and its lines in the block above? Rewrite those lines.
- Added a field? Write its lines in plain English. The lines around it stay.
- Only changed code, and the block is still correct? Change nothing.

A diff that rewords a file nobody asked about is hard to review. The reader
cannot tell the real change from the tidying.

If a whole file reads badly and the wording matters, say so and ask before
rewriting it.

---

## 7. Checklist

Before reporting any comment or document as done:

- [ ] Every sentence carries one idea, and none runs past about twenty words.
- [ ] No word in the §3 table survives.
- [ ] Sentences name the actor: the controller, the schema, the caller, Node.
- [ ] The first sentence of each block says what the thing is.
- [ ] One thing is called by one name throughout.
- [ ] No idiom, no metaphor, no joke.
- [ ] Paragraphs run to four sentences at most; longer lists are lists.
- [ ] Domain terms and code identifiers are exact, not simplified.
- [ ] Message strings in `src/validators/messages` were not reworded by accident.
- [ ] Only the prose that needed to change was changed.
