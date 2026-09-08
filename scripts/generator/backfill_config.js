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

module.exports = [];
