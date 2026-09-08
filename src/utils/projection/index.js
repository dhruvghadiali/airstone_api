/**
 * Narrowing a document, or an aggregation stage, down to the columns a response
 * config names.
 *
 * Other folders import from this file: `require("@utils/projection")`.
 * Files inside `src/utils/projection` import each other directly, never through
 * this file.
 *
 * `to_paths` is deliberately not re-exported. It is the shared reader both
 * functions below are built on, and it is of no use on its own.
 */
const { project } = require("@utils/projection/project");
const { to_projection } = require("@utils/projection/to_projection");

module.exports = { project, to_projection };
