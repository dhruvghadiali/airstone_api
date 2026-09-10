/**
 * Every validation limit, pattern and default, in one import.
 *
 * A number or a regex that a model, a validator and a message all have to agree
 * on lives here, so the three read one value instead of carrying three copies
 * that drift. That is why `user_validation_limits.USERNAME_MAX` appears in the
 * schema, in the Joi field and inside the message a caller is shown.
 *
 * Values only one helper reads do not belong here -- those live in that
 * helper's own `constants/` folder. The test is whether a second layer needs
 * the same value.
 *
 * Other folders import from this file. Files inside `src/validators/constants`
 * import each other directly -- `user_constants` reads `app_time` from
 * `common` -- never through it.
 */
const {
  app_time,
  financial_year,
  money_precision,
  pagination_defaults,
  sort_order,
  sort_defaults,
  validation_limits,
  validation_patterns,
} = require("@validators/constants/common");
const {
  list_query_limits,
  list_query_error_codes,
} = require("@validators/constants/list_query_constants");
const {
  PASSWORD_SALT_ROUNDS,
  DEFAULT_USER_PASSWORD,
  emp_id_generation,
  user_validation_limits,
  user_validation_patterns,
} = require("@validators/constants/user_constants");
const {
  company_contact_validation_limits,
} = require("@validators/constants/company_contact_constants");
const {
  company_validation_limits,
  company_validation_patterns,
} = require("@validators/constants/company_constants");
const {
  company_address_validation_limits,
} = require("@validators/constants/company_address_constants");

const {
  raw_material_validation_limits,
  raw_material_validation_patterns,
} = require("@validators/constants/raw_material_constants");

const {
  raw_material_purchase_validation_limits,
} = require("@validators/constants/raw_material_purchase_constants");
const {
  raw_material_purchase_payment_validation_limits,
} = require("@validators/constants/raw_material_purchase_payment_constants");

const {
  raw_material_stock_entry_validation_limits,
} = require("@validators/constants/raw_material_stock_entry_constants");
const {
  raw_material_stock_entry_bill_validation_limits,
} = require("@validators/constants/raw_material_stock_entry_bill_constants");
const {
  raw_material_stock_entry_vehicle_validation_limits,
} = require("@validators/constants/raw_material_stock_entry_vehicle_constants");

module.exports = {
  app_time,
  financial_year,
  money_precision,
  PASSWORD_SALT_ROUNDS,
  DEFAULT_USER_PASSWORD,
  emp_id_generation,
  pagination_defaults,
  sort_order,
  sort_defaults,
  validation_limits,
  validation_patterns,
  list_query_limits,
  list_query_error_codes,
  user_validation_limits,
  user_validation_patterns,
  company_validation_limits,
  company_validation_patterns,
  company_contact_validation_limits,
  company_address_validation_limits,
  raw_material_validation_limits,
  raw_material_validation_patterns,
  raw_material_purchase_validation_limits,
  raw_material_purchase_payment_validation_limits,
  raw_material_stock_entry_validation_limits,
  raw_material_stock_entry_bill_validation_limits,
  raw_material_stock_entry_vehicle_validation_limits,
};
