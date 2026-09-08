/**
 * The bounds a company contact is held to.
 *
 * The contact's phone number format is not here. It is the same ten digit
 * number a user's is, so the model reads `validation_patterns` in `common`. Its
 * length still comes from `user_validation_limits`.
 *
 * `NAME_MIN` and `NAME_MAX` cover the whole name in one field. A contact is
 * written down the way they introduce themselves. Splitting that into a first
 * and a last name invents a structure the caller does not have.
 */
const company_contact_validation_limits = Object.freeze({
  NAME_MIN: 2,
  NAME_MAX: 100,
});

module.exports = { company_contact_validation_limits };
