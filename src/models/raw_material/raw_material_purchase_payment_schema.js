const mongoose = require("mongoose");

const { payment_type } = require("@enums");
const {
  raw_material_purchase_payment_validation_messages,
} = require("@validators/messages");
const {
  raw_material_purchase_payment_validation_limits,
} = require("@validators/constants");

/**
 * One payment made against a raw material purchase.
 *
 * This is a sub-schema, not a model. It has no collection of its own. The
 * purchase embeds a list of these, because a bill is settled in a handful of
 * payments and they are always read with the bill they belong to. An address or
 * a contact is a separate collection for the opposite reason: those lists grow
 * without limit and are edited on their own.
 *
 * It lives in its own file so the payment's fields can be changed without
 * opening the purchase, and so the purchase's field list stays short enough to
 * scan.
 *
 * Each entry keeps its own `_id`, which is what lets an endpoint update or
 * remove one payment instead of rewriting the whole list.
 *
 * The fields:
 *
 * `payment_reference` is the number the bank or the cheque carries. It is
 * optional here because a cash payment has none. For every other payment type it
 * is required, and that is a rule about one field given another, so the purchase
 * helper enforces it rather than this schema.
 *
 * `paid_amount` is in rupees, like every amount on the purchase. How many
 * decimal places it may carry is checked by the request validator, because a
 * model may not import from `@helpers`.
 *
 * `paid_on` is when the money actually moved, which is not always when the entry
 * was typed. It defaults to now for the common case where the two are the same.
 *
 * `created_by` is who recorded the payment. A money row that cannot be
 * attributed is hard to reconcile against a bank statement later. There is no
 * `updated_by`, because a wrong payment is removed and entered again rather than
 * edited into a different one.
 */
const raw_material_purchase_payment_schema = new mongoose.Schema(
  {
    payment_type: {
      type: String,
      required: [
        true,
        raw_material_purchase_payment_validation_messages.PAYMENT_TYPE_REQUIRED,
      ],
      enum: {
        values: Object.values(payment_type),
        message:
          raw_material_purchase_payment_validation_messages.PAYMENT_TYPE_INVALID,
      },
    },
    payment_reference: {
      type: String,
      trim: true,
      default: null,
      minlength: [
        raw_material_purchase_payment_validation_limits.PAYMENT_REFERENCE_MIN,
        raw_material_purchase_payment_validation_messages.PAYMENT_REFERENCE_MIN,
      ],
      maxlength: [
        raw_material_purchase_payment_validation_limits.PAYMENT_REFERENCE_MAX,
        raw_material_purchase_payment_validation_messages.PAYMENT_REFERENCE_MAX,
      ],
    },
    paid_amount: {
      type: Number,
      required: [
        true,
        raw_material_purchase_payment_validation_messages.PAID_AMOUNT_REQUIRED,
      ],
      min: [
        raw_material_purchase_payment_validation_limits.PAID_AMOUNT_MIN,
        raw_material_purchase_payment_validation_messages.PAID_AMOUNT_MIN,
      ],
      max: [
        raw_material_purchase_payment_validation_limits.PAID_AMOUNT_MAX,
        raw_material_purchase_payment_validation_messages.PAID_AMOUNT_MAX,
      ],
    },
    paid_on: {
      type: Date,
      required: [
        true,
        raw_material_purchase_payment_validation_messages.PAID_ON_REQUIRED,
      ],
      default: Date.now,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [
        true,
        raw_material_purchase_payment_validation_messages.CREATED_BY_REQUIRED,
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

module.exports = { raw_material_purchase_payment_schema };
