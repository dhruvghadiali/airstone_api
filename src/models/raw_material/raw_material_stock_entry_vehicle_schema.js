const mongoose = require("mongoose");

const { vehicle_type } = require("@enums");
const {
  raw_material_stock_entry_vehicle_validation_messages,
} = require("@validators/messages");
const {
  validation_patterns,
  user_validation_limits,
  raw_material_stock_entry_vehicle_validation_limits,
} = require("@validators/constants");

/**
 * The lorry that brought one consignment in.
 *
 * This is a sub-schema, not a model. It has no collection of its own. The stock
 * entry embeds one of these, because a consignment arrives on one vehicle and
 * the vehicle is only ever read with the consignment.
 *
 * It lives in its own file, and nested rather than flat, so the stock entry's
 * field list stays short enough to scan and the vehicle's rules sit in one
 * place.
 *
 * The schema carries no `_id` and no timestamps. Both would describe a row of
 * its own, and this is one object written and rewritten with its parent, not a
 * row. A bill is the opposite case and keeps both.
 *
 * The fields:
 *
 * `number` is uppercased so one plate has one spelling. It is not unique. The
 * same lorry comes back next week, and a plate is copied by hand often enough
 * that a unique index would reject a real consignment over a typo.
 *
 * `mobile_number` is the driver's, and it is held to the same rule a user's and
 * a company's phone are: the format comes from `validation_patterns` in `common`
 * and the length from `user_validation_limits`.
 *
 * `owner_name` is optional because the driver often owns the lorry, and the yard
 * only writes an owner down when the two differ.
 */
const raw_material_stock_entry_vehicle_schema = new mongoose.Schema(
  {
    number: {
      type: String,
      required: [
        true,
        raw_material_stock_entry_vehicle_validation_messages.NUMBER_REQUIRED,
      ],
      trim: true,
      uppercase: true,
      minlength: [
        raw_material_stock_entry_vehicle_validation_limits.NUMBER_MIN,
        raw_material_stock_entry_vehicle_validation_messages.NUMBER_MIN,
      ],
      maxlength: [
        raw_material_stock_entry_vehicle_validation_limits.NUMBER_MAX,
        raw_material_stock_entry_vehicle_validation_messages.NUMBER_MAX,
      ],
    },
    type: {
      type: String,
      required: [
        true,
        raw_material_stock_entry_vehicle_validation_messages.TYPE_REQUIRED,
      ],
      enum: {
        values: Object.values(vehicle_type),
        message:
          raw_material_stock_entry_vehicle_validation_messages.TYPE_INVALID,
      },
    },
    driver_name: {
      type: String,
      required: [
        true,
        raw_material_stock_entry_vehicle_validation_messages.DRIVER_NAME_REQUIRED,
      ],
      trim: true,
      minlength: [
        raw_material_stock_entry_vehicle_validation_limits.DRIVER_NAME_MIN,
        raw_material_stock_entry_vehicle_validation_messages.DRIVER_NAME_MIN,
      ],
      maxlength: [
        raw_material_stock_entry_vehicle_validation_limits.DRIVER_NAME_MAX,
        raw_material_stock_entry_vehicle_validation_messages.DRIVER_NAME_MAX,
      ],
    },
    mobile_number: {
      type: String,
      required: [
        true,
        raw_material_stock_entry_vehicle_validation_messages.MOBILE_NUMBER_REQUIRED,
      ],
      trim: true,
      minlength: [
        user_validation_limits.PHONE_NUMBER_MIN,
        raw_material_stock_entry_vehicle_validation_messages.MOBILE_NUMBER_MIN,
      ],
      maxlength: [
        user_validation_limits.PHONE_NUMBER_MAX,
        raw_material_stock_entry_vehicle_validation_messages.MOBILE_NUMBER_MAX,
      ],
      match: [
        validation_patterns.PHONE_NUMBER,
        raw_material_stock_entry_vehicle_validation_messages.MOBILE_NUMBER_INVALID,
      ],
    },
    owner_name: {
      type: String,
      trim: true,
      default: null,
      minlength: [
        raw_material_stock_entry_vehicle_validation_limits.OWNER_NAME_MIN,
        raw_material_stock_entry_vehicle_validation_messages.OWNER_NAME_MIN,
      ],
      maxlength: [
        raw_material_stock_entry_vehicle_validation_limits.OWNER_NAME_MAX,
        raw_material_stock_entry_vehicle_validation_messages.OWNER_NAME_MAX,
      ],
    },
  },
  {
    _id: false,
    versionKey: false,
    toJSON: { flattenMaps: true },
    toObject: { flattenMaps: true },
  },
);

module.exports = { raw_material_stock_entry_vehicle_schema };
