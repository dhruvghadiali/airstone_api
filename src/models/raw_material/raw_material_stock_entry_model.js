const mongoose = require("mongoose");

const { qa_failure_reason, raw_material_unit_of_measure } = require("@enums");
const {
  raw_material_stock_entry_bill_schema,
} = require("@models/raw_material/raw_material_stock_entry_bill_schema");
const {
  raw_material_stock_entry_vehicle_schema,
} = require("@models/raw_material/raw_material_stock_entry_vehicle_schema");
const {
  raw_material_stock_entry_validation_messages,
} = require("@validators/messages");
const {
  raw_material_stock_entry_validation_limits,
} = require("@validators/constants");

/**
 * One consignment of raw material arriving at the yard on one vehicle.
 *
 * This is a receipt, not a stock balance. It records what turned up, who handled
 * it and whether it passed its quality test. How much material the yard holds
 * right now is not stored here and is not a field on the raw material yet. The
 * movement ledger that will answer that is still to be built, and a received
 * entry will post a row into it.
 *
 * The consignment moves through four steps, and each is a date and the user who
 * did it: entered at the gate, received, unloaded, tested. Only the first is
 * required. The other three start null and are filled in as the consignment
 * moves, so a null reads as "not yet", never as missing data.
 *
 * That the four run in order is a rule about one field given another, so the
 * helper checks it rather than the schema.
 *
 * The fields:
 *
 * `material`, `supplier`, `purchase_orders` and the five user references only
 * declare their relationships. Whether each id points at a row that exists and
 * is still active is checked by the controller before the write. The `ref` here
 * only drives populate.
 *
 * `purchase_orders` is a list because one lorry often delivers against several
 * orders. Mongoose's `required` accepts an empty array, so the floor of one is a
 * length check of its own. That check is safe in the schema because it reads
 * nothing but the list in front of it, and it returns false for a value that is
 * not an array so it cannot throw on `undefined`.
 *
 * That every order on it belongs to this supplier and is for this material needs
 * two documents, so it is the helper's check.
 *
 * `unit` is copied onto the entry rather than read off the material, for the
 * same reason the purchase copies it: a past consignment keeps the unit it was
 * actually measured in.
 *
 * `qr_code` is the label stuck on the pile. It is unique, but through a partial
 * index rather than `unique: true` on the field. The field defaults to null, and
 * MongoDB treats every null as the same value, so a plain unique index would
 * accept the first consignment without a code and reject every one after it. The
 * partial index at the bottom of this file covers only the rows where the code
 * is a string.
 *
 * `is_qa_test_pass` starts true, so a consignment is good until a tester says
 * otherwise. `reason` says why it failed and is null while the test has passed.
 * There is no passing reason, because a second field saying what
 * `is_qa_test_pass` already says could disagree with it. That a reason is
 * present exactly when the test failed is the helper's check.
 *
 * `bills` is the papers that came with the lorry. `vehicle` is the lorry itself,
 * nested rather than spread across five columns. Both are embedded, and both
 * have their own file.
 *
 * `is_stock_used` is a flag the consuming endpoint sets. It is not derived from
 * a ledger, because that ledger does not exist yet.
 *
 * `created_by` and `updated_by` name users. `updated_by` starts null because an
 * entry that has only ever been created has not been updated by anyone. They are
 * not the same as `entry_by`: one is who typed the row, the other is who stood
 * at the gate.
 */
const raw_material_stock_entry_schema = new mongoose.Schema(
  {
    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RawMaterial",
      required: [
        true,
        raw_material_stock_entry_validation_messages.MATERIAL_REQUIRED,
      ],
      index: true,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: [
        true,
        raw_material_stock_entry_validation_messages.SUPPLIER_REQUIRED,
      ],
      index: true,
    },
    purchase_orders: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "RawMaterialPurchase",
      default: undefined,
      required: [
        true,
        raw_material_stock_entry_validation_messages.PURCHASE_ORDERS_REQUIRED,
      ],
      validate: {
        validator: (value) =>
          Array.isArray(value) &&
          value.length >=
            raw_material_stock_entry_validation_limits.PURCHASE_ORDERS_MIN_ITEMS,
        message:
          raw_material_stock_entry_validation_messages.PURCHASE_ORDERS_MIN,
      },
      index: true,
    },
    qty: {
      type: Number,
      required: [
        true,
        raw_material_stock_entry_validation_messages.QTY_REQUIRED,
      ],
      min: [
        raw_material_stock_entry_validation_limits.QTY_MIN,
        raw_material_stock_entry_validation_messages.QTY_MIN,
      ],
      max: [
        raw_material_stock_entry_validation_limits.QTY_MAX,
        raw_material_stock_entry_validation_messages.QTY_MAX,
      ],
    },
    unit: {
      type: String,
      required: [
        true,
        raw_material_stock_entry_validation_messages.UNIT_REQUIRED,
      ],
      enum: {
        values: Object.values(raw_material_unit_of_measure),
        message: raw_material_stock_entry_validation_messages.UNIT_INVALID,
      },
    },
    qr_code: {
      type: String,
      trim: true,
      default: null,
      minlength: [
        raw_material_stock_entry_validation_limits.QR_CODE_MIN,
        raw_material_stock_entry_validation_messages.QR_CODE_MIN,
      ],
      maxlength: [
        raw_material_stock_entry_validation_limits.QR_CODE_MAX,
        raw_material_stock_entry_validation_messages.QR_CODE_MAX,
      ],
    },
    entry_at: {
      type: Date,
      required: [
        true,
        raw_material_stock_entry_validation_messages.ENTRY_AT_REQUIRED,
      ],
    },
    entry_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [
        true,
        raw_material_stock_entry_validation_messages.ENTRY_BY_REQUIRED,
      ],
    },
    receiving_at: {
      type: Date,
      default: null,
    },
    received_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    unloading_at: {
      type: Date,
      default: null,
    },
    unloaded_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    tested_at: {
      type: Date,
      default: null,
    },
    tested_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    is_qa_test_pass: {
      type: Boolean,
      default: true,
      index: true,
    },
    reason: {
      type: String,
      default: null,
      enum: {
        values: Object.values(qa_failure_reason),
        message: raw_material_stock_entry_validation_messages.REASON_INVALID,
      },
    },
    notes: {
      type: String,
      required: [
        true,
        raw_material_stock_entry_validation_messages.NOTES_REQUIRED,
      ],
      trim: true,
      minlength: [
        raw_material_stock_entry_validation_limits.NOTES_MIN,
        raw_material_stock_entry_validation_messages.NOTES_MIN,
      ],
      maxlength: [
        raw_material_stock_entry_validation_limits.NOTES_MAX,
        raw_material_stock_entry_validation_messages.NOTES_MAX,
      ],
    },
    bills: {
      type: [raw_material_stock_entry_bill_schema],
      default: [],
    },
    vehicle: {
      type: raw_material_stock_entry_vehicle_schema,
      required: [
        true,
        raw_material_stock_entry_validation_messages.VEHICLE_REQUIRED,
      ],
    },
    is_stock_used: {
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
        raw_material_stock_entry_validation_messages.CREATED_BY_REQUIRED,
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

// The QR code is unique only across the rows that carry one. `$type: "string"`
// rather than `$exists: true` is what makes that work: the field defaults to
// null, so it exists on every row, and an $exists filter would pull all those
// nulls into the index and collide on the second one.
raw_material_stock_entry_schema.index(
  { qr_code: 1 },
  { unique: true, partialFilterExpression: { qr_code: { $type: "string" } } },
);

// Entries are read three ways: everything for one material, everything from one
// supplier newest first, and what is on hand -- material that passed its test
// and has not been used yet.
raw_material_stock_entry_schema.index({ material: 1, is_active: 1 });
raw_material_stock_entry_schema.index({ supplier: 1, entry_at: -1 });
raw_material_stock_entry_schema.index({
  material: 1,
  is_stock_used: 1,
  is_qa_test_pass: 1,
  is_active: 1,
});

module.exports = mongoose.model(
  "RawMaterialStockEntry",
  raw_material_stock_entry_schema,
);
