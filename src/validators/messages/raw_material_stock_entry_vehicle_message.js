const { vehicle_type } = require("@enums");
const {
  user_validation_limits,
} = require("@validators/constants/user_constants");
const {
  raw_material_stock_entry_vehicle_validation_limits,
} = require("@validators/constants/raw_material_stock_entry_vehicle_constants");

/**
 * The accepted vehicle types, spelled the way a caller should send them.
 *
 * Built from the enum rather than typed out, so adding or removing a type
 * updates this message on its own.
 */
const vehicle_types = Object.values(vehicle_type).join(", ");

/**
 * `MOBILE_NUMBER_MIN`, `MOBILE_NUMBER_MAX` and `MOBILE_NUMBER_INVALID`
 * interpolate `user_validation_limits` rather than a vehicle constant of their
 * own, because a driver's phone is held to the same rule a user's and a
 * company's are. See the header of `raw_material_stock_entry_vehicle_constants`.
 */
const raw_material_stock_entry_vehicle_validation_messages = Object.freeze({
  VEHICLE_REQUIRED: "Vehicle details are required",
  VEHICLE_BASE: "Vehicle must be an object",
  NUMBER_REQUIRED: "Vehicle number is required",
  NUMBER_BASE: "Vehicle number must be a string",
  NUMBER_EMPTY: "Vehicle number cannot be empty",
  NUMBER_MIN: `Vehicle number must be at least ${raw_material_stock_entry_vehicle_validation_limits.NUMBER_MIN} characters`,
  NUMBER_MAX: `Vehicle number must not exceed ${raw_material_stock_entry_vehicle_validation_limits.NUMBER_MAX} characters`,
  TYPE_REQUIRED: "Vehicle type is required",
  TYPE_BASE: "Vehicle type must be a string",
  TYPE_EMPTY: "Vehicle type cannot be empty",
  TYPE_INVALID: `Vehicle type must be one of: ${vehicle_types}`,
  DRIVER_NAME_REQUIRED: "Driver name is required",
  DRIVER_NAME_BASE: "Driver name must be a string",
  DRIVER_NAME_EMPTY: "Driver name cannot be empty",
  DRIVER_NAME_MIN: `Driver name must be at least ${raw_material_stock_entry_vehicle_validation_limits.DRIVER_NAME_MIN} characters`,
  DRIVER_NAME_MAX: `Driver name must not exceed ${raw_material_stock_entry_vehicle_validation_limits.DRIVER_NAME_MAX} characters`,
  MOBILE_NUMBER_REQUIRED: "Driver mobile number is required",
  MOBILE_NUMBER_BASE: "Driver mobile number must be a string",
  MOBILE_NUMBER_EMPTY: "Driver mobile number cannot be empty",
  MOBILE_NUMBER_MIN: `Driver mobile number must be at least ${user_validation_limits.PHONE_NUMBER_MIN} characters`,
  MOBILE_NUMBER_MAX: `Driver mobile number must not exceed ${user_validation_limits.PHONE_NUMBER_MAX} characters`,
  MOBILE_NUMBER_INVALID: `Driver mobile number must be exactly ${user_validation_limits.PHONE_NUMBER_MAX} digits`,
  OWNER_NAME_BASE: "Vehicle owner name must be a string",
  OWNER_NAME_EMPTY: "Vehicle owner name cannot be empty",
  OWNER_NAME_MIN: `Vehicle owner name must be at least ${raw_material_stock_entry_vehicle_validation_limits.OWNER_NAME_MIN} characters`,
  OWNER_NAME_MAX: `Vehicle owner name must not exceed ${raw_material_stock_entry_vehicle_validation_limits.OWNER_NAME_MAX} characters`,
  UNKNOWN_FIELD: "Vehicle contains an unsupported field",
});

module.exports = { raw_material_stock_entry_vehicle_validation_messages };
