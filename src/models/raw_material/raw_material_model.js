const mongoose = require("mongoose");

const { raw_material_unit_of_measure } = require("@enums");
const { raw_material_validation_messages } = require("@validators/messages");
const {
  raw_material_validation_limits,
  raw_material_validation_patterns,
} = require("@validators/constants");

/**
 * A material AIRSTONE buys and consumes, such as cement, sand or a chemical.
 *
 * This is the master record only. It says what a material is and how it is
 * counted. What was bought, and what is in the yard right now, will live in a
 * separate stock ledger with one row per movement.
 *
 * The fields:
 *
 * `material_code` identifies the material, so it carries the unique index and
 * `material_name` does not. Two suppliers can invoice the same sand under two
 * different names.
 *
 * The code is uppercased and matched against a pattern, so one material has one
 * spelling. A code sent as "rm-01" is stored as "RM-01".
 *
 * That unique index is global and deletes here are soft, so a deactivated
 * material keeps its code reserved. That is deliberate. The code names a real
 * material whether or not the yard still buys it. It does mean a material
 * cannot be deleted and entered again under the same code.
 *
 * `unit` is how the material is counted. One material has one unit, so a
 * purchase made in another unit is converted before it is recorded.
 *
 * `supplier` points at `Company` rather than at a supplier model of its own,
 * because a firm that sells us sand is often a firm we sell stone to. It is a
 * list because a material is usually sourced from more than one firm.
 *
 * It is optional and starts empty. A material is often entered before the buyer
 * has settled who supplies it.
 *
 * The list holds ids only. Whether each id points at a company that exists and
 * is still active is checked by the controller before the write, using
 * `is_active_company_exists`. The `ref` here only drives populate.
 *
 * `minimum_stock_level` is the level at which the material should be reordered.
 * It is not a stock count, and nothing decrements it. It starts at 1 because a
 * threshold of zero would only fire once the yard had run out.
 *
 * `created_by` and `updated_by` name users. `updated_by` starts null because a
 * material that has only ever been created has not been updated by anyone.
 */
const raw_material_schema = new mongoose.Schema(
  {
    material_name: {
      type: String,
      required: [true, raw_material_validation_messages.MATERIAL_NAME_REQUIRED],
      trim: true,
      minlength: [
        raw_material_validation_limits.MATERIAL_NAME_MIN,
        raw_material_validation_messages.MATERIAL_NAME_MIN,
      ],
      maxlength: [
        raw_material_validation_limits.MATERIAL_NAME_MAX,
        raw_material_validation_messages.MATERIAL_NAME_MAX,
      ],
      index: true,
    },
    material_code: {
      type: String,
      required: [true, raw_material_validation_messages.MATERIAL_CODE_REQUIRED],
      unique: true,
      trim: true,
      uppercase: true,
      minlength: [
        raw_material_validation_limits.MATERIAL_CODE_MIN,
        raw_material_validation_messages.MATERIAL_CODE_MIN,
      ],
      maxlength: [
        raw_material_validation_limits.MATERIAL_CODE_MAX,
        raw_material_validation_messages.MATERIAL_CODE_MAX,
      ],
      match: [
        raw_material_validation_patterns.MATERIAL_CODE,
        raw_material_validation_messages.MATERIAL_CODE_INVALID,
      ],
    },
    unit: {
      type: String,
      required: [true, raw_material_validation_messages.UNIT_REQUIRED],
      enum: {
        values: Object.values(raw_material_unit_of_measure),
        message: raw_material_validation_messages.UNIT_INVALID,
      },
      index: true,
    },
    supplier: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Company",
      default: [],
      index: true,
    },
    minimum_stock_level: {
      type: Number,
      default: raw_material_validation_limits.MINIMUM_STOCK_LEVEL_MIN,
      min: [
        raw_material_validation_limits.MINIMUM_STOCK_LEVEL_MIN,
        raw_material_validation_messages.MINIMUM_STOCK_LEVEL_MIN,
      ],
      max: [
        raw_material_validation_limits.MINIMUM_STOCK_LEVEL_MAX,
        raw_material_validation_messages.MINIMUM_STOCK_LEVEL_MAX,
      ],
    },
    is_active: {
      type: Boolean,
      default: true,
      index: true,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, raw_material_validation_messages.CREATED_BY_REQUIRED],
    },
    updated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
    toJSON: { flattenMaps: true },
    toObject: { flattenMaps: true },
  },
);

// The raw material list is searched by name and filtered by unit and active
// state, so the compound key leads with the unit. The code is looked up whole
// rather than searched, and its unique index already serves that.
raw_material_schema.index({ material_name: "text" });
raw_material_schema.index({ unit: 1, is_active: 1 });

module.exports = mongoose.model("RawMaterial", raw_material_schema);
