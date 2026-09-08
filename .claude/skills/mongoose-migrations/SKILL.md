---
name: mongoose-migrations
description: >-
  Install a file-based migration system for MongoDB/Mongoose projects — apply,
  roll back, preview, generate, and log schema and data migrations. Use this
  whenever someone needs to change existing MongoDB documents: backfilling a
  field added to a schema after data already existed (the classic "is_active is
  missing on old records so login fails" bug), renaming or dropping a field,
  reshaping stored data, or setting up migrations for an Express/Mongoose or
  NestJS/Mongoose project that has none. Also use it when they ask for a
  migration runner, a rollback command, a way to track which migrations ran, or
  say a Mongoose `default` did not apply to existing documents. Reach for this
  even when they only describe the symptom — "old users can't sign in since I
  added a field", "how do I update all existing records", "I need to undo that
  data change" — and not the words "migration" or "backfill".
---

# Mongoose migrations

Install a small migration system into a MongoDB/Mongoose project: apply pending
migrations, roll them back, preview them, generate backfills from a config file,
and log everything that ran. The file sources are at the bottom of this document
— create them verbatim.

The design rests on one idea: **the filesystem is the ledger.** A migration file
sitting in `scripts/migrations/` is pending. Once applied it moves into
`scripts/migrations/executed/` with the time it ran prefixed to its name.
Rolling back moves it out again. Nobody queries a database to see what state
things are in — `npm run migrate:status` answers it, and if the project is under
version control, `git log` answers when it changed.

## Installing

1. Create the files listed under [The files](#the-files) at those paths, keeping
   the folder layout:

   ```
   scripts/
   ├── migrate.js              apply pending migrations (or preview them)
   ├── rollback.js             undo applied migrations, newest first
   ├── status.js               what is applied, what is waiting
   ├── migration_utils.js      folder/ledger plumbing shared by all three
   ├── migration_logger.js     append-only run logs
   ├── migration_backup.js     records what a migration changed, so down() is precise
   ├── migration_db.js         how the commands connect
   ├── generator/
   │   ├── backfill_config.js  the file you edit: collections, fields, defaults
   │   └── generate.js         turns that config into a migration file
   └── migrations/
       ├── _example_backfill_user_is_active.js   worked example, never runs
       └── executed/           created on first apply, holds archived migrations
   ```

2. Add four npm scripts to `package.json`:

   ```json
   "migrate:generate": "node scripts/generator/generate.js",
   "migrate:status": "node scripts/status.js",
   "migrate": "node scripts/migrate.js",
   "migrate:rollback": "node scripts/rollback.js"
   ```

3. Point `scripts/migration_db.js` at the project's existing connection helper
   if it has one. Out of the box it connects with `process.env.MONGODB_URI`,
   which is fine for many projects, but reusing the app's helper means
   migrations connect with the same pool and TLS options the app uses. The
   commands only `await` it and never use the return value, so a helper that
   returns nothing is fine:

   ```js
   const connect_database = require('../src/config/database');
   module.exports = connect_database;
   ```

4. Confirm `mongoose` is a dependency. `dotenv` is used if present, skipped if
   not.

5. Check the install with `npm run migrate:status`. It reads folders only — no
   connection, no writes — so it is safe before anything else is configured, and
   on a fresh install prints zero applied and zero pending.

Nothing else is required: no module aliases, no new dependencies, no changes to
application code.

**Make sure `MONGODB_URI` is set, and set to what you mean.** Migrations read it
the same way the app does, from the environment or `.env`. The most expensive
mistake available here is running a migration against production while believing
it points at a local database — so read the connection line the commands print,
and if the project has several environment files, be explicit about which one is
loaded.

## Using it

```bash
npm run migrate:status             # what is applied, what is waiting
npm run migrate:generate           # turn backfill_config.js into a migration
MIGRATION_DRY_RUN=1 npm run migrate  # report what would change, write nothing
npm run migrate                    # apply everything pending
npm run migrate:rollback           # undo the most recent
npm run migrate:rollback -- 3      # undo the last three
npm run migrate:rollback -- --all  # undo everything
```

The `--` separates npm's arguments from the script's. yarn and pnpm forward
arguments differently; if a flag seems ignored, call the script directly:
`node scripts/rollback.js --all`.

### Generating a backfill

Most migrations in practice are "this field was added to the schema after data
existed, fill it in on the old documents". Edit
`scripts/generator/backfill_config.js`:

```js
module.exports = [
  { collection: 'users', fields: [{ name: 'is_active', default: true }] },
  {
    collection: 'products',
    fields: [
      { name: 'is_active', default: true },
      { name: 'stock_count', default: 0 },
    ],
  },
];
```

`npm run migrate:generate` writes `scripts/migrations/00N_backfill_defaults.js`
and prints what it contains. It applies nothing — review the file first.

Two things to get right in that config, because both fail quietly:

**`collection` is the MongoDB collection name, not the model name.** Mongoose
lowercases and pluralises by default (`User` → `users`, `CompanyAddress` →
`companyaddresses`), but a project can override it, and then the derived guess
matches zero documents without complaining. The authority is in the code: a
third argument to `mongoose.model('User', schema, 'app_users')`, or
`{ collection: 'app_users' }` in the schema options. Check those before trusting
the plural.

**Use the schema's own `default` as the backfill value.** The goal is that a
backfilled document becomes indistinguishable from one created after the change,
so read the schema and copy what it declares. It is tempting to reason about
what the value *ought* to be for old records — "these customers are
long-standing, so `is_verified: true`" — and that is how a backfill quietly
grants a hundred accounts a status they never earned.

### Before and after applying

Preview with `MIGRATION_DRY_RUN=1 npm run migrate`. Nothing is written, no
backup is saved, the file stays pending. This is the answer to "how many
documents will this actually touch?" — worth asking every time.

Afterwards, confirm in the terms the original problem was described in. If the
symptom was "old users don't show up", check that none are left:

```js
db.users.countDocuments({ is_active: { $exists: false } })   // expect 0
```

Then commit. The archive folder and the logs are the history, and they only
become a record once committed:

```bash
git add scripts/migrations && git commit -m "Run 001_backfill_defaults"
```

If the project is not under version control everything still works — the
commands never invoke git, and the log omits the revision field — but the ledger
then lives only on whichever machine ran the migration.

## Writing a migration by hand

Anything beyond "set a default" is a hand written file. Drop it in
`scripts/migrations/` with a numeric prefix (`002_rename_phone_field.js`) and
export `{ up, down }`. Both are async and receive a context:

```js
const up = async ({ collection, backup, dry_run }) => {
  const orders = collection('orders');
  const affected = await orders
    .find({ status: 'pending' }, { projection: { _id: 1 } })
    .toArray();

  const ids = affected.map((order) => order._id);

  if (dry_run) {
    console.log(`  would move ${ids.length} order(s) to awaiting_payment`);
    return;
  }

  await backup.save({ ids });

  const result = await orders.updateMany(
    { _id: { $in: ids } },
    { $set: { status: 'awaiting_payment' } },
  );

  console.log(`  moved ${result.modifiedCount} order(s) to awaiting_payment`);
};

const down = async ({ collection, backup }) => {
  const record = await backup.read();
  if (!record) throw new Error('no backup recorded, cannot revert precisely');

  await collection('orders').updateMany(
    { _id: { $in: record.ids } },
    { $set: { status: 'pending' } },
  );

  await backup.clear();
};

module.exports = { up, down };
```

A bare exported async function is treated as `up` alone. A migration without
`down` blocks `npm run migrate:rollback` — it refuses before touching anything
rather than moving files back and describing a state the database is not in.

### The context

| Field | What it is | When to use it |
| --- | --- | --- |
| `collection(name)` | Raw driver collection | The default. No schema validation, no `updated_at` stamp, no middleware — the migration changes exactly what it says. |
| `model(name)` | `mongoose.model(name)` | When validation or hooks are genuinely wanted. Requires the model to be registered — require the app's model index inside `migration_db.js`. |
| `backup` | `{ save, read, clear }` bound to this migration | Recording what changed so `down` is precise. |
| `dry_run` | `true` when `MIGRATION_DRY_RUN=1` | Reporting counts and returning before any write. |
| `mongoose` | The mongoose module | Building `ObjectId`s, checking connection state. |
| `connection` | `mongoose.connection` | Sessions and transactions. |

**Everything arrives as an argument — a migration imports nothing.** This is not
style. The file physically moves between `migrations/` and
`migrations/executed/`, so a relative `require('./helper')` resolves from
whichever folder it currently sits in and throws `Cannot find module` the moment
it is archived — which is to say exactly when a rollback is needed.

### Four rules that carry most of the value

**Record what you changed before you change it.** Once `is_active: true` is
written, the documents that were missing the field are indistinguishable from
the ones that always had it, and `down` would have to guess. `backup.save()`
stores a snapshot in a `migration_backups` collection keyed to the migration.
Save it even when the set is empty — the record's presence is how `down` tells
"nothing needed changing" from "this ran before backups were kept", and those
deserve different behaviour. `backup.save()` takes any JSON-serializable payload,
so a migration that destroys data should record the old values, not just ids.

**Honour `dry_run` before the first write.** The runner cannot enforce it,
because only the migration knows which of its operations write. Do the reads,
report the counts, return.

**Make `up` safe to run twice.** Scope the filter to documents that still need
the change (`$exists: false`, or a status not yet converted) rather than assuming
a single run. The archive folder usually guarantees that, but not on a host that
rebuilds the working tree from git on every deploy — see below.

**Print what actually happened.** Whatever a migration logs is captured into its
entry in `history.log`, so `moved 47 order(s) to awaiting_payment` becomes part
of the permanent record instead of terminal scrollback. Counts are what someone
wants weeks later when the numbers look wrong.

### Restoring absent and null exactly

`{ $exists: false }` and `null` are different states, and `$unset` collapses
them. If a migration treats both as "needs a value" — as backfills do — record
them separately so `down` puts each back the way it was:

```js
const absent_ids = documents.filter((d) => !('is_active' in d)).map((d) => d._id);
const null_ids = documents.filter((d) => d.is_active === null).map((d) => d._id);

await backup.save({ absent_ids, null_ids });
```

`down` then `$unset`s the first group and `$set`s `null` on the second. The
generated backfill does exactly this.

### Migrations that cannot be reversed

Some genuinely cannot: deleting documents outright, collapsing fields where the
split is unrecoverable, anything driven by an external system. Export only `up`.
Do not write a `down` that silently does nothing — the point of the folder ledger
is that it describes reality, and a no-op `down` claims a revert that never
happened. Omitting it makes rollback refuse with a clear message, which is
honest.

### Scale

The patterns above pull every matching `_id` into memory before updating: fine
for thousands of documents, a problem for millions. Past that, stream a cursor in
batches and log progress, and record a replayable filter rather than a list of
ids — a backup document is subject to MongoDB's 16MB limit, roughly a million
ObjectIds. Choose a filter that cannot drift, typically a timestamp cutoff
captured during `up`.

If the symptom that prompted the migration was slow or missing query results,
consider whether the field also wants an index. A backfill fixes the data, not
the query plan.

### Trying a migration before production

Running an untested `down` against real data is what this design exists to
avoid. In increasing order of fidelity: `MIGRATION_DRY_RUN=1` exercises `up`'s
filters against real data without writing; restoring a dump into a local
database and running the full apply/rollback/re-apply cycle tests everything for
real and is usually fastest; `mongodb-memory-server` suits a migration complex
enough to deserve a committed test — `build_context` is exported from
`migration_utils.js` precisely so a test can call `up` and `down` the way the
runner does.

Check that a document untouched by the migration is byte-identical before and
after a round trip. That is the property `down` is claiming.

### Ordering

Migrations apply oldest first and revert newest first, so a pair that depends on
each other unwinds the way it was applied. Within one migration touching several
collections, revert in reverse order too. Two migrations that must run together
are usually better as one file — splitting them lets someone roll back half a
change.

Prefer migrations that depend on nothing but the database. Application code moves
independently, and a migration that reads a model deleted three releases later
becomes unrunnable — including when it is needed to roll something back.

## The logs

`scripts/migrations/history.log` gets a block per run:

```
=== 2026-08-15T06:44:59Z migrate | db=shop@cluster0.abc.mongodb.net | node=v22.22.2 | git=9af5275 | by=dev@laptop
[2026-08-15T06:44:59Z] APPLY    001_backfill_defaults.js
    users.is_active: set on 2 of 2 document(s)
    OK in 143ms -> executed/2026-08-15T06-44-59Z__001_backfill_defaults.js
--- 2026-08-15T06:44:59Z migrate | applied 1 migration(s) in 210ms
```

The database and the git revision are what matter when a migration is questioned
later: which data it touched, and which version of the code touched it. Failures
are logged too — a failed migration is not archived, so without the log there
would be no trace it ran at all, even though it may have done partial work. Dry
runs are logged as `DRYRUN` so a preview is never mistaken for an apply.

`scripts/generator/generator.log` records generations the same way, including the
defaults each migration was born with, so an edited file can be compared against
what the generator produced.

## Ephemeral hosts

On Render, Heroku, Fly, and most container platforms the working tree is rebuilt
from git on every deploy, so anything the commands write to disk — the archive
move, both logs — is discarded with the container. An applied migration
reappears as pending on the next deploy and runs again, and the logs survive only
until then.

Two ways to live with it, both fine:

- **Run migrations locally against the remote database** and commit the archive
  move. The ledger is accurate and the deploy pipeline never runs migrations.
  Simplest, and what most small teams end up doing.
- **Run them on the host** (a pre-deploy or release command) and treat the
  archive as advisory. Idempotent `up` functions become load-bearing rather than
  a nicety.

`MIGRATION_LOG_FILE` points the history log at a mounted disk if the logs need to
outlive the container.

## Comments

Every comment sits **above the declaration it explains**, and none goes inside an object literal --
not inside a Joi schema object, a route handler's option object, an `Object.freeze`, a filter or an
update's `$set`. Those objects are data, and prose between their keys makes a reader step over it
to reach the next field.

Anything a key needs said about it belongs in the `/** */` block above the `const`, as prose keyed
by that key's name. Inside a **function body** a `//` note above the statement it explains is right
and expected -- that is code, not data.

This is the same rule `model-structure` states for a schema, `controller-structure` for a response
shape and `query-params` for a list config; it holds in every file of the project.

A migration's header block is where the reasoning goes, and it answers three questions nothing else
in the file can:

```js
/**
 * Backfills `is_active` on users written before the column existed.
 *
 * Why now: the login query filters on `is_active: true`, so every account
 * created before the field was added reads as inactive and cannot sign in.
 *
 * Scope: users where the field is missing entirely -- not users where it is
 * explicitly false, who were deactivated on purpose and must stay that way.
 *
 * Reversal: sets the field back to missing on exactly the ids this run
 * touched, so a rollback cannot revive an account somebody deactivated after
 * the migration ran.
 */
```

Never restate the mechanics: a note reading "update many" above `updateMany` earns nothing, while
"explicitly false is a deliberate deactivation, so the filter tests for missing rather than falsy"
earns its line.

## moment and lodash

Both are project dependencies (`moment ^2.30.1`, `lodash ^4.18.1`). Reach for them **whenever the
logic needs them** rather than hand-rolling the equivalent -- `moment` for every date computation
beyond passing a `Date` through, `lodash` for defensive access (`_.get`), key-set comparison
(`_.difference`), and coercion (`_.toNumber` then `_.isInteger`). Offsets and format strings come
from `@validators/constants`, never inlined.

Not where the language already reads better: `map`/`filter`/`find` on a plain array, optional
chaining rather than `_.get` on a value Joi already guaranteed, `Object.assign` rather than
`_.merge`.

This is the place it matters most, because a migration is the one script that runs against data
nobody is watching. A backfilled timestamp built from raw `Date` arithmetic is a wrong value in
every row at once, and a business-day boundary is IST-anchored here as everywhere else:

```js
const cutoff = moment(args.cutoff, moment.ISO_8601, true).utcOffset(app_time.UTC_OFFSET);
if (!cutoff.isValid()) throw new Error("cutoff is not a valid ISO 8601 date");
```

`lodash` earns its place reading documents whose shape is exactly what the migration is there to
fix: `_.get(doc, "address.zipcode")` cannot throw on a half-populated row, `_.isNil` separates
missing from explicitly false, and `_.chunk` keeps a large backfill to one batch at a time. Both
must already be dependencies of the target project -- a migration never adds one.

## When this is the wrong tool

If the project already uses `migrate-mongo`, `umzug`, or another migration tool,
extend that instead of installing a second ledger — two systems disagreeing about
what has been applied is worse than either alone.

If migrations must run automatically as several instances start at once, this
system has no locking: two instances could apply the same migration
concurrently. Idempotent `up` functions make that survivable, but a system with a
proper lock is a better fit.

## The files

Create these exactly as written. They are the whole system — no other dependencies, no changes to application code.

### `scripts/migration_utils.js`

```js
const fs = require('node:fs');
const path = require('node:path');

const mongoose = require('mongoose');

const { backup_for } = require('./migration_backup');

/**
 * Shared plumbing for the migration commands.
 *
 * A migration is pending while it sits directly in scripts/migrations, and
 * applied once it has been moved into scripts/migrations/executed with the UTC
 * time it ran prefixed to its name:
 *
 *   pending   scripts/migrations/001_backfill_user_is_active.js
 *   applied   scripts/migrations/executed/2026-08-15T05-45-12Z__001_backfill_user_is_active.js
 *
 * Rolling back runs the file's `down()` and moves it back, so the two folders
 * always describe the current state of the database.
 */

const scripts_directory = __dirname;
const migrations_directory = path.join(scripts_directory, 'migrations');
const executed_directory = path.join(migrations_directory, 'executed');
const generator_directory = path.join(scripts_directory, 'generator');

const history_log_file =
  process.env.MIGRATION_LOG_FILE ||
  path.join(migrations_directory, 'history.log');

const generator_log_file =
  process.env.MIGRATION_GENERATOR_LOG_FILE ||
  path.join(generator_directory, 'generator.log');

/**
 * A dry run reports what each migration would change and writes nothing: no
 * documents touched, no backup saved, no file archived. Migrations opt in by
 * checking `context.dry_run` -- the runner cannot enforce it, because only the
 * migration knows which of its own operations are writes.
 */
const dry_run = ['1', 'true', 'yes'].includes(
  String(process.env.MIGRATION_DRY_RUN).toLowerCase(),
);

const is_migration_file = (file_name) =>
  file_name.endsWith('.js') &&
  !file_name.startsWith('_') &&
  !file_name.startsWith('.');

// Directories are skipped, so scripts/migrations/executed never runs itself.
const read_directory = (directory) => {
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && is_migration_file(entry.name))
    .map((entry) => entry.name)
    .sort();
};

// Oldest first: the order they must be applied in.
const read_pending_migrations = () => read_directory(migrations_directory);

// Newest first: the order they must be reverted in.
const read_executed_migrations = () =>
  read_directory(executed_directory).reverse();

/**
 * A migration exports either an async function (apply only, not reversible) or
 * an object with an async `up` and, when it can be undone, an async `down`.
 */
const resolve_migration = (file_path, file_name) => {
  const migration = require(file_path);

  if (typeof migration === 'function') {
    return { up: migration, down: null };
  }

  if (migration && typeof migration.up === 'function') {
    return {
      up: migration.up,
      down: typeof migration.down === 'function' ? migration.down : null,
    };
  }

  throw new Error(
    `${file_name} must export an async function, or an object with an async up()`,
  );
};

/**
 * What `up` and `down` receive. Everything a migration needs arrives as an
 * argument rather than being imported, because a migration file moves between
 * folders as it is applied and rolled back -- a relative require would resolve
 * from wherever the file currently sits and break the moment it is archived.
 *
 * `migration_name` is the pending file name, without the archive timestamp, so
 * a backup saved by `up` is still found by `down` after the file has moved.
 */
const build_context = (migration_name) => ({
  mongoose,
  connection: mongoose.connection,
  collection: (name) => mongoose.connection.collection(name),
  model: (name) => mongoose.model(name),
  backup: backup_for(migration_name),
  dry_run,
});

// 2026-08-15T05:45:12.345Z -> 2026-08-15T05-45-12Z, safe on every filesystem
// and still sorting chronologically.
const build_timestamp = () =>
  new Date().toISOString().replace(/[:.]/g, '-').replace(/-\d{3}Z$/, 'Z');

// executed name -> the name the file had while pending.
const strip_timestamp = (executed_name) => {
  const separator = executed_name.indexOf('__');

  return separator === -1 ? executed_name : executed_name.slice(separator + 2);
};

const archive_migration = (file_name) => {
  fs.mkdirSync(executed_directory, { recursive: true });

  const executed_name = `${build_timestamp()}__${file_name}`;

  fs.renameSync(
    path.join(migrations_directory, file_name),
    path.join(executed_directory, executed_name),
  );

  return executed_name;
};

const restore_migration = (executed_name) => {
  const file_name = strip_timestamp(executed_name);

  fs.renameSync(
    path.join(executed_directory, executed_name),
    path.join(migrations_directory, file_name),
  );

  return file_name;
};

/**
 * Reads a positive count from the command line, so a rollback can revert more
 * than the most recent migration:
 *
 *   npm run migrate:rollback           the last one
 *   npm run migrate:rollback -- 3      the last three
 *   npm run migrate:rollback -- --all  every applied migration
 */
const parse_rollback_count = (argv, applied_total) => {
  const [value] = argv;

  if (!value) {
    return 1;
  }

  if (value === '--all') {
    return applied_total;
  }

  const count = Number(value);

  if (!Number.isInteger(count) || count < 1) {
    throw new Error(
      `Expected a positive whole number or --all, received "${value}"`,
    );
  }

  return Math.min(count, applied_total);
};

/**
 * Which database a run actually touched, for the log header. Read after
 * connecting, so a bad connection string never gets recorded as a real target.
 */
const describe_connection = () => {
  const { name, host } = mongoose.connection;

  return host ? `${name}@${host}` : name || 'unknown';
};

module.exports = {
  scripts_directory,
  migrations_directory,
  executed_directory,
  generator_directory,
  history_log_file,
  generator_log_file,
  dry_run,
  is_migration_file,
  read_pending_migrations,
  read_executed_migrations,
  resolve_migration,
  build_context,
  archive_migration,
  restore_migration,
  strip_timestamp,
  parse_rollback_count,
  describe_connection,
};
```

### `scripts/migration_backup.js`

```js
const mongoose = require('mongoose');

/**
 * A scratch collection migrations use to remember what they changed, so a
 * `down()` can put things back exactly as they were instead of guessing.
 *
 * The classic example is a backfill: once `is_active: true` is written, the
 * documents that were missing the field are indistinguishable from the ones
 * that always had it, and an unqualified `$unset` would wreck both. Recording
 * the ids before the write keeps the revert precise.
 *
 * This is deliberately not a model in the application's model folder. It is
 * migration bookkeeping, not application data, and nothing the app serves
 * should read it.
 *
 * A snapshot is one document, so it is bound by MongoDB's 16MB limit -- roughly
 * a million ObjectIds. A migration touching more rows than that should record a
 * filter it can replay instead of a list of ids.
 */

const COLLECTION_NAME = 'migration_backups';

const backup_collection = () => mongoose.connection.collection(COLLECTION_NAME);

const save_backup = async (migration_name, payload) => {
  await backup_collection().updateOne(
    { migration: migration_name },
    { $set: { migration: migration_name, payload, created_at: new Date() } },
    { upsert: true },
  );
};

const read_backup = async (migration_name) => {
  const backup = await backup_collection().findOne({
    migration: migration_name,
  });

  return backup ? backup.payload : null;
};

const clear_backup = async (migration_name) => {
  await backup_collection().deleteOne({ migration: migration_name });
};

/**
 * The three calls bound to one migration, handed to `up` and `down` as
 * `context.backup` so a migration never has to repeat its own name.
 */
const backup_for = (migration_name) => ({
  save: (payload) => save_backup(migration_name, payload),
  read: () => read_backup(migration_name),
  clear: () => clear_backup(migration_name),
});

module.exports = { save_backup, read_backup, clear_backup, backup_for };
```

### `scripts/migration_logger.js`

```js
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execSync } = require('node:child_process');

/**
 * Append only logging for the migration commands.
 *
 * `create_logger(file)` returns a logger writing to one file, so applying and
 * rolling back share scripts/migrations/history.log while the generator keeps
 * its own scripts/generator/generator.log.
 *
 * A run reads as a block: a header naming what ran and against which database,
 * one entry per file, and a footer with the outcome.
 *
 *   === 2026-08-15T06:50:12Z migrate | db=gestore@cluster0.mongodb.net |
 *       node=v22.22.2 | git=9af5275 | by=dhruv@macbook
 *   [2026-08-15T06:50:12Z] APPLY    001_backfill_defaults.js
 *       users.is_active: set on 2 of 2 document(s)
 *       OK in 143ms -> executed/2026-08-15T06-50-12Z__001_backfill_defaults.js
 *   --- 2026-08-15T06:50:13Z migrate | applied 1 migration(s) in 1.2s
 *
 * The database and the git revision are the two details worth having when a
 * migration is questioned weeks later: which data it touched, and which version
 * of the code did the touching. Anything a migration prints is captured into
 * its entry, so the counts it reports are part of the record rather than
 * scrollback.
 *
 * These files belong in git. On a host that rebuilds the working tree from git
 * each deploy they are lost with the rest of the filesystem, so treat a log
 * written there as console output that happens to persist until the next
 * deploy.
 */

// 2026-08-15T06:11:51.482Z -> 2026-08-15T06:11:51Z
const timestamp = () => new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

const format_duration = (milliseconds) =>
  milliseconds < 1000
    ? `${milliseconds}ms`
    : `${(milliseconds / 1000).toFixed(1)}s`;

// Which code ran the migration. Absent outside a checkout, which is fine.
const git_revision = () => {
  try {
    return execSync('git rev-parse --short HEAD', {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
  } catch {
    return null;
  }
};

/**
 * The context line for a run. `database` is passed in by the caller because
 * only it knows whether a connection was opened.
 */
const run_context = (database) =>
  [
    database && `db=${database}`,
    `node=${process.version}`,
    git_revision() && `git=${git_revision()}`,
    `by=${os.userInfo().username}@${os.hostname()}`,
  ]
    .filter(Boolean)
    .join(' | ');

const create_logger = (log_file) => {
  const append_lines = (lines) => {
    fs.mkdirSync(path.dirname(log_file), { recursive: true });
    fs.appendFileSync(log_file, `${lines.join('\n')}\n`, 'utf8');
  };

  /**
   * Starts an entry and begins collecting whatever the step prints. Every call
   * must be paired with finish_entry, which is what restores console.log.
   */
  const start_entry = (action, name) => {
    const captured = [];
    const original_log = console.log;

    console.log = (...args) => {
      captured.push(args.map(String).join(' ').trim());
      original_log(...args);
    };

    return {
      action,
      name,
      captured,
      started_at: Date.now(),
      restore: () => {
        console.log = original_log;
      },
    };
  };

  /**
   * Closes the entry, writes it, and returns how long the step took so the
   * caller can report the same number on the console.
   */
  const finish_entry = (entry, status, detail) => {
    entry.restore();

    const duration = Date.now() - entry.started_at;

    append_lines([
      `[${timestamp()}] ${entry.action.padEnd(8)} ${entry.name}`,
      ...entry.captured.filter(Boolean).map((line) => `    ${line}`),
      `    ${status} in ${format_duration(duration)}${detail ? ` -> ${detail}` : ''}`,
    ]);

    return duration;
  };

  const open_run = (command, database) => {
    append_lines([`=== ${timestamp()} ${command} | ${run_context(database)}`]);

    return { command, started_at: Date.now() };
  };

  const close_run = (run, outcome) => {
    append_lines([
      `--- ${timestamp()} ${run.command} | ${outcome} in ${format_duration(Date.now() - run.started_at)}`,
      '',
    ]);
  };

  return { log_file, open_run, close_run, start_entry, finish_entry };
};

module.exports = { create_logger, run_context, timestamp, format_duration };
```

### `scripts/migration_db.js`

```js
const mongoose = require('mongoose');

/**
 * How the migration commands reach the database.
 *
 * This is intentionally the smallest thing that works, so the scripts run in a
 * project that has no shared connection helper. If yours already has one --
 * `src/config/database.js`, `lib/db.js`, whatever it is called -- replace the
 * body with a call to it so migrations connect exactly the way the application
 * does, including any pool or TLS options:
 *
 *   const connect_database = require('../src/config/database');
 *   module.exports = connect_database;
 *
 * Models are only needed if a migration reaches for `context.model('User')`.
 * Requiring them through the app's own model index is the simplest way, and
 * costs nothing when a migration works through raw collections instead.
 */

const connect_database = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  await mongoose.connect(uri);

  return mongoose.connection;
};

module.exports = connect_database;
```

### `scripts/migrate.js`

```js
const path = require('node:path');

const mongoose = require('mongoose');

const connect_database = require('./migration_db');
const {
  migrations_directory,
  history_log_file,
  dry_run,
  read_pending_migrations,
  resolve_migration,
  build_context,
  archive_migration,
  describe_connection,
} = require('./migration_utils');
const { create_logger } = require('./migration_logger');

try {
  require('dotenv').config();
} catch {
  // dotenv is optional: the environment may already be populated.
}

/**
 * Applies every pending migration in scripts/migrations.
 *
 *   npm run migrate
 *
 * A file that finishes without throwing is moved into
 * scripts/migrations/executed and prefixed with the UTC time it ran, so the
 * folder doubles as the history of what has been applied. Undo the most recent
 * one with `npm run migrate:rollback`. Every run, successful or not, is also
 * appended to scripts/migrations/history.log.
 *
 * **Commit the move.** The history lives in git, not in the database, so the
 * record only survives if the rename and the log are committed after the run.
 * On a host that rebuilds the working tree from git on each deploy (Render,
 * Heroku, most container platforms) both are discarded, the file comes back as
 * pending, and it runs again on the next deploy -- which is why a migration
 * should still be written to be safe to repeat.
 *
 * Conventions for a migration file:
 *
 *   - It lives in scripts/migrations and ends in .js. A leading underscore or
 *     dot excludes a file, which is how a helper can sit beside them.
 *   - It exports `{ up, down }`, both async. `down` is optional but a migration
 *     without one cannot be rolled back. A bare exported function is treated as
 *     `up` alone.
 *   - Both receive a context -- `{ collection, model, backup, mongoose,
 *     connection }` -- rather than importing anything themselves, because the
 *     file moves between folders and a relative require would break once it is
 *     archived.
 *   - Whatever it prints is captured into the log entry for that file, so a
 *     migration should report what it actually changed.
 *   - Files apply in filename order, so a numeric prefix (001_, 002_, ...)
 *     fixes the order when one migration depends on another.
 *
 * The first failure stops the run and exits non-zero, and the file that failed
 * stays pending so it is retried next time. A deploy wired to this command
 * fails loudly instead of starting on half-migrated data.
 */

const logger = create_logger(history_log_file);

const run_migrations = async () => {
  const migration_files = read_pending_migrations();

  if (!migration_files.length) {
    console.log('No pending migrations in scripts/migrations.');
    return;
  }

  await connect_database();

  if (dry_run) {
    console.log('DRY RUN: reporting what would change, writing nothing.\n');
  }

  const run = logger.open_run(
    dry_run ? 'migrate (dry run)' : 'migrate',
    describe_connection(),
  );

  for (const file_name of migration_files) {
    const { up } = resolve_migration(
      path.join(migrations_directory, file_name),
      file_name,
    );

    console.log(`> ${file_name}`);

    const entry = logger.start_entry(dry_run ? 'DRYRUN' : 'APPLY', file_name);
    let executed_name;

    try {
      // Sequential on purpose: a later migration may depend on an earlier one.
      // eslint-disable-next-line no-await-in-loop
      await up(build_context(file_name));

      // Only reached when the migration resolved, so a failure leaves the file
      // pending. A dry run never archives: nothing was applied.
      executed_name = dry_run ? null : archive_migration(file_name);
    } catch (error) {
      logger.finish_entry(entry, 'FAILED', error.message);
      logger.close_run(run, `stopped at ${file_name}`);
      throw error;
    }

    const duration = logger.finish_entry(
      entry,
      'OK',
      executed_name ? `executed/${executed_name}` : 'still pending (dry run)',
    );

    console.log(
      executed_name
        ? `  applied in ${duration}ms, archived as executed/${executed_name}`
        : `  dry run finished in ${duration}ms, still pending`,
    );
  }

  if (dry_run) {
    logger.close_run(run, `dry ran ${migration_files.length} migration(s)`);

    console.log(
      `\nDry run only. Nothing was written. Re-run without MIGRATION_DRY_RUN to apply.`,
    );
    return;
  }

  logger.close_run(run, `applied ${migration_files.length} migration(s)`);

  console.log(
    `Applied ${migration_files.length} migration(s). Logged to ${logger.log_file}`,
  );
  console.log('Commit scripts/migrations to record them.');
};

run_migrations()
  .catch((error) => {
    console.error(`Migration failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
```

### `scripts/rollback.js`

```js
const path = require('node:path');

const mongoose = require('mongoose');

const connect_database = require('./migration_db');
const {
  executed_directory,
  history_log_file,
  read_executed_migrations,
  resolve_migration,
  build_context,
  restore_migration,
  strip_timestamp,
  parse_rollback_count,
  describe_connection,
} = require('./migration_utils');
const { create_logger } = require('./migration_logger');

try {
  require('dotenv').config();
} catch {
  // dotenv is optional: the environment may already be populated.
}

/**
 * Reverts applied migrations, most recent first, by running each file's
 * `down()`.
 *
 *   npm run migrate:rollback           undo the last migration
 *   npm run migrate:rollback -- 3      undo the last three
 *   npm run migrate:rollback -- --all  undo everything
 *
 * A reverted file moves back out of scripts/migrations/executed under its
 * original name, so it shows up as pending again and `npm run migrate` will
 * re-apply it. Each revert is appended to scripts/migrations/history.log, which
 * is what leaves a trace that a migration was undone at all -- the folders only
 * ever show the current state.
 *
 * A migration that exports no `down` cannot be reverted. The run stops before
 * touching it rather than moving the file back and leaving the database in a
 * state the folders no longer describe.
 */

const logger = create_logger(history_log_file);

const rollback_migrations = async () => {
  const executed_files = read_executed_migrations();

  if (!executed_files.length) {
    console.log('No applied migrations in scripts/migrations/executed.');
    return;
  }

  const count = parse_rollback_count(
    process.argv.slice(2),
    executed_files.length,
  );
  const targets = executed_files.slice(0, count);

  // Checked up front so a partial rollback cannot stop halfway through the
  // batch on a migration that was never reversible.
  const resolved = targets.map((executed_name) => {
    const file_name = strip_timestamp(executed_name);
    const migration = resolve_migration(
      path.join(executed_directory, executed_name),
      file_name,
    );

    if (!migration.down) {
      throw new Error(
        `${file_name} exports no down(), so it cannot be rolled back`,
      );
    }

    return { executed_name, file_name, down: migration.down };
  });

  await connect_database();

  const run = logger.open_run('rollback', describe_connection());

  for (const target of resolved) {
    console.log(`< ${target.executed_name}`);

    const entry = logger.start_entry('ROLLBACK', target.executed_name);

    try {
      // The pending name, not the archived one, so the backup `up` saved under
      // that name is the one `down` reads.
      // eslint-disable-next-line no-await-in-loop
      await target.down(build_context(target.file_name));

      // Only reached when the revert resolved, so a failure leaves the file
      // marked as applied.
      restore_migration(target.executed_name);
    } catch (error) {
      logger.finish_entry(entry, 'FAILED', error.message);
      logger.close_run(run, `stopped at ${target.executed_name}`);
      throw error;
    }

    const duration = logger.finish_entry(
      entry,
      'OK',
      `${target.file_name} is pending again`,
    );

    console.log(
      `  reverted in ${duration}ms, ${target.file_name} is pending again`,
    );
  }

  logger.close_run(run, `reverted ${resolved.length} migration(s)`);

  console.log(
    `Reverted ${resolved.length} migration(s). Logged to ${logger.log_file}`,
  );
  console.log('Commit scripts/migrations to record them.');
};

rollback_migrations()
  .catch((error) => {
    console.error(`Rollback failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
```

### `scripts/status.js`

```js
const {
  read_pending_migrations,
  read_executed_migrations,
  strip_timestamp,
} = require('./migration_utils');

/**
 * Prints what has been applied and what is waiting.
 *
 *   npm run migrate:status
 *
 * This reads the folders only -- no database connection, no writes -- so it is
 * always safe to run, including against a project whose MONGODB_URI is not set.
 * The archive folder is the ledger, so the folders are the answer.
 */

const format_applied = (executed_name) => {
  const [timestamp] = executed_name.split('__');

  // 2026-08-15T06-44-59Z -> 2026-08-15 06:44:59 UTC
  const readable = timestamp.replace(
    /^(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})Z$/,
    '$1 $2:$3:$4 UTC',
  );

  return `${strip_timestamp(executed_name).padEnd(40)} applied ${readable}`;
};

const applied = read_executed_migrations().reverse(); // oldest first, as applied
const pending = read_pending_migrations();

console.log(`Applied (${applied.length})`);
applied.forEach((name) => console.log(`  ${format_applied(name)}`));
if (!applied.length) console.log('  none');

console.log(`\nPending (${pending.length})`);
pending.forEach((name) => console.log(`  ${name}`));
if (!pending.length) console.log('  none');

if (pending.length) {
  console.log('\nPreview with: MIGRATION_DRY_RUN=1 npm run migrate');
}
```

### `scripts/generator/backfill_config.js`

```js
/**
 * Fields to backfill on existing documents.
 *
 * Edit this list, then run `npm run migrate:generate` to turn it into a
 * migration file under scripts/migrations. Apply it with `npm run migrate`.
 *
 * Each entry is a MongoDB **collection** name, not a model name -- the
 * lowercase plural Mongoose actually creates: `User` -> `users`,
 * `CompanyAddress` -> `companyaddresses`. Check with `show collections` in
 * mongosh if you are unsure.
 *
 * A field is only written where it is missing or null, so documents that
 * already hold a value (including `false`) are never touched.
 *
 * The generated migration embeds a frozen copy of this list, so editing the
 * file afterwards has no effect on migrations that were already generated.
 * That is deliberate: an applied migration has to keep describing what it
 * actually did.
 *
 * Supported defaults are anything JSON can hold -- strings, numbers, booleans,
 * null, arrays, plain objects. A default that has to be computed (a date, an
 * id, a value derived from the document) needs a hand written migration.
 */

module.exports = [
  {
    collection: 'users',
    fields: [{ name: 'is_active', default: true }],
  },

  // Add as many collections and fields as you need:
  //
  // {
  //   collection: 'products',
  //   fields: [
  //     { name: 'is_active', default: true },
  //     { name: 'stock_count', default: 0 },
  //     { name: 'tags', default: [] },
  //   ],
  // },
];
```

### `scripts/generator/generate.js`

```js
const fs = require('node:fs');
const path = require('node:path');

const backfill_config = require('./backfill_config');
const {
  migrations_directory,
  generator_log_file,
  read_pending_migrations,
  read_executed_migrations,
  strip_timestamp,
} = require('../migration_utils');
const { create_logger } = require('../migration_logger');

/**
 * Turns scripts/generator/backfill_config.js into a migration file.
 *
 *   npm run migrate:generate
 *
 * Everything the generator owns lives in this folder: the config you edit, this
 * script, and generator.log recording what was generated and when. The output
 * does not stay here -- a generated file is written into scripts/migrations
 * alongside hand written ones, so there is a single ordered sequence, a single
 * archive, and a single apply/rollback pipeline.
 *
 * The generated file is ordinary code with `up` and `down`, no different from
 * one written by hand -- read it, edit it, delete it. Nothing reads the config
 * again at run time: the targets are baked into the file so an applied
 * migration keeps describing what it actually did, however the config changes
 * afterwards.
 *
 * Generating does not apply anything. Run `npm run migrate` when the file looks
 * right.
 */

const logger = create_logger(generator_log_file);

const validate_config = (config) => {
  if (!Array.isArray(config) || !config.length) {
    throw new Error(
      'scripts/generator/backfill_config.js must export a non-empty array',
    );
  }

  return config.flatMap((entry, entry_index) => {
    const where = `entry ${entry_index + 1}`;

    if (!entry?.collection || typeof entry.collection !== 'string') {
      throw new Error(`${where}: "collection" must be a non-empty string`);
    }

    if (!Array.isArray(entry.fields) || !entry.fields.length) {
      throw new Error(`${where}: "fields" must be a non-empty array`);
    }

    return entry.fields.map((field, field_index) => {
      const field_where = `${where}, field ${field_index + 1}`;

      if (!field?.name || typeof field.name !== 'string') {
        throw new Error(`${field_where}: "name" must be a non-empty string`);
      }

      // `false`, `0` and `null` are all legitimate defaults, so the key has to
      // be present rather than truthy.
      if (!('default' in field)) {
        throw new Error(
          `${field_where}: "default" is required (use null if the field should be set to null)`,
        );
      }

      const default_value = field.default;

      if (typeof default_value === 'function' || default_value === undefined) {
        throw new Error(
          `${field_where}: a computed default cannot be generated, write that migration by hand`,
        );
      }

      if (default_value instanceof Date) {
        throw new Error(
          `${field_where}: a Date default cannot be generated, write that migration by hand`,
        );
      }

      return {
        collection: entry.collection,
        field: field.name,
        default_value,
      };
    });
  });
};

// Continues the 001_, 002_, ... sequence across both pending and applied files.
const next_sequence_number = () => {
  const names = [
    ...read_pending_migrations(),
    ...read_executed_migrations().map(strip_timestamp),
  ];

  const highest = names.reduce((carry, name) => {
    const [, digits] = name.match(/^(\d+)_/) || [];

    return digits ? Math.max(carry, Number(digits)) : carry;
  }, 0);

  return String(highest + 1).padStart(3, '0');
};

const build_migration_source = (targets) => `/**
 * Generated by \`npm run migrate:generate\` from
 * scripts/generator/backfill_config.js.
 *
 * Sets a default on documents written before the field existed. A Mongoose
 * \`default\` only applies when a document is created, so older documents have
 * no key at all and any query filtering on the field skips them.
 *
 * Only documents where the field is missing or null are touched, which makes
 * \`up\` safe to run more than once. The collections are reached through the raw
 * driver rather than a model, so no schema validation or \`updated_at\` stamp is
 * applied -- the backfill leaves every other field exactly as it was.
 */

// Frozen at generation time. Editing the config does not change this list.
const targets = ${JSON.stringify(targets, null, 2)};

const missing_field = (field) => ({
  $or: [{ [field]: { $exists: false } }, { [field]: null }],
});

const up = async ({ collection, backup, dry_run }) => {
  const applied = [];

  for (const target of targets) {
    const documents = await collection(target.collection)
      .find(missing_field(target.field), {
        projection: { _id: 1, [target.field]: 1 },
      })
      .toArray();

    const label = \`\${target.collection}.\${target.field}\`;

    // Absent and null are restored differently, so they are recorded
    // separately: \`down\` unsets the first group and writes null back to the
    // second, leaving both exactly as they were.
    const absent_ids = documents
      .filter((document) => !(target.field in document))
      .map((document) => document._id);
    const null_ids = documents
      .filter((document) => document[target.field] === null)
      .map((document) => document._id);
    const total = absent_ids.length + null_ids.length;

    if (dry_run) {
      console.log(
        \`  \${label}: would set on \${total} document(s) (\${absent_ids.length} missing, \${null_ids.length} null)\`,
      );
      continue;
    }

    applied.push({
      collection: target.collection,
      field: target.field,
      absent_ids,
      null_ids,
    });

    // Recorded before the write: once the field is set these documents are
    // indistinguishable from ones created with it, and a crash mid-update
    // would otherwise leave nothing for \`down\` to work from. Saved even when
    // empty, so \`down\` can tell "nothing needed changing" from "this ran
    // before backups were kept".
    await backup.save({ applied });

    if (!total) {
      console.log(\`  \${label}: nothing to backfill\`);
      continue;
    }

    const result = await collection(target.collection).updateMany(
      { _id: { $in: [...absent_ids, ...null_ids] } },
      { $set: { [target.field]: target.default_value } },
    );

    console.log(
      \`  \${label}: set on \${result.modifiedCount} of \${total} document(s)\`,
    );
  }
};

const down = async ({ collection, backup }) => {
  const record = await backup.read();

  if (!record) {
    // Stripping the field from every document holding the default would hit
    // ones written since, so the rollback stops rather than guessing.
    throw new Error(
      'no backup recorded, so the documents this migration changed cannot be identified',
    );
  }

  // Reverse order, so a migration whose targets depend on each other unwinds
  // the way it was applied.
  for (const target of [...record.applied].reverse()) {
    const label = \`\${target.collection}.\${target.field}\`;
    const documents = collection(target.collection);
    let reverted = 0;

    if (target.absent_ids.length) {
      const result = await documents.updateMany(
        { _id: { $in: target.absent_ids } },
        { $unset: { [target.field]: '' } },
      );

      reverted += result.modifiedCount;
    }

    if (target.null_ids.length) {
      const result = await documents.updateMany(
        { _id: { $in: target.null_ids } },
        { $set: { [target.field]: null } },
      );

      reverted += result.modifiedCount;
    }

    console.log(
      reverted
        ? \`  \${label}: reverted \${reverted} document(s)\`
        : \`  \${label}: nothing to revert\`,
    );
  }

  await backup.clear();
};

module.exports = { up, down };
`;

const generate = () => {
  const targets = validate_config(backfill_config);
  const file_name = `${next_sequence_number()}_backfill_defaults.js`;
  const file_path = path.join(migrations_directory, file_name);

  if (fs.existsSync(file_path)) {
    throw new Error(`${file_name} already exists`);
  }

  // Each target is printed rather than just counted, so the log records the
  // defaults a migration was generated with even if the file is later edited.
  targets.forEach((target) => {
    console.log(
      `  ${target.collection}.${target.field} -> ${JSON.stringify(target.default_value)}`,
    );
  });

  fs.mkdirSync(migrations_directory, { recursive: true });
  fs.writeFileSync(file_path, build_migration_source(targets), 'utf8');

  return file_name;
};

const run = logger.open_run('generate', null);
const entry = logger.start_entry('GENERATE', 'backfill_config.js');

try {
  const file_name = generate();

  logger.finish_entry(entry, 'OK', `scripts/migrations/${file_name}`);
  logger.close_run(run, `generated ${file_name}`);

  console.log(`Created scripts/migrations/${file_name}`);
  console.log(`Logged to ${logger.log_file}`);
  console.log('Review it, then apply with: npm run migrate');
} catch (error) {
  logger.finish_entry(entry, 'FAILED', error.message);
  logger.close_run(run, 'generated nothing');

  console.error(`Generate failed: ${error.message}`);
  process.exitCode = 1;
}
```

### `scripts/migrations/_example_backfill_user_is_active.js`

```js
/**
 * A worked example of a hand written migration. The leading underscore keeps
 * the runner from picking it up -- copy it to `001_something.js` (no
 * underscore) to make a real one, or delete this file.
 *
 * The case it covers is the most common reason to need a migration at all:
 * a field was added to a schema after data already existed. A Mongoose
 * `default` is only applied when a document is created, so older documents have
 * no key at all, and any query filtering on that field silently skips them --
 * users vanish from sign in, from listings, from soft delete.
 *
 * Note what `up` and `down` receive. Nothing is imported: the context carries
 * `collection`, `model`, `backup`, `mongoose` and `connection`. That is because
 * this file moves between scripts/migrations and scripts/migrations/executed as
 * it is applied and rolled back, so a relative require would resolve from
 * whichever folder it currently sits in and break the moment it is archived.
 */

// A soft deleted user holds an explicit `false` and is left alone.
const missing_is_active = {
  $or: [{ is_active: { $exists: false } }, { is_active: null }],
};

/**
 * Idempotent: a second run matches nothing, because every document it touched
 * now holds a real boolean. Worth preserving even with the archive folder
 * tracking what ran -- on a host that rebuilds the working tree from git each
 * deploy, the archive is discarded and this runs again.
 */
const up = async ({ collection, backup, dry_run }) => {
  const users = collection('users');

  const affected = await users
    .find(missing_is_active, { projection: { _id: 1 } })
    .toArray();

  const ids = affected.map((user) => user._id);

  // Honouring dry_run is the migration's job, not the runner's: only this file
  // knows which of its operations are writes. Report and stop before any.
  if (dry_run) {
    console.log(`  would backfill is_active on ${ids.length} user document(s)`);
    return;
  }

  // Written before the update, and written even when empty. Once the field is
  // set these documents look identical to users created after the schema
  // change, so `down` has no way to tell them apart without this list -- and
  // the presence of the record, empty or not, is how `down` knows the migration
  // ran under a version that kept one.
  await backup.save({ ids });

  if (!ids.length) {
    console.log('  no user documents need an is_active backfill');
    return;
  }

  const result = await users.updateMany(
    { _id: { $in: ids } },
    { $set: { is_active: true } },
  );

  console.log(
    `  backfilled is_active on ${result.modifiedCount} of ${ids.length} user document(s)`,
  );
};

/**
 * Removes the field again from exactly the documents `up` wrote to. Users
 * created after the migration keep their `is_active`, and so does anyone
 * deactivated in the meantime.
 *
 * One simplification worth knowing about: `up` treats a missing field and an
 * explicit `null` the same, and this `$unset` collapses both to missing. If
 * that distinction matters in your data, record the two groups separately --
 * see "Restoring absent and null exactly" in references/writing_migrations.md,
 * which is what the generated backfill does.
 */
const down = async ({ collection, backup }) => {
  const record = await backup.read();

  if (!record) {
    // No record at all: this was applied by a version that did not keep one.
    // Stripping `is_active` from every user holding `true` would hit accounts
    // created since, so the rollback stops instead of guessing.
    throw new Error(
      'no backup recorded, so the documents this migration changed cannot be identified',
    );
  }

  if (!record.ids.length) {
    console.log('  nothing was backfilled, nothing to revert');
    await backup.clear();
    return;
  }

  const result = await collection('users').updateMany(
    { _id: { $in: record.ids } },
    { $unset: { is_active: '' } },
  );

  await backup.clear();

  console.log(
    `  removed is_active from ${result.modifiedCount} of ${record.ids.length} user document(s)`,
  );
};

module.exports = { up, down };
```
