const {
  map_user_duplicate_error,
} = require("@helpers/auth/utils/map_user_duplicate_error");

/**
 * Runs a user write and rewrites a duplicate key failure into a conflict a
 * caller can act on.
 *
 * Wrap any write that can trip one of the user's unique indexes, so the caller
 * sees a 409 worded for an account instead of a raw driver error.
 *
 * @param   {Function} operation  The write to run. Receives no arguments.
 * @returns {Promise<*>} Whatever the write returned.
 * @throws  {app_error} 409 `ALREADY_EXISTS` when the write hit a unique index.
 * @throws  {Error} Any other failure, unchanged.
 */
const run_with_user_duplicate_mapping = async (operation) => {
  try {
    return await operation();
  } catch (error) {
    throw map_user_duplicate_error(error);
  }
};

module.exports = { run_with_user_duplicate_mapping };
