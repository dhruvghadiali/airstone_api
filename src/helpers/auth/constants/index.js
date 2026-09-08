/**
 * The auth helper's constants, in one place.
 *
 * Other folders import from here. Files inside `src/helpers/auth/constants`
 * import each other directly, never through this file.
 */
const { auth_response } = require("@helpers/auth/constants/auth_response");
const { CREDENTIAL_SELECT } = require("@helpers/auth/constants/auth_constants");

module.exports = { auth_response, CREDENTIAL_SELECT };
