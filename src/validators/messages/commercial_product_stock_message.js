const {
  commercial_product_stock_validation_limits,
} = require("@validators/constants/commercial_product_stock_constants");

/**
 * `LOG_ALREADY_IN_STOCK` is what a duplicate key on `manufacturing_logs` should
 * be reported as. The index is unique across active rows, so a batch can be
 * booked into stock once. Without this message the error handler falls back to
 * `error_messages.DUPLICATE_VALUE`, which does not say what was reused.
 *
 * `UPDATE_MIN` is what an empty PATCH body is answered with. A request that
 * names no field is a call that would do nothing. Saying so beats a 200 that
 * changed nothing.
 */
const commercial_product_stock_messages = Object.freeze({
  CREATED: "Commercial product stock created successfully",
  FETCHED: "Commercial product stock fetched successfully",
  LISTED: "Commercial product stock fetched successfully",
  UPDATED: "Commercial product stock updated successfully",
  DELETED: "Commercial product stock deleted successfully",
  NOT_FOUND: "Commercial product stock not found",
  LOG_ALREADY_IN_STOCK:
    "One of these manufacturing logs is already booked into stock",
  INVALID_ID: "Invalid commercial product stock id",
});

/**
 * `MANUFACTURING_LOG_INVALID` is what an id in the list is reported as when it
 * does not point at an active manufacturing log. The controller raises one
 * entry per bad id, so a caller sending three logs learns which one is wrong.
 *
 * The five rules below are not schema rules. Each needs a second document, so a
 * Mongoose validator cannot see them. The commercial product stock helper
 * checks them, and these are what it reports.
 *
 * `LOG_PRODUCT_MISMATCH` is the rule that makes this collection worth having.
 * It is what stops a batch of wall tile being booked as stock of a paver.
 *
 * `MANUFACTURING_LOGS_DUPLICATE` is the helper's too. The unique index stops
 * one log appearing on two rows. It does not stop the same log appearing twice
 * in one list, because a unique index ignores repeats inside a single document.
 */
const commercial_product_stock_validation_messages = Object.freeze({
  PRODUCT_REQUIRED: "Product is required",
  PRODUCT_BASE: "Product must be a string",
  PRODUCT_EMPTY: "Product cannot be empty",
  PRODUCT_INVALID: "Product must reference an active commercial product",
  MANUFACTURING_LOGS_REQUIRED: "Manufacturing logs are required",
  MANUFACTURING_LOGS_BASE: "Manufacturing logs must be a list",
  MANUFACTURING_LOGS_MIN: `Manufacturing logs must have at least ${commercial_product_stock_validation_limits.MANUFACTURING_LOGS_MIN_ITEMS} entry`,
  MANUFACTURING_LOGS_MAX: `Manufacturing logs must not exceed ${commercial_product_stock_validation_limits.MANUFACTURING_LOGS_MAX_ITEMS} entries`,
  MANUFACTURING_LOGS_DUPLICATE:
    "The same manufacturing log cannot be listed twice",
  MANUFACTURING_LOG_BASE: "Manufacturing log must be a string",
  MANUFACTURING_LOG_INVALID:
    "Manufacturing log must reference an active manufacturing log",
  LOG_NOT_ENDED: "A manufacturing log must have ended before it becomes stock",
  LOG_NOT_COMMERCIAL:
    "A manufacturing log must be accepted into sellable stock before it becomes stock",
  LOG_PRODUCT_MISMATCH:
    "A manufacturing log must be a batch of a product this commercial product contains",
  QTY_REQUIRED: "Quantity is required",
  QTY_BASE: "Quantity must be a number",
  QTY_MIN: `Quantity must be at least ${commercial_product_stock_validation_limits.QTY_MIN}`,
  QTY_MAX: `Quantity must not exceed ${commercial_product_stock_validation_limits.QTY_MAX}`,
  QTY_EXCEEDS_BATCH_OUTPUT:
    "Quantity must not be more than the listed batches produced",
  TESTED_AT_REQUIRED: "Tested at is required",
  TESTED_AT_BASE: "Tested at must be a date",
  TESTED_AT_IN_FUTURE: "Tested at must not be in the future",
  TESTED_BY_REQUIRED: "Tested by is required",
  TESTED_BY_BASE: "Tested by must be a string",
  TESTED_BY_INVALID: "Tested by must reference an active user",
  IS_STOCK_SELL_BASE: "Stock sell flag must be a boolean",
  IS_ACTIVE_BASE: "Active flag must be a boolean",
  CREATED_BY_REQUIRED: "Created by is required",
  CREATED_BY_BASE: "Created by must be a string",
  CREATED_BY_INVALID: "Created by must reference an active user",
  UPDATED_BY_BASE: "Updated by must be a string",
  UPDATED_BY_INVALID: "Updated by must reference an active user",
  UPDATE_MIN:
    "At least one field must be sent to update commercial product stock",
  UNKNOWN_FIELD: "Request body contains an unsupported field",
});

module.exports = {
  commercial_product_stock_messages,
  commercial_product_stock_validation_messages,
};
