const {
  raw_material_stock_entry_bill_validation_limits,
} = require("@validators/constants/raw_material_stock_entry_bill_constants");

/**
 * `NOT_FOUND` and `INVALID_ID` address one bill inside a stock entry. Each bill
 * carries its own `_id`, so an endpoint can update or remove a single bill
 * without rewriting the list.
 *
 * `BILL_DATE_AFTER_ENTRY` is a rule about one field given another: a bill cannot
 * be dated after the consignment it arrived with. A schema validator sees one
 * value at a time and cannot check it, so the stock entry helper does.
 */
const raw_material_stock_entry_bill_messages = Object.freeze({
  ADDED: "Bill added successfully",
  UPDATED: "Bill updated successfully",
  DELETED: "Bill deleted successfully",
  NOT_FOUND: "Bill not found on this stock entry",
  INVALID_ID: "Invalid bill id",
});

const raw_material_stock_entry_bill_validation_messages = Object.freeze({
  BILL_BASE: "Bills must be a list of bills",
  BILL_NUMBER_REQUIRED: "Bill number is required",
  BILL_NUMBER_BASE: "Bill number must be a string",
  BILL_NUMBER_EMPTY: "Bill number cannot be empty",
  BILL_NUMBER_MIN: `Bill number must be at least ${raw_material_stock_entry_bill_validation_limits.BILL_NUMBER_MIN} characters`,
  BILL_NUMBER_MAX: `Bill number must not exceed ${raw_material_stock_entry_bill_validation_limits.BILL_NUMBER_MAX} characters`,
  BILL_DATE_REQUIRED: "Bill date is required",
  BILL_DATE_BASE: "Bill date must be a date",
  BILL_DATE_INVALID: "Bill date must be a valid date",
  BILL_DATE_AFTER_ENTRY: "Bill date cannot be after the stock entry date",
  BILL_AMOUNT_REQUIRED: "Bill amount is required",
  BILL_AMOUNT_BASE: "Bill amount must be a number",
  BILL_AMOUNT_MIN: `Bill amount must be at least ${raw_material_stock_entry_bill_validation_limits.BILL_AMOUNT_MIN}`,
  BILL_AMOUNT_MAX: `Bill amount must not exceed ${raw_material_stock_entry_bill_validation_limits.BILL_AMOUNT_MAX}`,
  BILL_AMOUNT_PRECISION: `Bill amount must not have more than ${raw_material_stock_entry_bill_validation_limits.BILL_AMOUNT_DECIMAL_PLACES} decimal places`,
  FILE_URL_BASE: "Bill file link must be a string",
  FILE_URL_EMPTY: "Bill file link cannot be empty",
  FILE_URL_MIN: `Bill file link must be at least ${raw_material_stock_entry_bill_validation_limits.FILE_URL_MIN} characters`,
  FILE_URL_MAX: `Bill file link must not exceed ${raw_material_stock_entry_bill_validation_limits.FILE_URL_MAX} characters`,
  UNKNOWN_FIELD: "Bill contains an unsupported field",
});

module.exports = {
  raw_material_stock_entry_bill_messages,
  raw_material_stock_entry_bill_validation_messages,
};
