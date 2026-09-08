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
 * This is deliberately not a model under src/. It is migration bookkeeping, not
 * application data, and nothing the API serves should read it.
 *
 * Migrations reach it as `@scripts/migration_backup` rather than by relative
 * path, because a migration file moves between scripts/migrations and
 * scripts/migrations/executed as it is applied and rolled back. A relative
 * require resolves from whichever folder the file currently sits in, so it
 * would break the moment the file is archived.
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
  const backup = await backup_collection().findOne({ migration: migration_name });

  return backup ? backup.payload : null;
};

const clear_backup = async (migration_name) => {
  await backup_collection().deleteOne({ migration: migration_name });
};

module.exports = { save_backup, read_backup, clear_backup };
