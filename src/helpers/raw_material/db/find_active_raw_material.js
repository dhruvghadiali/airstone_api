const mongoose = require("mongoose");

const { raw_material_model } = require("@models/raw_material");

/**
 * Finds a raw material that exists and is still active.
 *
 * Returns the row rather than a boolean, because a caller that needs to know a
 * material is real usually needs something off it in the same breath. The
 * purchase controller wants its `unit`, so proving the reference and reading the
 * unit is one query instead of two.
 *
 * A plain query a controller runs before a write, not a Mongoose validator.
 * Keeping these out of the schemas is what lets this file import its model at
 * the top like every other file: a model that verified its own references would
 * have to import this helper, and the two would then import each other. Node
 * resolves that cycle by handing one of them a half built module, which fails
 * either at boot or on the first request.
 *
 * The cost is that a reference is only guaranteed on the paths that call this.
 * A migration, a script or a future endpoint writing `material` on a purchase or
 * a stock entry has to check it too.
 *
 * @param   {string} value  The id to check.
 * @returns {Promise<import("mongoose").Document|null>} The material, or null
 *          when the id is empty, malformed, unknown or names a deactivated one.
 *          A caller cannot tell those apart, and does not need to.
 */
const find_active_raw_material = async (value) => {
  // A null/undefined value is left to the field's own `required` rule.
  if (!value) {
    return null;
  }

  // Reject malformed ids before touching the database.
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return null;
  }

  const raw_material = await raw_material_model
    .findById(value)
    .select("unit is_active")
    .lean();

  return raw_material?.is_active ? raw_material : null;
};

module.exports = { find_active_raw_material };
