const { gst_slab, manufacturing_product_unit_of_measure } = require("@enums");
const {
  manufacturing_product_validation_limits,
} = require("@validators/constants/manufacturing_product_constants");

/**
 * The accepted units and GST slabs, spelled the way a caller should send them.
 *
 * Both are built from their enums rather than typed out, so adding or removing
 * a value updates these messages on its own.
 */
const units_of_measure = Object.values(
  manufacturing_product_unit_of_measure,
).join(", ");
const gst_slabs = Object.values(gst_slab).join(", ");

/**
 * `CODE_EXISTS` is what a duplicate key on `product_code` should be reported as.
 * Without it the error handler falls back to `error_messages.DUPLICATE_VALUE`,
 * which does not name the field the caller reused.
 *
 * `UPDATE_MIN` is what an empty PATCH body is answered with. A request that
 * names no field is a call that would do nothing, and saying so beats a 200
 * that changed nothing.
 */
const manufacturing_product_messages = Object.freeze({
  CREATED: "Manufacturing product created successfully",
  FETCHED: "Manufacturing product fetched successfully",
  LISTED: "Manufacturing products fetched successfully",
  UPDATED: "Manufacturing product updated successfully",
  DELETED: "Manufacturing product deleted successfully",
  NOT_FOUND: "Manufacturing product not found",
  CODE_EXISTS: "A manufacturing product with this product code already exists",
  INVALID_ID: "Invalid manufacturing product id",
});

/**
 * `GST_AMOUNT_MISMATCH` and `SELLING_PRICE_BELOW_COST` are not schema rules.
 * Each needs two fields at once, so a Mongoose validator cannot see them. The
 * manufacturing product helper checks both, and these are what it reports.
 *
 * `DISCOUNT_EXCEEDS_SELLING_PRICE` is the same kind of rule. A discount larger
 * than the price the product sells at is not a discount.
 */
const manufacturing_product_validation_messages = Object.freeze({
  PRODUCT_NAME_REQUIRED: "Product name is required",
  PRODUCT_NAME_BASE: "Product name must be a string",
  PRODUCT_NAME_EMPTY: "Product name cannot be empty",
  PRODUCT_NAME_MIN: `Product name must be at least ${manufacturing_product_validation_limits.PRODUCT_NAME_MIN} characters`,
  PRODUCT_NAME_MAX: `Product name must not exceed ${manufacturing_product_validation_limits.PRODUCT_NAME_MAX} characters`,
  PRODUCT_CODE_REQUIRED: "Product code is required",
  PRODUCT_CODE_BASE: "Product code must be a string",
  PRODUCT_CODE_EMPTY: "Product code cannot be empty",
  PRODUCT_CODE_MIN: `Product code must be at least ${manufacturing_product_validation_limits.PRODUCT_CODE_MIN} characters`,
  PRODUCT_CODE_MAX: `Product code must not exceed ${manufacturing_product_validation_limits.PRODUCT_CODE_MAX} characters`,
  PRODUCT_CODE_INVALID:
    "Product code must contain only uppercase letters, digits and hyphens",
  MEASUREMENT_UNIT_REQUIRED: "Measurement unit is required",
  MEASUREMENT_UNIT_BASE: "Measurement unit must be a string",
  MEASUREMENT_UNIT_EMPTY: "Measurement unit cannot be empty",
  MEASUREMENT_UNIT_INVALID: `Measurement unit must be one of: ${units_of_measure}`,
  MEASUREMENT_VALUE_REQUIRED: "Measurement value is required",
  MEASUREMENT_VALUE_BASE: "Measurement value must be a number",
  MEASUREMENT_VALUE_MIN: `Measurement value must be at least ${manufacturing_product_validation_limits.MEASUREMENT_VALUE_MIN}`,
  MEASUREMENT_VALUE_MAX: `Measurement value must not exceed ${manufacturing_product_validation_limits.MEASUREMENT_VALUE_MAX}`,
  RAW_MATERIAL_REQUIRED: "Raw material is required",
  RAW_MATERIAL_BASE: "Raw material must be a list",
  RAW_MATERIAL_MIN: `Raw material must have at least ${manufacturing_product_validation_limits.RAW_MATERIAL_MIN_ITEMS} entry`,
  RAW_MATERIAL_MAX: `Raw material must not exceed ${manufacturing_product_validation_limits.RAW_MATERIAL_MAX_ITEMS} entries`,
  RAW_MATERIAL_DUPLICATE: "The same material cannot be listed twice",
  MANUFACTURING_PRICE_REQUIRED: "Manufacturing price is required",
  MANUFACTURING_PRICE_BASE: "Manufacturing price must be a number",
  MANUFACTURING_PRICE_MIN: `Manufacturing price must be at least ${manufacturing_product_validation_limits.AMOUNT_MIN}`,
  MANUFACTURING_PRICE_MAX: `Manufacturing price must not exceed ${manufacturing_product_validation_limits.AMOUNT_MAX}`,
  MANUFACTURING_PRICE_PRECISION: `Manufacturing price must not have more than ${manufacturing_product_validation_limits.AMOUNT_DECIMAL_PLACES} decimal places`,
  SELLING_PRICE_REQUIRED: "Selling price is required",
  SELLING_PRICE_BASE: "Selling price must be a number",
  SELLING_PRICE_MIN: `Selling price must be at least ${manufacturing_product_validation_limits.AMOUNT_MIN}`,
  SELLING_PRICE_MAX: `Selling price must not exceed ${manufacturing_product_validation_limits.AMOUNT_MAX}`,
  SELLING_PRICE_PRECISION: `Selling price must not have more than ${manufacturing_product_validation_limits.AMOUNT_DECIMAL_PLACES} decimal places`,
  SELLING_PRICE_BELOW_COST:
    "Selling price must not be less than the manufacturing price",
  DISCOUNT_BASE: "Discount must be a number",
  DISCOUNT_MIN: `Discount must be at least ${manufacturing_product_validation_limits.AMOUNT_MIN}`,
  DISCOUNT_MAX: `Discount must not exceed ${manufacturing_product_validation_limits.AMOUNT_MAX}`,
  DISCOUNT_PRECISION: `Discount must not have more than ${manufacturing_product_validation_limits.AMOUNT_DECIMAL_PLACES} decimal places`,
  DISCOUNT_EXCEEDS_SELLING_PRICE:
    "Discount must not be more than the selling price",
  GST_PERCENTAGE_REQUIRED: "GST percentage is required",
  GST_PERCENTAGE_BASE: "GST percentage must be a string",
  GST_PERCENTAGE_EMPTY: "GST percentage cannot be empty",
  GST_PERCENTAGE_INVALID: `GST percentage must be one of: ${gst_slabs}`,
  GST_AMOUNT_REQUIRED: "GST amount is required",
  GST_AMOUNT_BASE: "GST amount must be a number",
  GST_AMOUNT_MIN: `GST amount must be at least ${manufacturing_product_validation_limits.AMOUNT_MIN}`,
  GST_AMOUNT_MAX: `GST amount must not exceed ${manufacturing_product_validation_limits.AMOUNT_MAX}`,
  GST_AMOUNT_PRECISION: `GST amount must not have more than ${manufacturing_product_validation_limits.AMOUNT_DECIMAL_PLACES} decimal places`,
  GST_AMOUNT_MISMATCH:
    "GST amount does not agree with the selling price and GST percentage",
  IS_ACTIVE_BASE: "Active flag must be a boolean",
  CREATED_BY_REQUIRED: "Created by is required",
  CREATED_BY_BASE: "Created by must be a string",
  CREATED_BY_INVALID: "Created by must reference an active user",
  UPDATED_BY_BASE: "Updated by must be a string",
  UPDATED_BY_INVALID: "Updated by must reference an active user",
  UPDATE_MIN:
    "At least one field must be sent to update a manufacturing product",
  UNKNOWN_FIELD: "Request body contains an unsupported field",
});

module.exports = {
  manufacturing_product_messages,
  manufacturing_product_validation_messages,
};
