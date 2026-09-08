const { to_paths } = require("@utils/projection/to_paths");

/**
 * Turns a response config's select string into the inclusion map an aggregation
 * `$project` stage wants.
 *
 * An aggregation has no `select` and no `populate`, so a pipeline that returns
 * an entity has to name its columns by hand -- and a hand-written `$project` is
 * exactly where a pipeline drifts away from the config every other endpoint
 * serialises through. Passing the same constant through this keeps the two in
 * step.
 *
 * `_id` is not added here the way `project` adds it: an aggregation returns
 * `_id` unless a stage removes it, and forcing it back in would override a
 * pipeline that dropped it on purpose.
 *
 * @param   {string} select  The `select` from the feature's response config.
 * @returns {Object} Each named column mapped to 1. Empty when nothing was
 *                   given, which a `$project` stage would reject -- so a caller
 *                   with no select should not add the stage at all.
 */
const to_projection = (select) =>
  Object.fromEntries(to_paths(select).map((path) => [path, 1]));

module.exports = { to_projection };
