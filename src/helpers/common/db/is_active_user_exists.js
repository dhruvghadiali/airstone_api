const mongoose = require("mongoose");

const { user_model } = require("@models/user");

/**
 * Checks that a reference points at a user who exists and is still active.
 *
 * A plain query a controller runs before a write, not a Mongoose validator.
 * Keeping these out of the schemas is what lets this file import its model at
 * the top like every other file: a model that verified its own references would
 * have to import this helper, and the two would then import each other. Node
 * resolves that cycle by handing one of them a half built module, which fails
 * either at boot or on the first request.
 *
 * The cost is that a reference is only guaranteed on the paths that call this.
 * A migration, a script or a future endpoint writing the same column has to
 * check it too.
 *
 * @param   {string} value  The id to check.
 * @returns {Promise<boolean>} False when the id is empty, malformed, unknown or
 *                             belongs to a deactivated user.
 */
const is_active_user_exists = async (value) => {
  // A null/undefined value is left to the field's own `required` rule.
  if (!value) {
    return false;
  }

  // Reject malformed ids before touching the database.
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return false;
  }

  const user = await user_model.findById(value).select("is_active").lean();

  return Boolean(user && user.is_active);
};

module.exports = { is_active_user_exists };
