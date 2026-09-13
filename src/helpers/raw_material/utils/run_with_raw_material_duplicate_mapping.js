const {
  map_raw_material_duplicate_error,
} = require("@helpers/raw_material/utils/map_raw_material_duplicate_error");

/**
 * Runs a raw material write and rewrites a duplicate key failure into a
 * conflict a caller can act on.
 *
 * Wrap any write that can trip the material code's unique index, so the caller
 * sees a 409 naming the code they have already used instead of a raw driver
 * error.
 *
 * That index is global and deletes here are soft, so a deactivated material
 * keeps its code reserved. A caller re-entering a code that looks free to them
 * is the case this wording exists for.
 *
 * @param   {Function} operation  The write to run. Receives no arguments.
 * @returns {Promise<*>} Whatever the write returned.
 * @throws  {app_error} 409 `CODE_EXISTS` when the write hit the unique index.
 * @throws  {Error} Any other failure, unchanged.
 */
const run_with_raw_material_duplicate_mapping = async (operation) => {
  try {
    return await operation();
  } catch (error) {
    throw map_raw_material_duplicate_error(error);
  }
};

module.exports = { run_with_raw_material_duplicate_mapping };
