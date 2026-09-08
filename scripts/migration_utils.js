const fs = require('node:fs');
const path = require('node:path');

/**
 * Shared plumbing for `npm run migrate` and `npm run migrate:rollback`.
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

const migrations_directory = path.join(__dirname, 'migrations');
const executed_directory = path.join(migrations_directory, 'executed');
const generator_directory = path.join(__dirname, 'generator');

const history_log_file =
  process.env.MIGRATION_LOG_FILE ||
  path.join(migrations_directory, 'history.log');

const generator_log_file =
  process.env.MIGRATION_GENERATOR_LOG_FILE ||
  path.join(generator_directory, 'generator.log');

/**
 * Which database a run actually touched, for the log header. Read after
 * connecting, so a bad MONGODB_URI never gets recorded as a real target.
 */
const describe_connection = () => {
  const mongoose = require('mongoose');
  const { name, host } = mongoose.connection;

  return host ? `${name}@${host}` : name || 'unknown';
};

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
const read_executed_migrations = () => read_directory(executed_directory).reverse();

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

// 2026-08-15T05:45:12.345Z -> 2026-08-15T05-45-12Z, safe on every filesystem
// and still sorting chronologically.
const build_timestamp = () =>
  new Date().toISOString().replace(/[:.]/g, '-').replace(/-\d{3}Z$/, 'Z');

// executed name -> the name the file had while pending.
const strip_timestamp = (executed_name) => {
  const separator = executed_name.indexOf('__');

  return separator === -1
    ? executed_name
    : executed_name.slice(separator + 2);
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
    throw new Error(`Expected a positive whole number or --all, received "${value}"`);
  }

  return Math.min(count, applied_total);
};

module.exports = {
  migrations_directory,
  executed_directory,
  generator_directory,
  history_log_file,
  generator_log_file,
  describe_connection,
  is_migration_file,
  read_pending_migrations,
  read_executed_migrations,
  resolve_migration,
  archive_migration,
  restore_migration,
  strip_timestamp,
  parse_rollback_count,
};
