/**
 * The bounds the vehicle on a stock entry is held to.
 *
 * The driver's mobile number is not here. A phone number is a phone number
 * whether a user, a company or a lorry driver holds it, so its length comes from
 * `user_validation_limits` and its format from `validation_patterns` in
 * `common`. See the header of `company_constants.js`, which says the same about
 * a company's phone.
 *
 * `NUMBER_MAX` is generous for a registration plate. A plate is copied off the
 * lorry by hand and sometimes arrives with the state name spelled out.
 */
const raw_material_stock_entry_vehicle_validation_limits = Object.freeze({
  NUMBER_MIN: 5,
  NUMBER_MAX: 50,
  OWNER_NAME_MIN: 2,
  OWNER_NAME_MAX: 200,
  DRIVER_NAME_MIN: 2,
  DRIVER_NAME_MAX: 200,
});

module.exports = { raw_material_stock_entry_vehicle_validation_limits };
