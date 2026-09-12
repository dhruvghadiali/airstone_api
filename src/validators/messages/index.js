/**
 * Every message a caller can be shown, in one import.
 *
 * Wording lives here and nowhere else, so a message is never a string literal
 * in a controller, a model or a validator. Two shapes are exported per feature:
 * `<feature>_messages` for what an endpoint says when it succeeds or fails, and
 * `<feature>_validation_messages` for what one field says when it is wrong.
 *
 * `sort_field_message` is a function rather than a constant, because the
 * message has to name the columns the resource allows and those are only known
 * once a list config is in hand.
 *
 * Other folders import from this file. Files inside `src/validators/messages`
 * import each other directly, never through it.
 */
const { error_messages } = require("@validators/messages/error_message");
const {
  sort_field_message,
  list_query_validation_messages,
} = require("@validators/messages/list_query_message");
const {
  user_messages,
  user_validation_messages,
} = require("@validators/messages/user_message");
const {
  company_messages,
  company_validation_messages,
} = require("@validators/messages/company_message");
const {
  company_contact_messages,
  company_contact_validation_messages,
} = require("@validators/messages/company_contact_message");
const {
  company_address_messages,
  company_address_validation_messages,
} = require("@validators/messages/company_address_message");

const {
  raw_material_messages,
  raw_material_validation_messages,
} = require("@validators/messages/raw_material_message");

const {
  raw_material_purchase_messages,
  raw_material_purchase_validation_messages,
} = require("@validators/messages/raw_material_purchase_message");
const {
  raw_material_purchase_payment_messages,
  raw_material_purchase_payment_validation_messages,
} = require("@validators/messages/raw_material_purchase_payment_message");

const {
  raw_material_stock_entry_messages,
  raw_material_stock_entry_validation_messages,
} = require("@validators/messages/raw_material_stock_entry_message");
const {
  raw_material_stock_entry_bill_messages,
  raw_material_stock_entry_bill_validation_messages,
} = require("@validators/messages/raw_material_stock_entry_bill_message");
const {
  raw_material_stock_entry_vehicle_validation_messages,
} = require("@validators/messages/raw_material_stock_entry_vehicle_message");

const {
  manufacturing_product_messages,
  manufacturing_product_validation_messages,
} = require("@validators/messages/manufacturing_product_message");
const {
  manufacturing_product_raw_material_messages,
  manufacturing_product_raw_material_validation_messages,
} = require("@validators/messages/manufacturing_product_raw_material_message");

const {
  manufacturing_log_messages,
  manufacturing_log_validation_messages,
} = require("@validators/messages/manufacturing_log_message");
const {
  manufacturing_log_raw_material_messages,
  manufacturing_log_raw_material_validation_messages,
} = require("@validators/messages/manufacturing_log_raw_material_message");

module.exports = {
  error_messages,
  sort_field_message,
  list_query_validation_messages,
  user_messages,
  user_validation_messages,
  company_messages,
  company_validation_messages,
  company_contact_messages,
  company_contact_validation_messages,
  company_address_messages,
  company_address_validation_messages,
  raw_material_messages,
  raw_material_validation_messages,
  raw_material_purchase_messages,
  raw_material_purchase_validation_messages,
  raw_material_purchase_payment_messages,
  raw_material_purchase_payment_validation_messages,
  raw_material_stock_entry_messages,
  raw_material_stock_entry_validation_messages,
  raw_material_stock_entry_bill_messages,
  raw_material_stock_entry_bill_validation_messages,
  raw_material_stock_entry_vehicle_validation_messages,
  manufacturing_product_messages,
  manufacturing_product_validation_messages,
  manufacturing_product_raw_material_messages,
  manufacturing_product_raw_material_validation_messages,
  manufacturing_log_messages,
  manufacturing_log_validation_messages,
  manufacturing_log_raw_material_messages,
  manufacturing_log_raw_material_validation_messages,
};
