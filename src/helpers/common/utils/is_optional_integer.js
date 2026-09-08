/**
 * `Number.isInteger` for a field that is allowed to be empty.
 *
 * `Number.isInteger` alone is right for a required count, but on an optional one
 * it rejects the field's own default: `Number.isInteger(null)` is false, so a
 * column storing null when nobody gave a quantity would fail validation for
 * being empty rather than for being fractional. Whether empty is acceptable is
 * the field's `required` rule to decide, not this one's.
 *
 * @param   {*} value  The value a schema is validating.
 * @returns {boolean} True for a whole number, null or undefined.
 */
const is_optional_integer = (value) =>
  value === null || value === undefined || Number.isInteger(value);

module.exports = { is_optional_integer };
