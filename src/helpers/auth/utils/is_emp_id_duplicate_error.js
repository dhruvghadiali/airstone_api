const _ = require("lodash");

/**
 * Tells whether a failed write is two signups landing on the same employee id.
 *
 * Callers use this to tell that one clash apart from every other write failure,
 * because it is the server's own doing and can be retried with a freshly read
 * counter. A clashing email or username is the caller's to fix and must not be
 * retried.
 *
 * Both driver shapes are checked because a write that fails before the rejected
 * value is echoed back reports only `keyPattern`. `keyValue` is spelled the
 * driver's way on purpose -- it is a field on the error object, not one of this
 * project's own names, so snake_casing it would match nothing.
 *
 * @param   {Error} error  The error a write threw.
 * @returns {boolean} True only for a duplicate key error naming `emp_id`.
 */
const is_emp_id_duplicate_error = (error) =>
  _.get(error, "code") === 11000 &&
  Boolean(
    _.get(error, "keyPattern.emp_id") || _.get(error, "keyValue.emp_id"),
  );

module.exports = { is_emp_id_duplicate_error };
