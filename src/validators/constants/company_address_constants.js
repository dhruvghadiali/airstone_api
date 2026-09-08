/**
 * The bounds and formats a company address is held to.
 *
 * `ADDRESS_MAX` is generous because the field holds a whole postal address as
 * one block -- building, street, area and city -- rather than a single line.
 *
 * The PIN code format is not here. A PIN code is the same six digits wherever
 * an address is stored, so it lives in `validation_patterns` in `common`.
 * `PINCODE_LENGTH` stays, because the model and the messages both need to name
 * the figure.
 */
const company_address_validation_limits = Object.freeze({
  ADDRESS_MIN: 3,
  ADDRESS_MAX: 500,
  PINCODE_LENGTH: 6,
});

module.exports = { company_address_validation_limits };
