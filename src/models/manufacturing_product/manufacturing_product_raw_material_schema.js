const mongoose = require("mongoose");

const { raw_material_unit_of_measure } = require("@enums");
const {
  manufacturing_product_raw_material_validation_messages,
} = require("@validators/messages");
const {
  manufacturing_product_raw_material_validation_limits,
} = require("@validators/constants");

/**
 * One raw material that goes into one manufacturing product.
 *
 * This is a sub-schema, not a model. It has no collection of its own. The
 * product embeds a list of these, because a recipe is a handful of lines and
 * they are always read with the product they belong to. A raw material purchase
 * is a separate collection for the opposite reason: purchases grow without limit
 * and are edited on their own.
 *
 * It lives in its own file so a line's fields can change without opening the
 * product, and so the product's field list stays short enough to scan.
 *
 * Each entry keeps its own `_id`, which is what lets an endpoint update or
 * remove one line instead of rewriting the whole recipe.
 *
 * The fields:
 *
 * `material` only declares the relationship. Whether the id points at a raw
 * material that exists and is still active is checked by the controller before
 * the write, using `is_active_raw_material_exists`. The `ref` here only drives
 * populate.
 *
 * `qty` is how much of the material one unit of the product consumes. It is not
 * held to whole numbers, because half a kilogram of a chemical is a real amount.
 *
 * `unit` is copied onto the line rather than read off the material. A recipe
 * written today keeps the unit it was actually written in, even after the
 * material is changed to be counted another way. That the two agree at the time
 * of writing is the helper's check, because it needs the material's own row.
 *
 * The set of units here is the raw material's, not the product's. A line
 * measures a raw material, so it is counted the way that material is counted.
 */
const manufacturing_product_raw_material_schema = new mongoose.Schema(
  {
    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RawMaterial",
      required: [
        true,
        manufacturing_product_raw_material_validation_messages.MATERIAL_REQUIRED,
      ],
    },
    qty: {
      type: Number,
      required: [
        true,
        manufacturing_product_raw_material_validation_messages.QTY_REQUIRED,
      ],
      min: [
        manufacturing_product_raw_material_validation_limits.QTY_MIN,
        manufacturing_product_raw_material_validation_messages.QTY_MIN,
      ],
      max: [
        manufacturing_product_raw_material_validation_limits.QTY_MAX,
        manufacturing_product_raw_material_validation_messages.QTY_MAX,
      ],
    },
    unit: {
      type: String,
      required: [
        true,
        manufacturing_product_raw_material_validation_messages.UNIT_REQUIRED,
      ],
      enum: {
        values: Object.values(raw_material_unit_of_measure),
        message:
          manufacturing_product_raw_material_validation_messages.UNIT_INVALID,
      },
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
    toJSON: { flattenMaps: true },
    toObject: { flattenMaps: true },
  },
);

module.exports = { manufacturing_product_raw_material_schema };
