/**
 * The user model, behind one import: `require("@models/user")`.
 *
 * Every model gets its own folder, so a model that later grows companion files
 * -- its own sub-schemas, static queries, a seed -- has somewhere to put them
 * without the top of `models/` filling up with loose files.
 *
 * Other folders import from this file. Files inside `src/models/user` import
 * each other directly, never through it.
 */
const user_model = require("@models/user/user_model");

module.exports = { user_model };
