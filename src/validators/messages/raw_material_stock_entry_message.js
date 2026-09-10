const { qa_failure_reason, raw_material_unit_of_measure } = require("@enums");
const {
  raw_material_stock_entry_validation_limits,
} = require("@validators/constants/raw_material_stock_entry_constants");

/**
 * The accepted units and QA failure reasons, spelled the way a caller should
 * send them.
 *
 * Both are built from their enums rather than typed out, so adding or removing a
 * value updates these messages on their own.
 */
const units_of_measure = Object.values(raw_material_unit_of_measure).join(", ");

const qa_failure_reasons = Object.values(qa_failure_reason).join(", ");

/**
 * `QR_CODE_EXISTS` is what a duplicate key on the QR code should be reported as.
 * Without it the error handler falls back to `error_messages.DUPLICATE_VALUE`,
 * which does not say that the code was already scanned onto another consignment.
 *
 * `UPDATE_MIN` is what an empty PATCH body is answered with. A request that
 * names no field is a call that would do nothing, and saying so beats a 200 that
 * changed nothing.
 *
 * `REASON_REQUIRED`, `REASON_NOT_ALLOWED`, `RECEIVED_BEFORE_ENTRY`,
 * `UNLOADED_BEFORE_RECEIVED`, `TESTED_BEFORE_UNLOADED`, `UNIT_MISMATCH`,
 * `PURCHASE_ORDERS_SUPPLIER_MISMATCH`, `PURCHASE_ORDERS_MATERIAL_MISMATCH` and
 * `USED_BEFORE_QA_PASS` are all rules about one field given another. A schema
 * validator sees one value at a time and cannot check any of them, so the stock
 * entry helper does, and these are what it reports.
 *
 * `MATERIAL_INVALID`, `SUPPLIER_INVALID`, `PURCHASE_ORDER_INVALID` and the four
 * `*_BY_INVALID` keys are what a reference is reported as when it does not point
 * at an active row. The controller raises them before the write.
 */
const raw_material_stock_entry_messages = Object.freeze({
  CREATED: "Stock entry created successfully",
  FETCHED: "Stock entry fetched successfully",
  LISTED: "Stock entries fetched successfully",
  UPDATED: "Stock entry updated successfully",
  DELETED: "Stock entry deleted successfully",
  RECEIVED: "Stock entry marked as received",
  UNLOADED: "Stock entry marked as unloaded",
  TESTED: "Stock entry quality test recorded",
  NOT_FOUND: "Stock entry not found",
  QR_CODE_EXISTS: "This QR code is already on another stock entry",
  INVALID_ID: "Invalid stock entry id",
});

const raw_material_stock_entry_validation_messages = Object.freeze({
  VEHICLE_REQUIRED: "Vehicle details are required",
  MATERIAL_REQUIRED: "Material is required",
  MATERIAL_BASE: "Material must be a string",
  MATERIAL_INVALID: "Material must reference an active raw material",
  SUPPLIER_REQUIRED: "Supplier is required",
  SUPPLIER_BASE: "Supplier must be a string",
  SUPPLIER_INVALID: "Supplier must reference an active company",
  PURCHASE_ORDERS_REQUIRED: "At least one purchase order is required",
  PURCHASE_ORDERS_BASE: "Purchase orders must be a list of purchase order ids",
  PURCHASE_ORDERS_ITEM_BASE: "Each purchase order must be a string",
  PURCHASE_ORDERS_MIN: `A stock entry needs at least ${raw_material_stock_entry_validation_limits.PURCHASE_ORDERS_MIN_ITEMS} purchase order`,
  PURCHASE_ORDER_INVALID:
    "Purchase order must reference an active raw material purchase",
  PURCHASE_ORDERS_SUPPLIER_MISMATCH:
    "Every purchase order must belong to the supplier on this stock entry",
  PURCHASE_ORDERS_MATERIAL_MISMATCH:
    "Every purchase order must be for the material on this stock entry",
  QTY_REQUIRED: "Quantity is required",
  QTY_BASE: "Quantity must be a number",
  QTY_MIN: `Quantity must be at least ${raw_material_stock_entry_validation_limits.QTY_MIN}`,
  QTY_MAX: `Quantity must not exceed ${raw_material_stock_entry_validation_limits.QTY_MAX}`,
  UNIT_REQUIRED: "Unit is required",
  UNIT_BASE: "Unit must be a string",
  UNIT_EMPTY: "Unit cannot be empty",
  UNIT_INVALID: `Unit must be one of: ${units_of_measure}`,
  UNIT_MISMATCH: "Unit must match the unit the raw material is counted in",
  QR_CODE_BASE: "QR code must be a string",
  QR_CODE_EMPTY: "QR code cannot be empty",
  QR_CODE_MIN: `QR code must be at least ${raw_material_stock_entry_validation_limits.QR_CODE_MIN} characters`,
  QR_CODE_MAX: `QR code must not exceed ${raw_material_stock_entry_validation_limits.QR_CODE_MAX} characters`,
  ENTRY_AT_REQUIRED: "Entry date is required",
  ENTRY_AT_BASE: "Entry date must be a date",
  ENTRY_AT_INVALID: "Entry date must be a valid date",
  ENTRY_BY_REQUIRED: "Entry by is required",
  ENTRY_BY_BASE: "Entry by must be a string",
  ENTRY_BY_INVALID: "Entry by must reference an active user",
  RECEIVING_AT_BASE: "Receiving date must be a date",
  RECEIVING_AT_INVALID: "Receiving date must be a valid date",
  RECEIVED_BY_BASE: "Received by must be a string",
  RECEIVED_BY_INVALID: "Received by must reference an active user",
  RECEIVED_BEFORE_ENTRY: "Receiving date cannot be before the entry date",
  UNLOADING_AT_BASE: "Unloading date must be a date",
  UNLOADING_AT_INVALID: "Unloading date must be a valid date",
  UNLOADED_BY_BASE: "Unloaded by must be a string",
  UNLOADED_BY_INVALID: "Unloaded by must reference an active user",
  UNLOADED_BEFORE_RECEIVED:
    "Unloading date cannot be before the receiving date",
  TESTED_AT_BASE: "Tested date must be a date",
  TESTED_AT_INVALID: "Tested date must be a valid date",
  TESTED_BY_BASE: "Tested by must be a string",
  TESTED_BY_INVALID: "Tested by must reference an active user",
  TESTED_BEFORE_UNLOADED: "Tested date cannot be before the unloading date",
  IS_QA_TEST_PASS_BASE: "Quality test result must be a boolean",
  REASON_BASE: "Reason must be a string",
  REASON_INVALID: `Reason must be one of: ${qa_failure_reasons}`,
  REASON_REQUIRED: "A reason is required when the quality test has not passed",
  REASON_NOT_ALLOWED:
    "A reason cannot be given when the quality test has passed",
  NOTES_REQUIRED: "Notes are required",
  NOTES_BASE: "Notes must be a string",
  NOTES_EMPTY: "Notes cannot be empty",
  NOTES_MIN: `Notes must be at least ${raw_material_stock_entry_validation_limits.NOTES_MIN} characters`,
  NOTES_MAX: `Notes must not exceed ${raw_material_stock_entry_validation_limits.NOTES_MAX} characters`,
  IS_STOCK_USED_BASE: "Stock used flag must be a boolean",
  USED_BEFORE_QA_PASS:
    "Stock cannot be marked as used before it has passed its quality test",
  IS_ACTIVE_BASE: "Active flag must be a boolean",
  CREATED_BY_REQUIRED: "Created by is required",
  CREATED_BY_BASE: "Created by must be a string",
  CREATED_BY_INVALID: "Created by must reference an active user",
  UPDATED_BY_BASE: "Updated by must be a string",
  UPDATED_BY_INVALID: "Updated by must reference an active user",
  UPDATE_MIN: "At least one field must be sent to update a stock entry",
  UNKNOWN_FIELD: "Request body contains an unsupported field",
});

module.exports = {
  raw_material_stock_entry_messages,
  raw_material_stock_entry_validation_messages,
};
