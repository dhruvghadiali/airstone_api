const {
  manufacturing_log_validation_limits,
} = require("@validators/constants/manufacturing_log_constants");

/**
 * `NOT_FOUND` and `INVALID_ID` address one log. `ENDED` is what the endpoint
 * that closes a batch says, because closing a batch is not the same call as
 * editing one.
 *
 * `UPDATE_MIN` is what an empty PATCH body is answered with. A request that
 * names no field is a call that would do nothing, and saying so beats a 200
 * that changed nothing.
 */
const manufacturing_log_messages = Object.freeze({
  CREATED: "Manufacturing log created successfully",
  FETCHED: "Manufacturing log fetched successfully",
  LISTED: "Manufacturing logs fetched successfully",
  UPDATED: "Manufacturing log updated successfully",
  DELETED: "Manufacturing log deleted successfully",
  ENDED: "Manufacturing log ended successfully",
  NOT_FOUND: "Manufacturing log not found",
  INVALID_ID: "Invalid manufacturing log id",
});

/**
 * The last six keys are not schema rules. Each needs two fields at once, so a
 * Mongoose validator cannot see them. The manufacturing log helper checks all
 * six, and these are what it reports.
 *
 * `END_AT_BEFORE_START` guards the order of the two times. `END_BY_REQUIRED` and
 * `END_AT_REQUIRED` keep the pair together, so a batch cannot record who closed
 * it without when, or when without who.
 *
 * `BATCH_QTY_EXCEEDS_EXPECTED` is the arithmetic rule: the good units plus the
 * damaged units cannot come to more than the batch set out to make.
 *
 * `COMMERCIAL_BEFORE_END` stops a running batch being marked as sellable stock.
 * `COMMERCIAL_WITHOUT_QTY` stops a batch that produced nothing being marked the
 * same way.
 */
const manufacturing_log_validation_messages = Object.freeze({
  PRODUCT_REQUIRED: "Product is required",
  PRODUCT_BASE: "Product must be a string",
  PRODUCT_EMPTY: "Product cannot be empty",
  PRODUCT_INVALID: "Product must reference an active manufacturing product",
  START_BY_REQUIRED: "Start by is required",
  START_BY_BASE: "Start by must be a string",
  START_BY_INVALID: "Start by must reference an active user",
  START_AT_REQUIRED: "Start at is required",
  START_AT_BASE: "Start at must be a date",
  START_AT_INVALID: "Start at must be a valid date",
  END_BY_BASE: "End by must be a string",
  END_BY_INVALID: "End by must reference an active user",
  END_BY_REQUIRED: "End by is required once the end time is set",
  END_AT_BASE: "End at must be a date",
  END_AT_INVALID: "End at must be a valid date",
  END_AT_REQUIRED: "End at is required once the end user is set",
  END_AT_BEFORE_START: "End at must not be before the start time",
  EXPECTED_QTY_IN_BATCH_REQUIRED: "Expected quantity in batch is required",
  EXPECTED_QTY_IN_BATCH_BASE: "Expected quantity in batch must be a number",
  EXPECTED_QTY_IN_BATCH_MIN: `Expected quantity in batch must be at least ${manufacturing_log_validation_limits.EXPECTED_QTY_MIN}`,
  EXPECTED_QTY_IN_BATCH_MAX: `Expected quantity in batch must not exceed ${manufacturing_log_validation_limits.EXPECTED_QTY_MAX}`,
  FINAL_QTY_IN_BATCH_BASE: "Final quantity in batch must be a number",
  FINAL_QTY_IN_BATCH_MIN: `Final quantity in batch must be at least ${manufacturing_log_validation_limits.BATCH_QTY_MIN}`,
  FINAL_QTY_IN_BATCH_MAX: `Final quantity in batch must not exceed ${manufacturing_log_validation_limits.BATCH_QTY_MAX}`,
  DAMAGED_QTY_IN_BATCH_BASE: "Damaged quantity in batch must be a number",
  DAMAGED_QTY_IN_BATCH_MIN: `Damaged quantity in batch must be at least ${manufacturing_log_validation_limits.BATCH_QTY_MIN}`,
  DAMAGED_QTY_IN_BATCH_MAX: `Damaged quantity in batch must not exceed ${manufacturing_log_validation_limits.BATCH_QTY_MAX}`,
  BATCH_QTY_EXCEEDS_EXPECTED:
    "Final and damaged quantity together must not exceed the expected quantity",
  RAW_MATERIAL_REQUIRED: "Raw material is required",
  RAW_MATERIAL_BASE: "Raw material must be a list",
  RAW_MATERIAL_MIN: `Raw material must have at least ${manufacturing_log_validation_limits.RAW_MATERIAL_MIN_ITEMS} entry`,
  RAW_MATERIAL_MAX: `Raw material must not exceed ${manufacturing_log_validation_limits.RAW_MATERIAL_MAX_ITEMS} entries`,
  RAW_MATERIAL_DUPLICATE: "The same material cannot be listed twice",
  RAW_MATERIAL_WASTE_BASE: "Raw material waste must be a list",
  RAW_MATERIAL_WASTE_MAX: `Raw material waste must not exceed ${manufacturing_log_validation_limits.RAW_MATERIAL_WASTE_MAX_ITEMS} entries`,
  RAW_MATERIAL_WASTE_DUPLICATE:
    "The same material cannot be listed twice as waste",
  IS_FINAL_QTY_IN_COMMERCIAL_PRODUCT_BASE:
    "Commercial product flag must be a boolean",
  COMMERCIAL_BEFORE_END:
    "A batch must be ended before its output can enter sellable stock",
  COMMERCIAL_WITHOUT_QTY:
    "A batch that produced no usable units cannot enter sellable stock",
  IS_ACTIVE_BASE: "Active flag must be a boolean",
  CREATED_BY_REQUIRED: "Created by is required",
  CREATED_BY_BASE: "Created by must be a string",
  CREATED_BY_INVALID: "Created by must reference an active user",
  UPDATED_BY_BASE: "Updated by must be a string",
  UPDATED_BY_INVALID: "Updated by must reference an active user",
  UPDATE_MIN: "At least one field must be sent to update a manufacturing log",
  UNKNOWN_FIELD: "Request body contains an unsupported field",
});

module.exports = {
  manufacturing_log_messages,
  manufacturing_log_validation_messages,
};
