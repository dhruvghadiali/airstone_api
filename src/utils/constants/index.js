/**
 * Values the utils share.
 *
 * Other folders import from here. Files inside `src/utils/constants` import
 * each other directly, never through this file.
 */
const {
  ALWAYS_INCLUDED,
} = require("@utils/constants/projection_constants");

module.exports = { ALWAYS_INCLUDED };
