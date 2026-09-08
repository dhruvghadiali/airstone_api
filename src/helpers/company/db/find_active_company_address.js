const mongoose = require("mongoose");

const { company_address_model } = require("@models/company");

/**
 * Reads an active company address, and the company that owns it, in one query.
 *
 * This returns the document rather than a boolean because a contact write asks
 * two questions about the same address -- is it real and active, and does it
 * belong to the company named in the same body -- and one lookup can answer
 * both. A boolean helper would leave the caller fetching the row again to
 * compare the owner.
 *
 * Like every lookup here it runs in the controller, before the write, for the
 * import cycle reason set out in `is_active_company_exists`.
 *
 * @param   {string} value  The address id to read.
 * @returns {Promise<{_id: object, company: object}|null>} The address with its
 *          owning company, or null when the id is empty, malformed, unknown or
 *          belongs to a deactivated address.
 */
const find_active_company_address = async (value) => {
  // A null/undefined value is left to the field's own `required` rule.
  if (!value) {
    return null;
  }

  // Reject malformed ids before touching the database.
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return null;
  }

  const address = await company_address_model
    .findById(value)
    .select("company is_active")
    .lean();

  if (!address || !address.is_active) {
    return null;
  }

  return address;
};

module.exports = { find_active_company_address };
