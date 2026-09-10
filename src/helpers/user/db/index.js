/**
 * The user helper's database writes. Everything in here touches the `users`
 * collection.
 *
 * Other folders import from this file. Files inside `src/helpers/user/db` import
 * each other directly, never through this file.
 */
const { deactivate_user } = require("@helpers/user/db/deactivate_user");

module.exports = { deactivate_user };
