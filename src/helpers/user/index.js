/**
 * Everything the user feature offers, in one import.
 *
 * This is the only path other features use: `require("@helpers/user")`. Reaching
 * past it into `constants/` or `db/` from outside this folder is not allowed, so
 * a file can move between them without breaking a caller.
 *
 *   constants/  the columns a user row answers with
 *   db/         the scoped soft delete both delete routes run
 *
 * There is no `utils/` yet, and it is not missing by oversight. Listing users is
 * a plain `find()` the shared list query builder already expresses, so the
 * feature has no pure logic of its own to keep. An empty barrel would be noise;
 * add the folder the day there is a function to put in it.
 *
 * These live here rather than in `@helpers/common` because only the user
 * controllers read them. `auth` keeps its own signin and signup shapes for the
 * same reason -- they describe a different moment in the same collection's life.
 */
const { deactivate_user } = require("@helpers/user/db");
const { user_response, USER_SELECT } = require("@helpers/user/constants");

module.exports = { deactivate_user, user_response, USER_SELECT };
