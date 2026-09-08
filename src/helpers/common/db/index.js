/**
 * Reference checks any feature can run before a write.
 *
 * One file per lookup, named after the question it answers. A lookup that only
 * one feature will ever need belongs in that feature's own `db/` folder instead.
 *
 * Other folders import from this file. Files inside `src/helpers/common/db`
 * import each other directly, never through this file.
 */
const {
  is_active_user_exists,
} = require("@helpers/common/db/is_active_user_exists");

module.exports = { is_active_user_exists };
