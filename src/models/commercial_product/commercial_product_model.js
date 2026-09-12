const mongoose = require("mongoose");

const { gst_slab } = require("@enums");
const {
  commercial_product_manufactured_product_schema,
} = require("@models/commercial_product/commercial_product_manufactured_product_schema");
const {
  commercial_product_validation_messages,
} = require("@validators/messages");
const {
  commercial_product_validation_limits,
  commercial_product_validation_patterns,
} = require("@validators/constants");

/**
 * A product the sales team sells, such as a packed pallet of pavers.
 *
 * This is the sellable item. A manufacturing product is what the plant makes. A
 * commercial product is one or more of those, bundled, packed, priced and put
 * in front of a client. The two are kept apart because the plant and the sales
 * desk change for different reasons.
 *
 * It is not a stock count. How many units are on hand is not stored here. The
 * finished goods ledger that will answer that is still to be built.
 *
 * Amounts are stored in rupees, not paise. How many decimal places an amount
 * may carry is checked by the request validator, because a model may not import
 * from `@helpers`. Helpers still convert with `to_paisa` before they compare
 * two amounts, since adding floats does not land exactly.
 *
 * The fields:
 *
 * `product_code` identifies the product, so it carries the unique index and
 * `product_name` does not. The same pallet is listed under two names by two
 * dealers.
 *
 * The code is uppercased and matched against a pattern, so one product has one
 * spelling. A code sent as "cp-01" is stored as "CP-01".
 *
 * That unique index is global and deletes here are soft. So a deactivated
 * product keeps its code reserved. That is deliberate. The code names a real
 * product whether or not sales still offers it. It does mean a product cannot
 * be deleted and entered again under the same code.
 *
 * `clients` is who this product is offered to. Each entry points at a
 * `Company`, because a client is a firm we sell to and that is already the
 * company collection. Whether each id points at a company that exists, is still
 * active and is one we sell to is the controller's check.
 *
 * The list starts empty. A product offered to every client is tied to none of
 * them, so an empty list is a normal product and not a missing one. Its floor
 * of 0 is recorded in the limits for the request validator. Only the ceiling is
 * checked here, because an array is never shorter than nothing.
 *
 * `manufactured_product` is what the bundle holds: which manufacturing products
 * go into it and how many of each. It is embedded rather than a collection of
 * its own, because a bundle is a handful of lines and they are always read with
 * the product.
 *
 * Mongoose's `required` accepts an empty array, so the floor of one line is a
 * length check of its own. That check is safe in the schema because it reads
 * nothing but the list in front of it. It returns false for a value that is not
 * an array, so it cannot throw on `undefined`.
 *
 * That every line points at an active manufacturing product is the controller's
 * check, because it needs a second document. That the same product is not
 * listed twice is the helper's.
 *
 * `product_price` is what the bundle itself is priced at before packing and
 * selling it. `packaging_cost`, `marketing_cost` and `other_cost` are what is
 * spent on top of that. The three start at 0, because a product carries none of
 * them until someone records one.
 *
 * All four are stored as given rather than added up from the manufactured
 * products. A price is set by the sales team, not by summing what the plant
 * charges.
 *
 * `selling_price` is what the product is listed at. That it is not below the
 * four cost columns together is a rule about five fields, so the helper checks
 * it.
 *
 * `discount` is an amount off the selling price, not a percentage. It starts at
 * 0, because a product is sold at list price until someone discounts it. That
 * it is not larger than the selling price is the helper's check.
 *
 * `gst_percentage` is a String because the rate is a label on a bill and not a
 * number to do arithmetic on. `expected_gst_amount` converts it when the helper
 * needs to calculate.
 *
 * `gst_amount` is stored as given rather than derived, for the same reason the
 * manufacturing product stores it. The figure on the invoice is what has to be
 * paid, even when it disagrees with the arithmetic by a rupee. The helper
 * reconciles it against the selling price and the slab, and reports a mismatch.
 *
 * Its floor is 0 and not 1, because the zero GST slab is real. A product in it
 * stores a GST amount of 0.
 *
 * `created_by` and `updated_by` name users. `updated_by` starts null because a
 * product that has only ever been created has not been updated by anyone.
 */
const commercial_product_schema = new mongoose.Schema(
  {
    product_name: {
      type: String,
      required: [
        true,
        commercial_product_validation_messages.PRODUCT_NAME_REQUIRED,
      ],
      trim: true,
      minlength: [
        commercial_product_validation_limits.PRODUCT_NAME_MIN,
        commercial_product_validation_messages.PRODUCT_NAME_MIN,
      ],
      maxlength: [
        commercial_product_validation_limits.PRODUCT_NAME_MAX,
        commercial_product_validation_messages.PRODUCT_NAME_MAX,
      ],
      index: true,
    },
    product_code: {
      type: String,
      required: [
        true,
        commercial_product_validation_messages.PRODUCT_CODE_REQUIRED,
      ],
      unique: true,
      trim: true,
      uppercase: true,
      minlength: [
        commercial_product_validation_limits.PRODUCT_CODE_MIN,
        commercial_product_validation_messages.PRODUCT_CODE_MIN,
      ],
      maxlength: [
        commercial_product_validation_limits.PRODUCT_CODE_MAX,
        commercial_product_validation_messages.PRODUCT_CODE_MAX,
      ],
      match: [
        commercial_product_validation_patterns.PRODUCT_CODE,
        commercial_product_validation_messages.PRODUCT_CODE_INVALID,
      ],
    },
    clients: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Company" }],
      default: [],
      validate: {
        validator: (value) =>
          Array.isArray(value) &&
          value.length <= commercial_product_validation_limits.CLIENTS_MAX_ITEMS,
        message: commercial_product_validation_messages.CLIENTS_MAX,
      },
    },
    manufactured_product: {
      type: [commercial_product_manufactured_product_schema],
      default: undefined,
      required: [
        true,
        commercial_product_validation_messages.MANUFACTURED_PRODUCT_REQUIRED,
      ],
      validate: [
        {
          validator: (value) =>
            Array.isArray(value) &&
            value.length >=
              commercial_product_validation_limits.MANUFACTURED_PRODUCT_MIN_ITEMS,
          message:
            commercial_product_validation_messages.MANUFACTURED_PRODUCT_MIN,
        },
        {
          validator: (value) =>
            Array.isArray(value) &&
            value.length <=
              commercial_product_validation_limits.MANUFACTURED_PRODUCT_MAX_ITEMS,
          message:
            commercial_product_validation_messages.MANUFACTURED_PRODUCT_MAX,
        },
      ],
    },
    product_price: {
      type: Number,
      required: [
        true,
        commercial_product_validation_messages.PRODUCT_PRICE_REQUIRED,
      ],
      min: [
        commercial_product_validation_limits.AMOUNT_MIN,
        commercial_product_validation_messages.PRODUCT_PRICE_MIN,
      ],
      max: [
        commercial_product_validation_limits.AMOUNT_MAX,
        commercial_product_validation_messages.PRODUCT_PRICE_MAX,
      ],
    },
    packaging_cost: {
      type: Number,
      default: commercial_product_validation_limits.AMOUNT_MIN,
      min: [
        commercial_product_validation_limits.AMOUNT_MIN,
        commercial_product_validation_messages.PACKAGING_COST_MIN,
      ],
      max: [
        commercial_product_validation_limits.AMOUNT_MAX,
        commercial_product_validation_messages.PACKAGING_COST_MAX,
      ],
    },
    marketing_cost: {
      type: Number,
      default: commercial_product_validation_limits.AMOUNT_MIN,
      min: [
        commercial_product_validation_limits.AMOUNT_MIN,
        commercial_product_validation_messages.MARKETING_COST_MIN,
      ],
      max: [
        commercial_product_validation_limits.AMOUNT_MAX,
        commercial_product_validation_messages.MARKETING_COST_MAX,
      ],
    },
    other_cost: {
      type: Number,
      default: commercial_product_validation_limits.AMOUNT_MIN,
      min: [
        commercial_product_validation_limits.AMOUNT_MIN,
        commercial_product_validation_messages.OTHER_COST_MIN,
      ],
      max: [
        commercial_product_validation_limits.AMOUNT_MAX,
        commercial_product_validation_messages.OTHER_COST_MAX,
      ],
    },
    selling_price: {
      type: Number,
      required: [
        true,
        commercial_product_validation_messages.SELLING_PRICE_REQUIRED,
      ],
      min: [
        commercial_product_validation_limits.AMOUNT_MIN,
        commercial_product_validation_messages.SELLING_PRICE_MIN,
      ],
      max: [
        commercial_product_validation_limits.AMOUNT_MAX,
        commercial_product_validation_messages.SELLING_PRICE_MAX,
      ],
    },
    discount: {
      type: Number,
      default: commercial_product_validation_limits.AMOUNT_MIN,
      min: [
        commercial_product_validation_limits.AMOUNT_MIN,
        commercial_product_validation_messages.DISCOUNT_MIN,
      ],
      max: [
        commercial_product_validation_limits.AMOUNT_MAX,
        commercial_product_validation_messages.DISCOUNT_MAX,
      ],
    },
    gst_percentage: {
      type: String,
      required: [
        true,
        commercial_product_validation_messages.GST_PERCENTAGE_REQUIRED,
      ],
      enum: {
        values: Object.values(gst_slab),
        message: commercial_product_validation_messages.GST_PERCENTAGE_INVALID,
      },
    },
    gst_amount: {
      type: Number,
      required: [
        true,
        commercial_product_validation_messages.GST_AMOUNT_REQUIRED,
      ],
      min: [
        commercial_product_validation_limits.AMOUNT_MIN,
        commercial_product_validation_messages.GST_AMOUNT_MIN,
      ],
      max: [
        commercial_product_validation_limits.AMOUNT_MAX,
        commercial_product_validation_messages.GST_AMOUNT_MAX,
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
        commercial_product_validation_messages.CREATED_BY_REQUIRED,
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

// The product list is searched by name and filtered by active state. The code
// is looked up whole rather than searched, and its unique index already serves
// that.
commercial_product_schema.index({ product_name: "text" });

// "What do we sell this client" is the question a client screen asks, so the
// client list is indexed. It is a multikey index, because the field holds an
// array.
commercial_product_schema.index({ clients: 1, is_active: 1 });

// "Which commercial products contain this manufactured product" is the question
// a price change asks, so the line's product is indexed. It is a multikey
// index, because the field sits inside an embedded array.
commercial_product_schema.index({
  "manufactured_product.product": 1,
  is_active: 1,
});

module.exports = mongoose.model("CommercialProduct", commercial_product_schema);
