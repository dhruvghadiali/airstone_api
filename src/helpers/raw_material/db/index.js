/**
 * The raw material helper's database reads. Everything in here touches the raw
 * materials collection.
 *
 * Other folders import from this file. Files inside
 * `src/helpers/raw_material/db` import each other directly, never through this
 * file.
 */
const {
  find_active_raw_material,
} = require("@helpers/raw_material/db/find_active_raw_material");

module.exports = { find_active_raw_material };
