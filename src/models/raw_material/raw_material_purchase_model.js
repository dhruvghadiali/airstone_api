const mongoose = require("mongoose");

const { gst_slab, raw_material_unit_of_measure } = require("@enums");
const {
  raw_material_purchase_payment_schema,
} = require("@models/raw_material/raw_material_purchase_payment_schema");
const {
  raw_material_purchase_validation_messages,
} = require("@validators/messages");
const {
  raw_material_purchase_validation_limits,
} = require("@validators/constants");

/**
 * One order placed with a supplier for one raw material.
 *
 * A purchase is a bill, so it is a record of what was agreed on the day it was
 * agreed. Nothing on it is recalculated later from the material or the supplier.
 *
 * Amounts are stored in rupees, not in paise. How many decimal places an amount
 * may carry is checked by the request validator, because a model may not import
 * from `@helpers`. Helpers still convert with `to_paisa` before they compare two
 * amounts, since adding floats does not land exactly.
 *
 * The fields:
 *
 * `material` and `supplier` only declare the relationships. Whether either id
 * points at a row that exists and is still active is checked by the controller
 * before the write, using `is_active_raw_material_exists` and
 * `is_active_company_exists`. The `ref` here only drives populate.
 *
 * `supplier` points at `Company` rather than at a supplier model of its own, for
 * the same reason it does on the raw material: the firm selling us sand is often
 * a firm we sell stone to.
 *
 * `purchase_date` and `expected_delivery_date` are days, not moments. The
 * controller stores each at IST midnight using `app_time`, so a purchase made
 * late in the evening does not read as the next day. That the delivery date is
 * not before the purchase date is a rule about two fields, so the helper checks
 * it.
 *
 * `qty` is not held to whole numbers. Half a tonne of sand is a real purchase.
 *
 * `unit` is copied onto the purchase rather than read off the material. A past
 * purchase keeps the unit it was actually bought in, even after the material is
 * changed to be counted another way. That the two agree at the time of writing
 * is the helper's check.
 *
 * `gst_percentage` is a String because the rate is a label on a bill and not a
 * number to do arithmetic on. `expected_gst_amount` converts it when the helper
 * needs to calculate.
 *
 * `gst_amount`, `discount_amount` and `discount_percentage` are all stored as
 * given rather than derived, because the figure on the supplier's invoice is
 * what has to be paid even when it disagrees with the arithmetic by a rupee.
 * The helper reconciles each against the others and reports a mismatch.
 *
 * `final_payment_amount` is the total on the invoice. It is stored for the same
 * reason, and the helper checks it against price plus GST minus discount.
 *
 * `payment` is the list of payments made against this bill. It is embedded
 * rather than a collection of its own, because a bill is settled in a handful of
 * payments and they are always read with it. Whether they add up to more than
 * `final_payment_amount` is the helper's check. The list starts empty, because a
 * purchase is usually raised before any money moves.
 *
 * `is_all_material_received` is a flag the receiving endpoint sets. It is not
 * derived from a stock ledger, because that ledger does not exist yet.
 *
 * `created_by` and `updated_by` name users. `updated_by` starts null because a
 * purchase that has only ever been created has not been updated by anyone.
 */
const raw_material_purchase_schema = new mongoose.Schema(
  {
    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RawMaterial",
      required: [
        true,
        raw_material_purchase_validation_messages.MATERIAL_REQUIRED,
      ],
      index: true,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: [
        true,
        raw_material_purchase_validation_messages.SUPPLIER_REQUIRED,
      ],
      index: true,
    },
    purchase_date: {
      type: Date,
      required: [
        true,
        raw_material_purchase_validation_messages.PURCHASE_DATE_REQUIRED,
      ],
    },
    expected_delivery_date: {
      type: Date,
      required: [
        true,
        raw_material_purchase_validation_messages.EXPECTED_DELIVERY_DATE_REQUIRED,
      ],
    },
    qty: {
      type: Number,
      default: raw_material_purchase_validation_limits.QTY_MIN,
      min: [
        raw_material_purchase_validation_limits.QTY_MIN,
        raw_material_purchase_validation_messages.QTY_MIN,
      ],
      max: [
        raw_material_purchase_validation_limits.QTY_MAX,
        raw_material_purchase_validation_messages.QTY_MAX,
      ],
    },
    unit: {
      type: String,
      required: [true, raw_material_purchase_validation_messages.UNIT_REQUIRED],
      enum: {
        values: Object.values(raw_material_unit_of_measure),
        message: raw_material_purchase_validation_messages.UNIT_INVALID,
      },
    },
    purchase_price: {
      type: Number,
      required: [
        true,
        raw_material_purchase_validation_messages.PURCHASE_PRICE_REQUIRED,
      ],
      min: [
        raw_material_purchase_validation_limits.AMOUNT_MIN,
        raw_material_purchase_validation_messages.PURCHASE_PRICE_MIN,
      ],
      max: [
        raw_material_purchase_validation_limits.AMOUNT_MAX,
        raw_material_purchase_validation_messages.PURCHASE_PRICE_MAX,
      ],
    },
    gst_percentage: {
      type: String,
      required: [
        true,
        raw_material_purchase_validation_messages.GST_PERCENTAGE_REQUIRED,
      ],
      enum: {
        values: Object.values(gst_slab),
        message:
          raw_material_purchase_validation_messages.GST_PERCENTAGE_INVALID,
      },
    },
    gst_amount: {
      type: Number,
      required: [
        true,
        raw_material_purchase_validation_messages.GST_AMOUNT_REQUIRED,
      ],
      min: [
        raw_material_purchase_validation_limits.AMOUNT_MIN,
        raw_material_purchase_validation_messages.GST_AMOUNT_MIN,
      ],
      max: [
        raw_material_purchase_validation_limits.AMOUNT_MAX,
        raw_material_purchase_validation_messages.GST_AMOUNT_MAX,
      ],
    },
    discount_amount: {
      type: Number,
      default: raw_material_purchase_validation_limits.AMOUNT_MIN,
      min: [
        raw_material_purchase_validation_limits.AMOUNT_MIN,
        raw_material_purchase_validation_messages.DISCOUNT_AMOUNT_MIN,
      ],
      max: [
        raw_material_purchase_validation_limits.AMOUNT_MAX,
        raw_material_purchase_validation_messages.DISCOUNT_AMOUNT_MAX,
      ],
    },
    discount_percentage: {
      type: Number,
      default: raw_material_purchase_validation_limits.DISCOUNT_PERCENTAGE_MIN,
      min: [
        raw_material_purchase_validation_limits.DISCOUNT_PERCENTAGE_MIN,
        raw_material_purchase_validation_messages.DISCOUNT_PERCENTAGE_MIN,
      ],
      max: [
        raw_material_purchase_validation_limits.DISCOUNT_PERCENTAGE_MAX,
        raw_material_purchase_validation_messages.DISCOUNT_PERCENTAGE_MAX,
      ],
    },
    final_payment_amount: {
      type: Number,
      required: [
        true,
        raw_material_purchase_validation_messages.FINAL_PAYMENT_AMOUNT_REQUIRED,
      ],
      min: [
        raw_material_purchase_validation_limits.AMOUNT_MIN,
        raw_material_purchase_validation_messages.FINAL_PAYMENT_AMOUNT_MIN,
      ],
      max: [
        raw_material_purchase_validation_limits.AMOUNT_MAX,
        raw_material_purchase_validation_messages.FINAL_PAYMENT_AMOUNT_MAX,
      ],
    },
    payment: {
      type: [raw_material_purchase_payment_schema],
      default: [],
    },
    is_all_material_received: {
      type: Boolean,
      default: false,
      index: true,
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
        raw_material_purchase_validation_messages.CREATED_BY_REQUIRED,
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

// Purchases are read two ways: everything ordered for one material, and
// everything bought from one supplier newest first. There is no text index,
// because a purchase carries no text of its own -- a search by material name
// runs against the raw material and follows the reference here.
raw_material_purchase_schema.index({ material: 1, is_active: 1 });
raw_material_purchase_schema.index({ supplier: 1, purchase_date: -1 });

module.exports = mongoose.model(
  "RawMaterialPurchase",
  raw_material_purchase_schema,
);
