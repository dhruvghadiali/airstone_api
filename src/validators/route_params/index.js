/**
 * The barrel every route param schema is imported through.
 *
 * Empty until the first entity with a `:id` route lands. A new schema is added
 * as `src/validators/route_params/<entity>_id_params_validator.js` and
 * re-exported here, so a router imports one name from one place regardless of
 * how many entities exist.
 */
module.exports = {};
