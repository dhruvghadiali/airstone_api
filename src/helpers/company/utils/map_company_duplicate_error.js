const app_error = require("@middlewares/app_error");

const { http_status } = require("@enums");
const { company_messages } = require("@validators/messages");

/**
 * The wording for each column a company can clash on.
 *
 * `gst_number` and `pan_number` are the two unique indexes on the collection.
 * Naming them separately matters because a caller who typed one of them wrongly
 * needs to know which of the two to fix, and both numbers look alike enough to
 * be confused.
 */
const duplicate_messages = Object.freeze({
  gst_number: company_messages.GST_NUMBER_EXISTS,
  pan_number: company_messages.PAN_NUMBER_EXISTS,
});

/**
 * Turns a duplicate key error into a conflict worded for a company, and returns
 * anything else untouched.
 *
 * A unique index is a database constraint, not a Mongoose validator, so a clash
 * arrives as a bare driver error. The generic handler answers it with wording
 * that belongs to no entity in particular. This says which company column was
 * already taken.
 *
 * Anything that is not an 11000, and any 11000 that names no column, is returned
 * as it came, so the error handler still classifies it. An 11000 naming nothing
 * is not something a caller can act on, so it is not dressed up as fixable.
 *
 * @param   {Error} error  The error a write threw.
 * @returns {Error|app_error} A 409 `app_error` for a named duplicate, otherwise
 *                            the original error.
 */
const map_company_duplicate_error = (error) => {
  if (error?.code !== 11000) {
    return error;
  }

  // `keyValue` carries the values the driver actually rejected; `keyPattern` is
  // the fallback for the writes that report only the index definition.
  const fields = Object.keys(error.keyValue || error.keyPattern || {});

  if (!fields.length) {
    return error;
  }

  return new app_error(
    http_status.CONFLICT,
    company_messages.ALREADY_EXISTS,
    fields.map((field) => ({
      field,
      message: duplicate_messages[field] || company_messages.ALREADY_EXISTS,
      type: "duplicate_value",
    })),
  );
};

module.exports = { map_company_duplicate_error };
