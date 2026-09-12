const mongoose = require("mongoose");

const {
  manufacturing_log_raw_material_schema,
} = require("@models/manufacturing_log/manufacturing_log_raw_material_schema");
const {
  manufacturing_log_validation_messages,
} = require("@validators/messages");
const {
  manufacturing_log_validation_limits,
} = require("@validators/constants");

/**
 * One batch of one manufacturing product, from the moment production starts to
 * the moment it ends.
 *
 * A log is a production record. It says what a batch set out to make, what it
 * actually made, what it damaged, and what raw material it burned through. It is
 * written when production starts, so most of that is empty at first and is
 * filled in as the batch runs.
 *
 * A log is not a stock balance. `final_qty_in_batch` says what one batch
 * produced. Nothing here goes down as those units are sold. The finished goods
 * movement ledger that will answer how much sellable stock the plant holds is
 * still to be built, and a log marked as commercial is what will post the `in`
 * row. This is the same split the raw material module makes between a stock
 * entry and its ledger.
 *
 * NOTE: what happens to `damaged_qty_in_batch` is not decided. The company has
 * not settled whether damaged units are sold at a lower grade or destroyed. The
 * field records the count and nothing acts on it. Whichever way that decision
 * goes, it will need work here: selling them needs a grade and a price, and
 * destroying them needs a write-off record. Neither is built.
 *
 * The batch has two steps, and each is a time and the user who did it: started,
 * and ended. Only the first is required. The second starts null and is filled in
 * when the batch closes, so a null reads as "still running", never as missing
 * data.
 *
 * That the two run in order, and that `end_at` and `end_by` are set together,
 * are rules about one field given another. The helper checks both.
 *
 * The fields:
 *
 * `product` and the four user references only declare their relationships.
 * Whether each id points at a row that exists and is still active is checked by
 * the controller before the write. The `ref` here only drives populate.
 *
 * `expected_qty_in_batch` is what the batch set out to make. Its floor is 1,
 * because a batch that aims at nothing is not a batch.
 *
 * `final_qty_in_batch` and `damaged_qty_in_batch` both start at 0. A batch that
 * has only just started has made nothing and damaged nothing, and a batch that
 * ends with nothing usable really does finish at 0. Neither is held to whole
 * numbers, because a product sold by area or by length comes off the line in
 * fractions.
 *
 * That the two together do not come to more than the expected quantity is a rule
 * about three fields, so the helper checks it.
 *
 * `raw_material` is what the batch actually consumed. It is not the product's
 * recipe. The recipe says what one unit should take; this says what this batch
 * did take, and the two differ every time.
 *
 * Mongoose's `required` accepts an empty array, so the floor of one line is a
 * length check of its own. That check is safe in the schema because it reads
 * nothing but the list in front of it, and it returns false for a value that is
 * not an array so it cannot throw on `undefined`.
 *
 * `raw_material_waste` is what the batch spoiled rather than turned into
 * product. It starts empty and carries no floor, because a clean batch wastes
 * nothing. An empty waste list is a normal batch, not a missing one.
 *
 * Both lists use the same sub-schema. A wasted material and a consumed material
 * are the same three fields, and which list a line sits in is what gives it its
 * meaning.
 *
 * `is_final_qty_in_commercial_product` says the good units have been accepted
 * into sellable stock. It starts false, because a batch is a production record
 * until someone signs its output over to sales. The endpoint that closes a batch
 * is what moves it, and the helper refuses to set it on a batch that has not
 * ended or that produced no usable units.
 *
 * `created_by` and `updated_by` name users. `updated_by` starts null because a
 * log that has only ever been created has not been updated by anyone. They are
 * not the same as `start_by` and `end_by`: one pair is who typed the row, the
 * other is who ran the batch.
 */
const manufacturing_log_schema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ManufacturingProduct",
      required: [true, manufacturing_log_validation_messages.PRODUCT_REQUIRED],
      index: true,
    },
    start_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, manufacturing_log_validation_messages.START_BY_REQUIRED],
    },
    start_at: {
      type: Date,
      required: [true, manufacturing_log_validation_messages.START_AT_REQUIRED],
    },
    end_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    end_at: {
      type: Date,
      default: null,
    },
    expected_qty_in_batch: {
      type: Number,
      required: [
        true,
        manufacturing_log_validation_messages.EXPECTED_QTY_IN_BATCH_REQUIRED,
      ],
      min: [
        manufacturing_log_validation_limits.EXPECTED_QTY_MIN,
        manufacturing_log_validation_messages.EXPECTED_QTY_IN_BATCH_MIN,
      ],
      max: [
        manufacturing_log_validation_limits.EXPECTED_QTY_MAX,
        manufacturing_log_validation_messages.EXPECTED_QTY_IN_BATCH_MAX,
      ],
    },
    final_qty_in_batch: {
      type: Number,
      default: manufacturing_log_validation_limits.BATCH_QTY_MIN,
      min: [
        manufacturing_log_validation_limits.BATCH_QTY_MIN,
        manufacturing_log_validation_messages.FINAL_QTY_IN_BATCH_MIN,
      ],
      max: [
        manufacturing_log_validation_limits.BATCH_QTY_MAX,
        manufacturing_log_validation_messages.FINAL_QTY_IN_BATCH_MAX,
      ],
    },
    damaged_qty_in_batch: {
      type: Number,
      default: manufacturing_log_validation_limits.BATCH_QTY_MIN,
      min: [
        manufacturing_log_validation_limits.BATCH_QTY_MIN,
        manufacturing_log_validation_messages.DAMAGED_QTY_IN_BATCH_MIN,
      ],
      max: [
        manufacturing_log_validation_limits.BATCH_QTY_MAX,
        manufacturing_log_validation_messages.DAMAGED_QTY_IN_BATCH_MAX,
      ],
    },
    raw_material: {
      type: [manufacturing_log_raw_material_schema],
      default: undefined,
      required: [
        true,
        manufacturing_log_validation_messages.RAW_MATERIAL_REQUIRED,
      ],
      validate: [
        {
          validator: (value) =>
            Array.isArray(value) &&
            value.length >=
              manufacturing_log_validation_limits.RAW_MATERIAL_MIN_ITEMS,
          message: manufacturing_log_validation_messages.RAW_MATERIAL_MIN,
        },
        {
          validator: (value) =>
            Array.isArray(value) &&
            value.length <=
              manufacturing_log_validation_limits.RAW_MATERIAL_MAX_ITEMS,
          message: manufacturing_log_validation_messages.RAW_MATERIAL_MAX,
        },
      ],
    },
    raw_material_waste: {
      type: [manufacturing_log_raw_material_schema],
      default: [],
      validate: {
        validator: (value) =>
          Array.isArray(value) &&
          value.length <=
            manufacturing_log_validation_limits.RAW_MATERIAL_WASTE_MAX_ITEMS,
        message: manufacturing_log_validation_messages.RAW_MATERIAL_WASTE_MAX,
      },
    },
    is_final_qty_in_commercial_product: {
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
        manufacturing_log_validation_messages.CREATED_BY_REQUIRED,
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

// Logs are read three ways: every batch of one product, the newest batches
// across the plant, and what finished stock is on hand -- batches of one product
// whose output has been accepted into sellable stock. There is no text index,
// because a log carries no text of its own. A search by product name runs
// against the manufacturing product and follows the reference here.
manufacturing_log_schema.index({ product: 1, is_active: 1 });
manufacturing_log_schema.index({ start_at: -1 });
manufacturing_log_schema.index({
  product: 1,
  is_final_qty_in_commercial_product: 1,
  is_active: 1,
});

// "Which batches used this material" is the question a bad consignment asks, so
// the consumed material is indexed. It is a multikey index, because the field
// sits inside an embedded array. The waste list is not indexed; nothing queries
// it yet.
manufacturing_log_schema.index({ "raw_material.material": 1, is_active: 1 });

module.exports = mongoose.model("ManufacturingLog", manufacturing_log_schema);
