/**
 * Values the projection utils are built on.
 */

/**
 * The columns a projection always keeps, whatever a response config lists.
 *
 * `_id` identifies the row the caller just wrote, so it is never something a
 * config has to remember to list.
 *
 * `id` rides along for the models that serialise with `virtuals: true`, where
 * mongoose puts it in `toJSON` on the way out. A read applies its projection in
 * the query and is handed `id` regardless, so leaving it out here would make it
 * the one field that appears when an entity is read and vanishes when the same
 * entity is written. Models without the virtual have nothing to pick.
 *
 * @type {string[]}
 */
const ALWAYS_INCLUDED = ["_id", "id"];

module.exports = { ALWAYS_INCLUDED };
