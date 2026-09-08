require('module-alias/register');
require('dotenv').config();

const path = require('node:path');

const mongoose = require('mongoose');

const connect_database = require('@config/database');
const {
  migrations_directory,
  history_log_file,
  read_pending_migrations,
  resolve_migration,
  archive_migration,
  describe_connection,
} = require('./migration_utils');
const { create_logger } = require('./migration_logger');

/**
 * Applies every pending migration in scripts/migrations against the database
 * named by MONGODB_URI.
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
 * On a host that rebuilds the working tree from git on each deploy (Render, for
 * one) both are discarded, the file comes back as pending, and it runs again on
 * the next deploy -- which is why a migration should still be written to be
 * safe to repeat.
 *
 * Conventions for a migration file:
 *
 *   - It lives in scripts/migrations and ends in .js. A leading underscore or
 *     dot excludes a file, which is how a shared helper can sit beside them.
 *   - It exports `{ up, down }`, both async and taking no arguments. `down` is
 *     optional but a migration without one cannot be rolled back. A bare
 *     exported function is treated as `up` alone.
 *   - The connection is already open when they are called, so a migration only
 *     uses the models. Shared helpers are reached through the `@scripts` alias,
 *     never a relative path, because the file moves between folders.
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

  const run = logger.open_run('migrate', describe_connection());

  for (const file_name of migration_files) {
    const { up } = resolve_migration(
      path.join(migrations_directory, file_name),
      file_name,
    );

    console.log(`> ${file_name}`);

    const entry = logger.start_entry('APPLY', file_name);
    let executed_name;

    try {
      // Sequential on purpose: a later migration may depend on an earlier one.
      // eslint-disable-next-line no-await-in-loop
      await up();

      // Only reached when the migration resolved, so a failure leaves the file
      // pending.
      executed_name = archive_migration(file_name);
    } catch (error) {
      logger.finish_entry(entry, 'FAILED', error.message);
      logger.close_run(run, `stopped at ${file_name}`);
      throw error;
    }

    const duration = logger.finish_entry(
      entry,
      'OK',
      `executed/${executed_name}`,
    );

    console.log(
      `  applied in ${duration}ms, archived as executed/${executed_name}`,
    );
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
