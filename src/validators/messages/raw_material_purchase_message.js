const { gst_slab, raw_material_unit_of_measure } = require("@enums");
const {
  raw_material_purchase_validation_limits,
} = require("@validators/constants/raw_material_purchase_constants");

/**
 * The accepted GST rates, spelled the way a caller should send them.
 *
 * Built from the enum rather than typed out, so adding or removing a slab
 * updates this message on its own.
 */
const gst_slabs = Object.values(gst_slab).join(", ");

/**
 * The accepted units, spelled the way a caller should send them.
 *
 * Built from the enum for the same reason `gst_slabs` is.
 */
const units_of_measure = Object.values(raw_material_unit_of_measure).join(", ");

/**
 * `UPDATE_MIN` is what an empty PATCH body is answered with. A request that
 * names no field is a call that would do nothing, and saying so beats a 200
 * that changed nothing.
 *
 * `DELIVERY_DATE_BEFORE_PURCHASE`, `FINAL_AMOUNT_MISMATCH`,
 * `GST_AMOUNT_MISMATCH`, `DISCOUNT_MISMATCH`, `PAYMENTS_EXCEED_TOTAL` and
 * `UNIT_MISMATCH` are all rules about one field given another. A schema
 * validator sees one value at a time and cannot check any of them, so the
 * purchase helper does, and these are what it reports.
 *
 * `MATERIAL_INVALID` and `SUPPLIER_INVALID` are what a reference is reported as
 * when it does not point at an active row. The controller raises them before
 * the write.
 */
const raw_material_purchase_messages = Object.freeze({
  CREATED: "Raw material purchase created successfully",
  FETCHED: "Raw material purchase fetched successfully",
  LISTED: "Raw material purchases fetched successfully",
  UPDATED: "Raw material purchase updated successfully",
  DELETED: "Raw material purchase deleted successfully",
  NOT_FOUND: "Raw material purchase not found",
  INVALID_ID: "Invalid raw material purchase id",
});

const raw_material_purchase_validation_messages = Object.freeze({
  MATERIAL_REQUIRED: "Material is required",
  MATERIAL_BASE: "Material must be a string",
  MATERIAL_INVALID: "Material must reference an active raw material",
  SUPPLIER_REQUIRED: "Supplier is required",
  SUPPLIER_BASE: "Supplier must be a string",
  SUPPLIER_INVALID: "Supplier must reference an active company",
  PURCHASE_DATE_REQUIRED: "Purchase date is required",
  PURCHASE_DATE_BASE: "Purchase date must be a date",
  PURCHASE_DATE_INVALID: "Purchase date must be a valid date",
  EXPECTED_DELIVERY_DATE_REQUIRED: "Expected delivery date is required",
  EXPECTED_DELIVERY_DATE_BASE: "Expected delivery date must be a date",
  EXPECTED_DELIVERY_DATE_INVALID: "Expected delivery date must be a valid date",
  DELIVERY_DATE_BEFORE_PURCHASE:
    "Expected delivery date cannot be before the purchase date",
  QTY_BASE: "Quantity must be a number",
  QTY_MIN: `Quantity must be at least ${raw_material_purchase_validation_limits.QTY_MIN}`,
  QTY_MAX: `Quantity must not exceed ${raw_material_purchase_validation_limits.QTY_MAX}`,
  UNIT_REQUIRED: "Unit is required",
  UNIT_BASE: "Unit must be a string",
  UNIT_EMPTY: "Unit cannot be empty",
  UNIT_INVALID: `Unit must be one of: ${units_of_measure}`,
  UNIT_MISMATCH: "Unit must match the unit the raw material is counted in",
  PURCHASE_PRICE_REQUIRED: "Purchase price is required",
  PURCHASE_PRICE_BASE: "Purchase price must be a number",
  PURCHASE_PRICE_MIN: `Purchase price must be at least ${raw_material_purchase_validation_limits.AMOUNT_MIN}`,
  PURCHASE_PRICE_MAX: `Purchase price must not exceed ${raw_material_purchase_validation_limits.AMOUNT_MAX}`,
  PURCHASE_PRICE_PRECISION: `Purchase price must not have more than ${raw_material_purchase_validation_limits.AMOUNT_DECIMAL_PLACES} decimal places`,
  FINAL_PAYMENT_AMOUNT_REQUIRED: "Final payment amount is required",
  FINAL_PAYMENT_AMOUNT_BASE: "Final payment amount must be a number",
  FINAL_PAYMENT_AMOUNT_MIN: `Final payment amount must be at least ${raw_material_purchase_validation_limits.AMOUNT_MIN}`,
  FINAL_PAYMENT_AMOUNT_MAX: `Final payment amount must not exceed ${raw_material_purchase_validation_limits.AMOUNT_MAX}`,
  FINAL_PAYMENT_AMOUNT_PRECISION: `Final payment amount must not have more than ${raw_material_purchase_validation_limits.AMOUNT_DECIMAL_PLACES} decimal places`,
  FINAL_AMOUNT_MISMATCH:
    "Final payment amount must equal purchase price plus GST amount minus discount amount",
  GST_PERCENTAGE_REQUIRED: "GST percentage is required",
  GST_PERCENTAGE_BASE: "GST percentage must be a string",
  GST_PERCENTAGE_EMPTY: "GST percentage cannot be empty",
  GST_PERCENTAGE_INVALID: `GST percentage must be one of: ${gst_slabs}`,
  GST_AMOUNT_REQUIRED: "GST amount is required",
  GST_AMOUNT_BASE: "GST amount must be a number",
  GST_AMOUNT_MIN: `GST amount must be at least ${raw_material_purchase_validation_limits.AMOUNT_MIN}`,
  GST_AMOUNT_MAX: `GST amount must not exceed ${raw_material_purchase_validation_limits.AMOUNT_MAX}`,
  GST_AMOUNT_PRECISION: `GST amount must not have more than ${raw_material_purchase_validation_limits.AMOUNT_DECIMAL_PLACES} decimal places`,
  GST_AMOUNT_MISMATCH:
    "GST amount does not match the GST percentage on this purchase",
  DISCOUNT_AMOUNT_BASE: "Discount amount must be a number",
  DISCOUNT_AMOUNT_MIN: `Discount amount must be at least ${raw_material_purchase_validation_limits.AMOUNT_MIN}`,
  DISCOUNT_AMOUNT_MAX: `Discount amount must not exceed ${raw_material_purchase_validation_limits.AMOUNT_MAX}`,
  DISCOUNT_AMOUNT_PRECISION: `Discount amount must not have more than ${raw_material_purchase_validation_limits.AMOUNT_DECIMAL_PLACES} decimal places`,
  DISCOUNT_PERCENTAGE_BASE: "Discount percentage must be a number",
  DISCOUNT_PERCENTAGE_MIN: `Discount percentage must be at least ${raw_material_purchase_validation_limits.DISCOUNT_PERCENTAGE_MIN}`,
  DISCOUNT_PERCENTAGE_MAX: `Discount percentage must not exceed ${raw_material_purchase_validation_limits.DISCOUNT_PERCENTAGE_MAX}`,
  DISCOUNT_PERCENTAGE_PRECISION: `Discount percentage must not have more than ${raw_material_purchase_validation_limits.AMOUNT_DECIMAL_PLACES} decimal places`,
  DISCOUNT_MISMATCH:
    "Discount amount does not match the discount percentage of the purchase price",
  PAYMENT_BASE: "Payment must be a list of payments",
  PAYMENTS_EXCEED_TOTAL:
    "Payments recorded against this purchase exceed the final payment amount",
  IS_ALL_MATERIAL_RECEIVED_BASE: "All material received flag must be a boolean",
  IS_ACTIVE_BASE: "Active flag must be a boolean",
  CREATED_BY_REQUIRED: "Created by is required",
  CREATED_BY_BASE: "Created by must be a string",
  CREATED_BY_INVALID: "Created by must reference an active user",
  UPDATED_BY_BASE: "Updated by must be a string",
  UPDATED_BY_INVALID: "Updated by must reference an active user",
  UPDATE_MIN:
    "At least one field must be sent to update a raw material purchase",
  UNKNOWN_FIELD: "Request body contains an unsupported field",
});

module.exports = {
  raw_material_purchase_messages,
  raw_material_purchase_validation_messages,
};
