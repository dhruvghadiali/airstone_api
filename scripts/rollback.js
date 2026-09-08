require('module-alias/register');
require('dotenv').config();

const path = require('node:path');

const mongoose = require('mongoose');

const connect_database = require('@config/database');
const {
  executed_directory,
  history_log_file,
  read_executed_migrations,
  resolve_migration,
  restore_migration,
  strip_timestamp,
  parse_rollback_count,
  describe_connection,
} = require('./migration_utils');
const { create_logger } = require('./migration_logger');

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
 * ever show the current state. As with applying, the move and the log entry
 * become the record once they are committed.
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

  const count = parse_rollback_count(process.argv.slice(2), executed_files.length);
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
      // eslint-disable-next-line no-await-in-loop
      await target.down();

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
