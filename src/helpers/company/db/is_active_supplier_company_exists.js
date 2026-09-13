const mongoose = require("mongoose");

const { supplier_company_types } = require("@enums");
const { company_model } = require("@models/company");

/**
 * Checks that a reference points at a company we buy from, and that it is still
 * active.
 *
 * A plain query a controller runs before a write, not a Mongoose validator. The
 * import cycle reason is set out in `is_active_company_exists`, beside this
 * file.
 *
 * It reads `company_type` as well as `is_active`, because a firm we only sell
 * stone to cannot supply us raw material. `supplier_company_types` is the set
 * that may, and it holds `both` as well as `supplier`.
 *
 * It sits with the company helpers rather than with the feature that calls it,
 * next to the lookup it is a stricter version of. Which company types can
 * supply is a fact about companies.
 *
 * The cost is that a reference is only guaranteed on the paths that call this.
 * A migration, a script or a future endpoint writing a supplier list has to
 * check it too.
 *
 * @param   {string} value  The id to check.
 * @returns {Promise<boolean>} False when the id is empty, malformed, unknown,
 *                             belongs to a deactivated company, or belongs to a
 *                             company we only sell to. A caller cannot tell
 *                             those five apart.
 */
const is_active_supplier_company_exists = async (value) => {
  // A null/undefined value is left to the field's own `required` rule.
  if (!value) {
    return false;
  }

  // Reject malformed ids before touching the database.
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return false;
  }

  const company = await company_model
    .findById(value)
    .select("is_active company_type")
    .lean();

  return Boolean(
    company &&
    company.is_active &&
    supplier_company_types.includes(company.company_type),
  );
};

module.exports = { is_active_supplier_company_exists };
