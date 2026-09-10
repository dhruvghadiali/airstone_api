const mongoose = require("mongoose");

const {
  raw_material_stock_entry_bill_validation_messages,
} = require("@validators/messages");
const {
  raw_material_stock_entry_bill_validation_limits,
} = require("@validators/constants");

/**
 * One bill that arrived with a consignment.
 *
 * This is a sub-schema, not a model. It has no collection of its own. The stock
 * entry embeds a list of these, because a lorry carries a handful of papers and
 * they are always read with the consignment they came with.
 *
 * It lives in its own file so a bill's fields can change without opening the
 * stock entry. Each entry keeps its own `_id`, which is what lets an endpoint
 * update or remove one bill instead of rewriting the list.
 *
 * The fields:
 *
 * `bill_number` is the supplier's number, so it is not unique here. Two
 * suppliers number their bills from 1, and the same supplier can send a
 * corrected bill under the same number.
 *
 * `bill_amount` is in rupees, like every amount in this module. How many decimal
 * places it may carry is checked by the request validator, because a model may
 * not import from `@helpers`.
 *
 * `file_url` is a link to the scanned bill, not the file. Nothing is stored in
 * the database but the address. It is optional because a paper bill is often
 * entered before anyone scans it.
 *
 * That a bill is not dated after the consignment it arrived with is a rule about
 * two documents, so the stock entry helper checks it.
 */
const raw_material_stock_entry_bill_schema = new mongoose.Schema(
  {
    bill_number: {
      type: String,
      required: [
        true,
        raw_material_stock_entry_bill_validation_messages.BILL_NUMBER_REQUIRED,
      ],
      trim: true,
      minlength: [
        raw_material_stock_entry_bill_validation_limits.BILL_NUMBER_MIN,
        raw_material_stock_entry_bill_validation_messages.BILL_NUMBER_MIN,
      ],
      maxlength: [
        raw_material_stock_entry_bill_validation_limits.BILL_NUMBER_MAX,
        raw_material_stock_entry_bill_validation_messages.BILL_NUMBER_MAX,
      ],
    },
    bill_date: {
      type: Date,
      required: [
        true,
        raw_material_stock_entry_bill_validation_messages.BILL_DATE_REQUIRED,
      ],
    },
    bill_amount: {
      type: Number,
      required: [
        true,
        raw_material_stock_entry_bill_validation_messages.BILL_AMOUNT_REQUIRED,
      ],
      min: [
        raw_material_stock_entry_bill_validation_limits.BILL_AMOUNT_MIN,
        raw_material_stock_entry_bill_validation_messages.BILL_AMOUNT_MIN,
      ],
      max: [
        raw_material_stock_entry_bill_validation_limits.BILL_AMOUNT_MAX,
        raw_material_stock_entry_bill_validation_messages.BILL_AMOUNT_MAX,
      ],
    },
    file_url: {
      type: String,
      trim: true,
      default: null,
      minlength: [
        raw_material_stock_entry_bill_validation_limits.FILE_URL_MIN,
        raw_material_stock_entry_bill_validation_messages.FILE_URL_MIN,
      ],
      maxlength: [
        raw_material_stock_entry_bill_validation_limits.FILE_URL_MAX,
        raw_material_stock_entry_bill_validation_messages.FILE_URL_MAX,
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

module.exports = { raw_material_stock_entry_bill_schema };
