/**
 * Builds a validator that accepts a number carrying no more decimal places than
 * allowed.
 *
 * Used for prices and percentages, where 199.505 sits inside every numeric bound
 * a schema declares and is still not a storable amount.
 *
 * Safe as a Mongoose validator because it is a pure function of its own field:
 * no database, no other field, no request.
 *
 * @param   {number} max_decimal_places  Digits allowed after the point.
 * @returns {Function} A validator taking the value and returning a boolean.
 */
const is_within_decimal_places = (max_decimal_places) => (value) => {
  // An optional field arrives as null when unset. Whether that is acceptable is
  // the field's own `required` rule to decide, not this validator's.
  if (value === null || value === undefined) {
    return true;
  }

  // Number.isFinite rejects NaN and Infinity. Both survive a numeric min/max
  // bound, because every comparison against NaN is false and Infinity is only
  // caught by the upper bound.
  if (!Number.isFinite(value)) {
    return false;
  }

  const text_value = String(value);

  // Numbers below 1e-6 stringify to exponent notation ("1e-7"), which has no
  // visible decimal point and would otherwise read as zero decimal places. A
  // value that small already carries more precision than any allowed place
  // count, so it is rejected outright.
  if (text_value.includes("e") || text_value.includes("E")) {
    return false;
  }

  // Reading the digits off the string form is exact. Multiplying by a power of
  // ten is not: 19.99 * 100 is 1998.9999999999998 in floating point, which
  // would fail a whole-number check that ought to pass.
  const [, decimals = ""] = text_value.split(".");

  return decimals.length <= max_decimal_places;
};

module.exports = { is_within_decimal_places };
