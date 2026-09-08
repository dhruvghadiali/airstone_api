/**
 * Values shared across the common helpers.
 *
 * Other folders import from here. Files inside `src/helpers/common/constants`
 * import each other directly, never through this file.
 */
const {
  PAISA_IN_RUPEE,
  PERCENT_BASE,
} = require("@helpers/common/constants/number_constants");

module.exports = { PAISA_IN_RUPEE, PERCENT_BASE };
