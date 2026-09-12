const mongoose = require("mongoose");

const { gst_slab, manufacturing_product_unit_of_measure } = require("@enums");
const {
  manufacturing_product_raw_material_schema,
} = require("@models/manufacturing_product/manufacturing_product_raw_material_schema");
const {
  manufacturing_product_validation_messages,
} = require("@validators/messages");
const {
  manufacturing_product_validation_limits,
  manufacturing_product_validation_patterns,
} = require("@validators/constants");

/**
 * A product AIRSTONE manufactures and sells, such as a paver or a wall tile.
 *
 * This is the master record and the recipe. It says what the product is, how it
 * is measured, what raw material goes into one unit of it, and what it costs and
 * sells for. It is not a stock count. How many units the plant holds is not
 * stored here. The movement ledger that will answer that is still to be built.
 *
 * Amounts are stored in rupees, not in paise. How many decimal places an amount
 * may carry is checked by the request validator, because a model may not import
 * from `@helpers`. Helpers still convert with `to_paisa` before they compare two
 * amounts, since adding floats does not land exactly.
 *
 * The fields:
 *
 * `product_code` identifies the product, so it carries the unique index and
 * `product_name` does not. The same paver is listed under two names by two
 * dealers.
 *
 * The code is uppercased and matched against a pattern, so one product has one
 * spelling. A code sent as "mp-01" is stored as "MP-01".
 *
 * That unique index is global and deletes here are soft, so a deactivated
 * product keeps its code reserved. That is deliberate. The code names a real
 * product whether or not the plant still makes it. It does mean a product
 * cannot be deleted and entered again under the same code.
 *
 * `measurement_unit` is how the finished product is sold. Its set is the
 * product's own, not the raw material's, because the two measure different
 * things. Raw material is bought by weight and volume. Finished stone is sold by
 * area, by length or by count.
 *
 * `measurement_value` is the size of one unit in that unit of measure. It is not
 * held to whole numbers, because half a square meter is a real size.
 *
 * `raw_material` is the recipe: what one unit of the product consumes. It is
 * embedded rather than a collection of its own, because a recipe is a handful of
 * lines and they are always read with the product.
 *
 * Mongoose's `required` accepts an empty array, so the floor of one line is a
 * length check of its own. That check is safe in the schema because it reads
 * nothing but the list in front of it, and it returns false for a value that is
 * not an array so it cannot throw on `undefined`.
 *
 * That every line points at an active material, and that each line's unit
 * matches the unit that material is counted in, both need a second document. So
 * the controller checks the first and the helper checks the second.
 *
 * `manufacturing_price` is what one unit costs to make. `selling_price` is what
 * it is listed at. Both are stored as given rather than derived from the recipe,
 * because a price is set by the sales team and not by adding up material costs.
 * That the selling price is not below the manufacturing price is a rule about
 * two fields, so the helper checks it.
 *
 * `discount` is an amount off the selling price, not a percentage. It starts at
 * 0, because a product is sold at list price until someone discounts it. That it
 * is not larger than the selling price is the helper's check.
 *
 * `gst_percentage` is a String because the rate is a label on a bill and not a
 * number to do arithmetic on. `expected_gst_amount` converts it when the helper
 * needs to calculate.
 *
 * `gst_amount` is stored as given rather than derived, for the same reason the
 * raw material purchase stores it: the figure on the invoice is what has to be
 * paid even when it disagrees with the arithmetic by a rupee. The helper
 * reconciles it against the selling price and the slab, and reports a mismatch.
 *
 * Its floor is 0 and not 1, because the zero GST slab is real. A product in it
 * stores a GST amount of 0.
 *
 * `created_by` and `updated_by` name users. `updated_by` starts null because a
 * product that has only ever been created has not been updated by anyone.
 */
const manufacturing_product_schema = new mongoose.Schema(
  {
    product_name: {
      type: String,
      required: [
        true,
        manufacturing_product_validation_messages.PRODUCT_NAME_REQUIRED,
      ],
      trim: true,
      minlength: [
        manufacturing_product_validation_limits.PRODUCT_NAME_MIN,
        manufacturing_product_validation_messages.PRODUCT_NAME_MIN,
      ],
      maxlength: [
        manufacturing_product_validation_limits.PRODUCT_NAME_MAX,
        manufacturing_product_validation_messages.PRODUCT_NAME_MAX,
      ],
      index: true,
    },
    product_code: {
      type: String,
      required: [
        true,
        manufacturing_product_validation_messages.PRODUCT_CODE_REQUIRED,
      ],
      unique: true,
      trim: true,
      uppercase: true,
      minlength: [
        manufacturing_product_validation_limits.PRODUCT_CODE_MIN,
        manufacturing_product_validation_messages.PRODUCT_CODE_MIN,
      ],
      maxlength: [
        manufacturing_product_validation_limits.PRODUCT_CODE_MAX,
        manufacturing_product_validation_messages.PRODUCT_CODE_MAX,
      ],
      match: [
        manufacturing_product_validation_patterns.PRODUCT_CODE,
        manufacturing_product_validation_messages.PRODUCT_CODE_INVALID,
      ],
    },
    measurement_unit: {
      type: String,
      required: [
        true,
        manufacturing_product_validation_messages.MEASUREMENT_UNIT_REQUIRED,
      ],
      enum: {
        values: Object.values(manufacturing_product_unit_of_measure),
        message:
          manufacturing_product_validation_messages.MEASUREMENT_UNIT_INVALID,
      },
      index: true,
    },
    measurement_value: {
      type: Number,
      required: [
        true,
        manufacturing_product_validation_messages.MEASUREMENT_VALUE_REQUIRED,
      ],
      min: [
        manufacturing_product_validation_limits.MEASUREMENT_VALUE_MIN,
        manufacturing_product_validation_messages.MEASUREMENT_VALUE_MIN,
      ],
      max: [
        manufacturing_product_validation_limits.MEASUREMENT_VALUE_MAX,
        manufacturing_product_validation_messages.MEASUREMENT_VALUE_MAX,
      ],
    },
    raw_material: {
      type: [manufacturing_product_raw_material_schema],
      default: undefined,
      required: [
        true,
        manufacturing_product_validation_messages.RAW_MATERIAL_REQUIRED,
      ],
      validate: [
        {
          validator: (value) =>
            Array.isArray(value) &&
            value.length >=
              manufacturing_product_validation_limits.RAW_MATERIAL_MIN_ITEMS,
          message: manufacturing_product_validation_messages.RAW_MATERIAL_MIN,
        },
        {
          validator: (value) =>
            Array.isArray(value) &&
            value.length <=
              manufacturing_product_validation_limits.RAW_MATERIAL_MAX_ITEMS,
          message: manufacturing_product_validation_messages.RAW_MATERIAL_MAX,
        },
      ],
    },
    manufacturing_price: {
      type: Number,
      required: [
        true,
        manufacturing_product_validation_messages.MANUFACTURING_PRICE_REQUIRED,
      ],
      min: [
        manufacturing_product_validation_limits.AMOUNT_MIN,
        manufacturing_product_validation_messages.MANUFACTURING_PRICE_MIN,
      ],
      max: [
        manufacturing_product_validation_limits.AMOUNT_MAX,
        manufacturing_product_validation_messages.MANUFACTURING_PRICE_MAX,
      ],
    },
    selling_price: {
      type: Number,
      required: [
        true,
        manufacturing_product_validation_messages.SELLING_PRICE_REQUIRED,
      ],
      min: [
        manufacturing_product_validation_limits.AMOUNT_MIN,
        manufacturing_product_validation_messages.SELLING_PRICE_MIN,
      ],
      max: [
        manufacturing_product_validation_limits.AMOUNT_MAX,
        manufacturing_product_validation_messages.SELLING_PRICE_MAX,
      ],
    },
    discount: {
      type: Number,
      default: manufacturing_product_validation_limits.AMOUNT_MIN,
      min: [
        manufacturing_product_validation_limits.AMOUNT_MIN,
        manufacturing_product_validation_messages.DISCOUNT_MIN,
      ],
      max: [
        manufacturing_product_validation_limits.AMOUNT_MAX,
        manufacturing_product_validation_messages.DISCOUNT_MAX,
      ],
    },
    gst_percentage: {
      type: String,
      required: [
        true,
        manufacturing_product_validation_messages.GST_PERCENTAGE_REQUIRED,
      ],
      enum: {
        values: Object.values(gst_slab),
        message:
          manufacturing_product_validation_messages.GST_PERCENTAGE_INVALID,
      },
    },
    gst_amount: {
      type: Number,
      required: [
        true,
        manufacturing_product_validation_messages.GST_AMOUNT_REQUIRED,
      ],
      min: [
        manufacturing_product_validation_limits.AMOUNT_MIN,
        manufacturing_product_validation_messages.GST_AMOUNT_MIN,
      ],
      max: [
        manufacturing_product_validation_limits.AMOUNT_MAX,
        manufacturing_product_validation_messages.GST_AMOUNT_MAX,
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
      required: [
        true,
        manufacturing_product_validation_messages.CREATED_BY_REQUIRED,
      ],
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

// The product list is searched by name and filtered by measurement unit and
// active state, so the compound key leads with the unit. The code is looked up
// whole rather than searched, and its unique index already serves that.
manufacturing_product_schema.index({ product_name: "text" });
manufacturing_product_schema.index({ measurement_unit: 1, is_active: 1 });

// "Which products use this material" is the question a raw material price
// change asks, so the recipe's material is indexed. It is a multikey index,
// because the field sits inside an embedded array.
manufacturing_product_schema.index({
  "raw_material.material": 1,
  is_active: 1,
});

module.exports = mongoose.model(
  "ManufacturingProduct",
  manufacturing_product_schema,
);
