const app_error = require("@middlewares/app_error");

const { http_status } = require("@enums");
const { raw_material_messages } = require("@validators/messages");

/**
 * Turns a duplicate key error into a conflict worded for a raw material, and
 * returns anything else untouched.
 *
 * A unique index is a database constraint, not a Mongoose validator, so a clash
 * arrives as a bare driver error. The generic handler answers it with wording
 * that belongs to no entity in particular. This says the material code is
 * already taken.
 *
 * `material_code` is the collection's only unique index. An 11000 naming
 * anything else is an index this function does not know about, so it is
 * returned as it came and the error handler still classifies it. The same goes
 * for an 11000 that names no column: it is not something a caller can act on,
 * so it is not dressed up as fixable.
 *
 * @param   {Error} error  The error a write threw.
 * @returns {Error|app_error} A 409 `app_error` for a duplicate material code,
 *                            otherwise the original error.
 */
const map_raw_material_duplicate_error = (error) => {
  if (error?.code !== 11000) {
    return error;
  }

  // `keyValue` carries the values the driver actually rejected; `keyPattern` is
  // the fallback for the writes that report only the index definition.
  const fields = Object.keys(error.keyValue || error.keyPattern || {});

  if (!fields.includes("material_code")) {
    return error;
  }

  return new app_error(
    http_status.CONFLICT,
    raw_material_messages.CODE_EXISTS,
    [
      {
        field: "material_code",
        message: raw_material_messages.CODE_EXISTS,
        type: "duplicate_value",
      },
    ],
  );
};

module.exports = { map_raw_material_duplicate_error };
