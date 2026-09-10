/**
 * Everything the user feature offers, in one import.
 *
 * This is the only path other features use: `require("@helpers/user")`. Reaching
 * past it into `constants/` from outside this folder is not allowed, so a file
 * can move between folders without breaking a caller.
 *
 *   constants/  the columns a user row answers with
 *
 * There is no `db/` and no `utils/` yet, and neither is missing by oversight.
 * Listing users is a plain `find()` the shared list query builder already
 * expresses, so the feature has nothing of its own to query and no logic of its
 * own to keep. An empty barrel would be noise; add either folder the day there
 * is a function to put in it.
 *
 * These live here rather than in `@helpers/common` because only the user
 * controllers read them. `auth` keeps its own signin and signup shapes for the
 * same reason -- they describe a different moment in the same collection's life.
 */
const { user_response, USER_SELECT } = require("@helpers/user/constants");

module.exports = { user_response, USER_SELECT };
