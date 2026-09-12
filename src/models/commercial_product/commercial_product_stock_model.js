const mongoose = require("mongoose");

const {
  commercial_product_stock_validation_messages,
} = require("@validators/messages");
const {
  commercial_product_stock_validation_limits,
} = require("@validators/constants");

/**
 * One quantity of one commercial product, tested and accepted into sellable
 * stock.
 *
 * This is where a finished batch becomes something sales can sell. A
 * manufacturing log says what a batch produced. A row here says those units
 * were tested, how many of them are sellable, and which product they are
 * sellable as.
 *
 * It is still not a running balance. A row records what came in. Nothing here
 * goes down as units leave. The finished goods movement ledger that will answer
 * how much is on hand is still to be built, and a row here is what will post
 * its `in` line. This is the same split the raw material module makes between a
 * stock entry and its ledger.
 *
 * The fields:
 *
 * `product` and the three user references only declare their relationships.
 * Whether each id points at a row that exists and is still active is checked by
 * the controller before the write. The `ref` here only drives populate.
 *
 * `manufacturing_logs` names the batches this stock came off. It is a list
 * because one booking often covers several batches, the way one lorry delivers
 * against several purchase orders.
 *
 * Mongoose's `required` accepts an empty array, so the floor of one log is a
 * length check of its own. That check is safe in the schema because it reads
 * nothing but the list in front of it. It returns false for a value that is not
 * an array, so it cannot throw on `undefined`.
 *
 * A log may be booked into stock once. The unique index at the bottom of this
 * file is what enforces it, and it is what stops one batch being counted as
 * stock twice. It does not stop the same log appearing twice inside one list,
 * because a unique index ignores repeats within a single document. The helper
 * checks that.
 *
 * That each log has ended, has been accepted into sellable stock, and is a
 * batch of a product this commercial product actually contains all need a
 * second document. So the helper checks all three. The last one is what stops a
 * batch of wall tile being booked as stock of a paver.
 *
 * `qty` is how many units this row holds. Its floor is 1, because a row that
 * holds nothing is not a row. It is not held to whole numbers, because a
 * product sold by area or by length comes off the line in fractions. That it is
 * not more than the listed batches produced is the helper's check.
 *
 * `tested_at` and `tested_by` are the quality test that let the stock through.
 * Both are required, because an untested quantity is not sellable stock. That
 * `tested_at` is not in the future is the helper's check.
 *
 * `tested_by` is not the same as `created_by`. One is who tested the stock, the
 * other is who typed the row.
 *
 * `is_stock_sell` says the stock has been sold. It starts false, because a row
 * is on hand until a sale takes it. It is a flag the selling endpoint sets, not
 * a figure derived from a ledger, because that ledger does not exist yet.
 *
 * The flag covers the whole row, so a row is sold all at once or not at all. A
 * part sold cannot be recorded until the ledger is built. This is the same
 * shape `is_stock_used` takes on a raw material stock entry.
 *
 * `created_by` and `updated_by` name users. `updated_by` starts null because a
 * row that has only ever been created has not been updated by anyone.
 */
const commercial_product_stock_schema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CommercialProduct",
      required: [
        true,
        commercial_product_stock_validation_messages.PRODUCT_REQUIRED,
      ],
      index: true,
    },
    manufacturing_logs: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "ManufacturingLog",
      default: undefined,
      required: [
        true,
        commercial_product_stock_validation_messages.MANUFACTURING_LOGS_REQUIRED,
      ],
      validate: [
        {
          validator: (value) =>
            Array.isArray(value) &&
            value.length >=
              commercial_product_stock_validation_limits.MANUFACTURING_LOGS_MIN_ITEMS,
          message:
            commercial_product_stock_validation_messages.MANUFACTURING_LOGS_MIN,
        },
        {
          validator: (value) =>
            Array.isArray(value) &&
            value.length <=
              commercial_product_stock_validation_limits.MANUFACTURING_LOGS_MAX_ITEMS,
          message:
            commercial_product_stock_validation_messages.MANUFACTURING_LOGS_MAX,
        },
      ],
    },
    qty: {
      type: Number,
      required: [
        true,
        commercial_product_stock_validation_messages.QTY_REQUIRED,
      ],
      min: [
        commercial_product_stock_validation_limits.QTY_MIN,
        commercial_product_stock_validation_messages.QTY_MIN,
      ],
      max: [
        commercial_product_stock_validation_limits.QTY_MAX,
        commercial_product_stock_validation_messages.QTY_MAX,
      ],
    },
    tested_at: {
      type: Date,
      required: [
        true,
        commercial_product_stock_validation_messages.TESTED_AT_REQUIRED,
      ],
    },
    tested_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [
        true,
        commercial_product_stock_validation_messages.TESTED_BY_REQUIRED,
      ],
    },
    is_stock_sell: {
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
        commercial_product_stock_validation_messages.CREATED_BY_REQUIRED,
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

// "What sellable stock do we hold of this product" is the only question a sales
// screen asks, so the compound key leads with the product. There is no text
// index, because a stock row carries no text of its own. A search by product
// name runs against the commercial product and follows the reference here.
commercial_product_stock_schema.index({
  product: 1,
  is_stock_sell: 1,
  is_active: 1,
});

// A batch is booked into stock once. This is a multikey index, because the
// field holds an array, so the unique rule applies to each log in it. That is
// what stops one batch being counted as stock twice.
//
// It is partial rather than plain, so it covers only active rows. A deleted
// stock row frees its logs to be booked again. A plain unique index would keep
// them reserved for good, because deletes here are soft.
//
// It also answers "which stock row did this batch go into", so no second index
// on the list is needed.
commercial_product_stock_schema.index(
  { manufacturing_logs: 1 },
  { unique: true, partialFilterExpression: { is_active: true } },
);

// The stock list is read newest test first.
commercial_product_stock_schema.index({ tested_at: -1 });

module.exports = mongoose.model(
  "CommercialProductStock",
  commercial_product_stock_schema,
);
