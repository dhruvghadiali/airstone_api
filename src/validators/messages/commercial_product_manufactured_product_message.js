const {
  commercial_product_manufactured_product_validation_limits,
} = require("@validators/constants/commercial_product_manufactured_product_constants");

/**
 * `PRODUCT_INVALID` is what an id on a line is reported as when it does not
 * point at an active manufacturing product. The controller raises one entry per
 * bad id, so a caller sending three lines learns which one is wrong.
 *
 * `NOT_FOUND` and `INVALID_ID` address one line inside a commercial product.
 * Each entry carries its own `_id`, so an endpoint can update or remove a
 * single line without rewriting the list.
 */
const commercial_product_manufactured_product_messages = Object.freeze({
  ADDED: "Manufactured product added successfully",
  UPDATED: "Manufactured product updated successfully",
  DELETED: "Manufactured product deleted successfully",
  NOT_FOUND: "Manufactured product not found on this commercial product",
  INVALID_ID: "Invalid manufactured product line id",
});

const commercial_product_manufactured_product_validation_messages =
  Object.freeze({
    PRODUCT_REQUIRED: "Product is required",
    PRODUCT_BASE: "Product must be a string",
    PRODUCT_EMPTY: "Product cannot be empty",
    PRODUCT_INVALID: "Product must reference an active manufacturing product",
    QTY_REQUIRED: "Quantity is required",
    QTY_BASE: "Quantity must be a number",
    QTY_MIN: `Quantity must be at least ${commercial_product_manufactured_product_validation_limits.QTY_MIN}`,
    QTY_MAX: `Quantity must not exceed ${commercial_product_manufactured_product_validation_limits.QTY_MAX}`,
    UNKNOWN_FIELD: "Manufactured product entry contains an unsupported field",
  });

module.exports = {
  commercial_product_manufactured_product_messages,
  commercial_product_manufactured_product_validation_messages,
};
