const { raw_material_unit_of_measure } = require("@enums");
const {
  manufacturing_log_raw_material_validation_limits,
} = require("@validators/constants/manufacturing_log_raw_material_constants");

/**
 * The accepted units, spelled the way a caller should send them.
 *
 * Built from the enum rather than typed out, so adding or removing a unit
 * updates this message on its own. It is the raw material's unit set, because
 * the line measures a raw material and not the finished product.
 */
const units_of_measure = Object.values(raw_material_unit_of_measure).join(", ");

/**
 * One set of messages serves both lists on the log: what the batch consumed,
 * and what it wasted. The two hold the same three fields, so a caller is told
 * the same thing about either one. Which list a bad line came from is carried by
 * the field path in the error, not by the wording.
 *
 * `MATERIAL_INVALID` is what an id on a line is reported as when it does not
 * point at an active raw material. The controller raises one entry per bad id,
 * so a caller sending three lines learns which one is wrong.
 *
 * `UNIT_MISMATCH` is not a schema rule. It needs the material's own row, so the
 * manufacturing log helper checks it and this is what it reports.
 *
 * `NOT_FOUND` and `INVALID_ID` address one line inside a log. Each entry carries
 * its own `_id`, so an endpoint can update or remove a single line without
 * rewriting the list.
 */
const manufacturing_log_raw_material_messages = Object.freeze({
  ADDED: "Raw material added successfully",
  UPDATED: "Raw material updated successfully",
  DELETED: "Raw material deleted successfully",
  NOT_FOUND: "Raw material not found on this log",
  INVALID_ID: "Invalid raw material line id",
});

const manufacturing_log_raw_material_validation_messages = Object.freeze({
  MATERIAL_REQUIRED: "Material is required",
  MATERIAL_BASE: "Material must be a string",
  MATERIAL_EMPTY: "Material cannot be empty",
  MATERIAL_INVALID: "Material must reference an active raw material",
  QTY_REQUIRED: "Quantity is required",
  QTY_BASE: "Quantity must be a number",
  QTY_MIN: `Quantity must be at least ${manufacturing_log_raw_material_validation_limits.QTY_MIN}`,
  QTY_MAX: `Quantity must not exceed ${manufacturing_log_raw_material_validation_limits.QTY_MAX}`,
  UNIT_REQUIRED: "Unit is required",
  UNIT_BASE: "Unit must be a string",
  UNIT_EMPTY: "Unit cannot be empty",
  UNIT_INVALID: `Unit must be one of: ${units_of_measure}`,
  UNIT_MISMATCH: "Unit must match the unit the material is counted in",
  UNKNOWN_FIELD: "Raw material entry contains an unsupported field",
});

module.exports = {
  manufacturing_log_raw_material_messages,
  manufacturing_log_raw_material_validation_messages,
};
