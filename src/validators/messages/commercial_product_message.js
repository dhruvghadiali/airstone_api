const { gst_slab } = require("@enums");
const {
  commercial_product_validation_limits,
} = require("@validators/constants/commercial_product_constants");

/**
 * The accepted GST slabs, spelled the way a caller should send them.
 *
 * Built from the enum rather than typed out, so adding or removing a slab
 * updates this message on its own.
 */
const gst_slabs = Object.values(gst_slab).join(", ");

/**
 * `CODE_EXISTS` is what a duplicate key on `product_code` should be reported
 * as. Without it the error handler falls back to
 * `error_messages.DUPLICATE_VALUE`, which does not name the field the caller
 * reused.
 *
 * `UPDATE_MIN` is what an empty PATCH body is answered with. A request that
 * names no field is a call that would do nothing. Saying so beats a 200 that
 * changed nothing.
 */
const commercial_product_messages = Object.freeze({
  CREATED: "Commercial product created successfully",
  FETCHED: "Commercial product fetched successfully",
  LISTED: "Commercial products fetched successfully",
  UPDATED: "Commercial product updated successfully",
  DELETED: "Commercial product deleted successfully",
  NOT_FOUND: "Commercial product not found",
  CODE_EXISTS: "A commercial product with this product code already exists",
  INVALID_ID: "Invalid commercial product id",
});

/**
 * `CLIENT_INVALID` is what an id in `clients` is reported as when it does not
 * point at an active company we sell to. The controller raises one entry per
 * bad id, so a caller sending three clients learns which one is wrong.
 *
 * `GST_AMOUNT_MISMATCH` and `SELLING_PRICE_BELOW_COST` are not schema rules.
 * Each needs more than one field at once, so a Mongoose validator cannot see
 * them. The commercial product helper checks both, and these are what it
 * reports. The cost a selling price is measured against is the product price
 * plus the packaging, marketing and other costs.
 *
 * `DISCOUNT_EXCEEDS_SELLING_PRICE` is the same kind of rule. A discount larger
 * than the price the product sells at is not a discount.
 */
const commercial_product_validation_messages = Object.freeze({
  PRODUCT_NAME_REQUIRED: "Product name is required",
  PRODUCT_NAME_BASE: "Product name must be a string",
  PRODUCT_NAME_EMPTY: "Product name cannot be empty",
  PRODUCT_NAME_MIN: `Product name must be at least ${commercial_product_validation_limits.PRODUCT_NAME_MIN} characters`,
  PRODUCT_NAME_MAX: `Product name must not exceed ${commercial_product_validation_limits.PRODUCT_NAME_MAX} characters`,
  PRODUCT_CODE_REQUIRED: "Product code is required",
  PRODUCT_CODE_BASE: "Product code must be a string",
  PRODUCT_CODE_EMPTY: "Product code cannot be empty",
  PRODUCT_CODE_MIN: `Product code must be at least ${commercial_product_validation_limits.PRODUCT_CODE_MIN} characters`,
  PRODUCT_CODE_MAX: `Product code must not exceed ${commercial_product_validation_limits.PRODUCT_CODE_MAX} characters`,
  PRODUCT_CODE_INVALID:
    "Product code must contain only uppercase letters, digits and hyphens",
  CLIENTS_BASE: "Clients must be a list",
  CLIENTS_MAX: `Clients must not exceed ${commercial_product_validation_limits.CLIENTS_MAX_ITEMS} entries`,
  CLIENTS_DUPLICATE: "The same client cannot be listed twice",
  CLIENT_BASE: "Client must be a string",
  CLIENT_INVALID: "Client must reference an active company we sell to",
  MANUFACTURED_PRODUCT_REQUIRED: "Manufactured product is required",
  MANUFACTURED_PRODUCT_BASE: "Manufactured product must be a list",
  MANUFACTURED_PRODUCT_MIN: `Manufactured product must have at least ${commercial_product_validation_limits.MANUFACTURED_PRODUCT_MIN_ITEMS} entry`,
  MANUFACTURED_PRODUCT_MAX: `Manufactured product must not exceed ${commercial_product_validation_limits.MANUFACTURED_PRODUCT_MAX_ITEMS} entries`,
  MANUFACTURED_PRODUCT_DUPLICATE:
    "The same manufactured product cannot be listed twice",
  PRODUCT_PRICE_REQUIRED: "Product price is required",
  PRODUCT_PRICE_BASE: "Product price must be a number",
  PRODUCT_PRICE_MIN: `Product price must be at least ${commercial_product_validation_limits.AMOUNT_MIN}`,
  PRODUCT_PRICE_MAX: `Product price must not exceed ${commercial_product_validation_limits.AMOUNT_MAX}`,
  PRODUCT_PRICE_PRECISION: `Product price must not have more than ${commercial_product_validation_limits.AMOUNT_DECIMAL_PLACES} decimal places`,
  PACKAGING_COST_BASE: "Packaging cost must be a number",
  PACKAGING_COST_MIN: `Packaging cost must be at least ${commercial_product_validation_limits.AMOUNT_MIN}`,
  PACKAGING_COST_MAX: `Packaging cost must not exceed ${commercial_product_validation_limits.AMOUNT_MAX}`,
  PACKAGING_COST_PRECISION: `Packaging cost must not have more than ${commercial_product_validation_limits.AMOUNT_DECIMAL_PLACES} decimal places`,
  MARKETING_COST_BASE: "Marketing cost must be a number",
  MARKETING_COST_MIN: `Marketing cost must be at least ${commercial_product_validation_limits.AMOUNT_MIN}`,
  MARKETING_COST_MAX: `Marketing cost must not exceed ${commercial_product_validation_limits.AMOUNT_MAX}`,
  MARKETING_COST_PRECISION: `Marketing cost must not have more than ${commercial_product_validation_limits.AMOUNT_DECIMAL_PLACES} decimal places`,
  OTHER_COST_BASE: "Other cost must be a number",
  OTHER_COST_MIN: `Other cost must be at least ${commercial_product_validation_limits.AMOUNT_MIN}`,
  OTHER_COST_MAX: `Other cost must not exceed ${commercial_product_validation_limits.AMOUNT_MAX}`,
  OTHER_COST_PRECISION: `Other cost must not have more than ${commercial_product_validation_limits.AMOUNT_DECIMAL_PLACES} decimal places`,
  SELLING_PRICE_REQUIRED: "Selling price is required",
  SELLING_PRICE_BASE: "Selling price must be a number",
  SELLING_PRICE_MIN: `Selling price must be at least ${commercial_product_validation_limits.AMOUNT_MIN}`,
  SELLING_PRICE_MAX: `Selling price must not exceed ${commercial_product_validation_limits.AMOUNT_MAX}`,
  SELLING_PRICE_PRECISION: `Selling price must not have more than ${commercial_product_validation_limits.AMOUNT_DECIMAL_PLACES} decimal places`,
  SELLING_PRICE_BELOW_COST:
    "Selling price must not be less than the product price and the packaging, marketing and other costs together",
  DISCOUNT_BASE: "Discount must be a number",
  DISCOUNT_MIN: `Discount must be at least ${commercial_product_validation_limits.AMOUNT_MIN}`,
  DISCOUNT_MAX: `Discount must not exceed ${commercial_product_validation_limits.AMOUNT_MAX}`,
  DISCOUNT_PRECISION: `Discount must not have more than ${commercial_product_validation_limits.AMOUNT_DECIMAL_PLACES} decimal places`,
  DISCOUNT_EXCEEDS_SELLING_PRICE:
    "Discount must not be more than the selling price",
  GST_PERCENTAGE_REQUIRED: "GST percentage is required",
  GST_PERCENTAGE_BASE: "GST percentage must be a string",
  GST_PERCENTAGE_EMPTY: "GST percentage cannot be empty",
  GST_PERCENTAGE_INVALID: `GST percentage must be one of: ${gst_slabs}`,
  GST_AMOUNT_REQUIRED: "GST amount is required",
  GST_AMOUNT_BASE: "GST amount must be a number",
  GST_AMOUNT_MIN: `GST amount must be at least ${commercial_product_validation_limits.AMOUNT_MIN}`,
  GST_AMOUNT_MAX: `GST amount must not exceed ${commercial_product_validation_limits.AMOUNT_MAX}`,
  GST_AMOUNT_PRECISION: `GST amount must not have more than ${commercial_product_validation_limits.AMOUNT_DECIMAL_PLACES} decimal places`,
  GST_AMOUNT_MISMATCH:
    "GST amount does not agree with the selling price and GST percentage",
  IS_ACTIVE_BASE: "Active flag must be a boolean",
  CREATED_BY_REQUIRED: "Created by is required",
  CREATED_BY_BASE: "Created by must be a string",
  CREATED_BY_INVALID: "Created by must reference an active user",
  UPDATED_BY_BASE: "Updated by must be a string",
  UPDATED_BY_INVALID: "Updated by must reference an active user",
  UPDATE_MIN: "At least one field must be sent to update a commercial product",
  UNKNOWN_FIELD: "Request body contains an unsupported field",
});

module.exports = {
  commercial_product_messages,
  commercial_product_validation_messages,
};
