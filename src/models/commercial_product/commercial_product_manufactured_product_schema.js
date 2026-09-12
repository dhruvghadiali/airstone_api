const mongoose = require("mongoose");

const {
  commercial_product_manufactured_product_validation_messages,
} = require("@validators/messages");
const {
  commercial_product_manufactured_product_validation_limits,
} = require("@validators/constants");

/**
 * One manufactured product that goes into one commercial product.
 *
 * This is a sub-schema, not a model. It has no collection of its own. The
 * commercial product embeds a list of these, because a bundle is a handful of
 * lines and they are always read with the product they belong to.
 *
 * It lives in its own file so a line's fields can change without opening the
 * commercial product. It also keeps the commercial product's field list short
 * enough to scan.
 *
 * Each entry keeps its own `_id`. That is what lets an endpoint update or
 * remove one line instead of rewriting the whole list.
 *
 * The fields:
 *
 * `product` only declares the relationship. Whether the id points at a
 * manufacturing product that exists and is still active is checked by the
 * controller before the write. The `ref` here only drives populate.
 *
 * `qty` is how many units of the manufactured product go into one unit of the
 * commercial product. It is not held to whole numbers, because a product sold
 * by area or by length comes in fractions.
 *
 * A line carries no unit. The manufacturing product it points at already says
 * how it is measured, and a second copy here would drift from it.
 */
const commercial_product_manufactured_product_schema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ManufacturingProduct",
      required: [
        true,
        commercial_product_manufactured_product_validation_messages.PRODUCT_REQUIRED,
      ],
    },
    qty: {
      type: Number,
      required: [
        true,
        commercial_product_manufactured_product_validation_messages.QTY_REQUIRED,
      ],
      min: [
        commercial_product_manufactured_product_validation_limits.QTY_MIN,
        commercial_product_manufactured_product_validation_messages.QTY_MIN,
      ],
      max: [
        commercial_product_manufactured_product_validation_limits.QTY_MAX,
        commercial_product_manufactured_product_validation_messages.QTY_MAX,
      ],
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
    toJSON: { flattenMaps: true },
    toObject: { flattenMaps: true },
  },
);

module.exports = { commercial_product_manufactured_product_schema };
