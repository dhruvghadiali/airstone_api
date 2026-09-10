/**
 * The user helper's constants, in one place.
 *
 * Other folders import from here. Files inside `src/helpers/user/constants`
 * import each other directly, never through this file.
 */
const {
  user_response,
  USER_SELECT,
} = require("@helpers/user/constants/user_response");

module.exports = { user_response, USER_SELECT };
