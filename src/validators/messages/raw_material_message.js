const { unit_of_measure } = require("@enums");
const {
  raw_material_validation_limits,
} = require("@validators/constants/raw_material_constants");

/**
 * The accepted units, spelled the way a caller should send them.
 *
 * Built from the enum rather than typed out, so adding or removing a unit
 * updates this message on its own.
 */
const units_of_measure = Object.values(unit_of_measure).join(", ");

/**
 * `CODE_EXISTS` is what a duplicate key on `material_code` should be reported
 * as. Without it the error handler falls back to
 * `error_messages.DUPLICATE_VALUE`, which does not name the field the caller
 * reused.
 *
 * `UPDATE_MIN` is what an empty PATCH body is answered with. A request that
 * names no field is a call that would do nothing, and saying so beats a 200
 * that changed nothing.
 *
 * `SUPPLIER_INVALID` is what an id in the supplier list is reported as when it
 * does not point at an active company. The controller raises one entry per bad
 * id, so a caller sending three ids learns which one is wrong.
 */
const raw_material_messages = Object.freeze({
  CREATED: "Raw material created successfully",
  FETCHED: "Raw material fetched successfully",
  LISTED: "Raw materials fetched successfully",
  UPDATED: "Raw material updated successfully",
  DELETED: "Raw material deleted successfully",
  NOT_FOUND: "Raw material not found",
  CODE_EXISTS: "A raw material with this material code already exists",
  INVALID_ID: "Invalid raw material id",
});

const raw_material_validation_messages = Object.freeze({
  MATERIAL_NAME_REQUIRED: "Material name is required",
  MATERIAL_NAME_BASE: "Material name must be a string",
  MATERIAL_NAME_EMPTY: "Material name cannot be empty",
  MATERIAL_NAME_MIN: `Material name must be at least ${raw_material_validation_limits.MATERIAL_NAME_MIN} characters`,
  MATERIAL_NAME_MAX: `Material name must not exceed ${raw_material_validation_limits.MATERIAL_NAME_MAX} characters`,
  MATERIAL_CODE_REQUIRED: "Material code is required",
  MATERIAL_CODE_BASE: "Material code must be a string",
  MATERIAL_CODE_EMPTY: "Material code cannot be empty",
  MATERIAL_CODE_MIN: `Material code must be at least ${raw_material_validation_limits.MATERIAL_CODE_MIN} characters`,
  MATERIAL_CODE_MAX: `Material code must not exceed ${raw_material_validation_limits.MATERIAL_CODE_MAX} characters`,
  MATERIAL_CODE_INVALID:
    "Material code must contain only uppercase letters, digits and hyphens",
  UNIT_REQUIRED: "Unit is required",
  UNIT_BASE: "Unit must be a string",
  UNIT_EMPTY: "Unit cannot be empty",
  UNIT_INVALID: `Unit must be one of: ${units_of_measure}`,
  SUPPLIER_BASE: "Supplier must be a list of company ids",
  SUPPLIER_ITEM_BASE: "Each supplier must be a string",
  SUPPLIER_INVALID: "Supplier must reference an active company",
  MINIMUM_STOCK_LEVEL_BASE: "Minimum stock level must be a number",
  MINIMUM_STOCK_LEVEL_MIN: `Minimum stock level must be at least ${raw_material_validation_limits.MINIMUM_STOCK_LEVEL_MIN}`,
  MINIMUM_STOCK_LEVEL_MAX: `Minimum stock level must not exceed ${raw_material_validation_limits.MINIMUM_STOCK_LEVEL_MAX}`,
  IS_ACTIVE_BASE: "Active flag must be a boolean",
  CREATED_BY_REQUIRED: "Created by is required",
  CREATED_BY_BASE: "Created by must be a string",
  CREATED_BY_INVALID: "Created by must reference an active user",
  UPDATED_BY_BASE: "Updated by must be a string",
  UPDATED_BY_INVALID: "Updated by must reference an active user",
  UPDATE_MIN: "At least one field must be sent to update a raw material",
  UNKNOWN_FIELD: "Request body contains an unsupported field",
});

module.exports = { raw_material_messages, raw_material_validation_messages };
