const mongoose = require("mongoose");

const { company_type } = require("@enums");
const { company_validation_messages } = require("@validators/messages");
const {
  validation_patterns,
  user_validation_limits,
  company_validation_limits,
  company_validation_patterns,
} = require("@validators/constants");

/**
 * A firm AIRSTONE buys stone from, sells stone to, or both.
 *
 * The fields:
 *
 * `company_type` is what the firm is to us rather than what it is in general,
 * which is why `both` is a value of its own instead of two company records for
 * one legal entity.
 *
 * `email` and `phone_number` are the firm's own, not a person's. A named person
 * at the firm is a `CompanyContact`. Both are indexed but not unique, because
 * every branch of a firm often shares one head office number. Their formats come
 * from `validation_patterns` in `common`, and their bounds from
 * `user_validation_limits`, so a company and a user are held to one rule.
 *
 * `gst_number` and `pan_number` are the two things that actually identify the
 * firm, so they carry the unique indexes and `company_name` does not -- two
 * traders really can both be "Shree Stone Traders".
 *
 * Both are required. If a walk-in customer without a GST registration has to be
 * recorded, they cannot simply be made optional: `unique` treats every missing
 * value as the same value, so the second such customer would be rejected as a
 * duplicate. Making them optional means making both indexes partial.
 *
 * Deletes here are soft, so a deactivated company keeps its GST and PAN
 * reserved. That is deliberate -- the numbers belong to a real firm whether or
 * not we still trade with it -- but it means a company cannot be deleted and
 * re-entered under the same GST number.
 *
 * `created_by` and `updated_by` name users. `updated_by` starts null because a
 * company that has only ever been created has not been updated by anyone.
 * Whether either id points at a user who exists and is still active is the
 * controller's check, not the schema's; the `ref` here only drives populate.
 */
const company_schema = new mongoose.Schema(
  {
    company_name: {
      type: String,
      required: [true, company_validation_messages.COMPANY_NAME_REQUIRED],
      trim: true,
      minlength: [
        company_validation_limits.COMPANY_NAME_MIN,
        company_validation_messages.COMPANY_NAME_MIN,
      ],
      maxlength: [
        company_validation_limits.COMPANY_NAME_MAX,
        company_validation_messages.COMPANY_NAME_MAX,
      ],
      index: true,
    },
    company_type: {
      type: String,
      required: [true, company_validation_messages.COMPANY_TYPE_REQUIRED],
      enum: {
        values: Object.values(company_type),
        message: company_validation_messages.COMPANY_TYPE_INVALID,
      },
      index: true,
    },
    email: {
      type: String,
      required: [true, company_validation_messages.EMAIL_REQUIRED],
      trim: true,
      lowercase: true,
      minlength: [
        user_validation_limits.EMAIL_MIN,
        company_validation_messages.EMAIL_MIN,
      ],
      maxlength: [
        user_validation_limits.EMAIL_MAX,
        company_validation_messages.EMAIL_MAX,
      ],
      match: [
        validation_patterns.EMAIL,
        company_validation_messages.EMAIL_INVALID,
      ],
      index: true,
    },
    phone_number: {
      type: String,
      required: [true, company_validation_messages.PHONE_NUMBER_REQUIRED],
      trim: true,
      minlength: [
        user_validation_limits.PHONE_NUMBER_MIN,
        company_validation_messages.PHONE_NUMBER_MIN,
      ],
      maxlength: [
        user_validation_limits.PHONE_NUMBER_MAX,
        company_validation_messages.PHONE_NUMBER_MAX,
      ],
      match: [
        validation_patterns.PHONE_NUMBER,
        company_validation_messages.PHONE_NUMBER_INVALID,
      ],
      index: true,
    },
    gst_number: {
      type: String,
      required: [true, company_validation_messages.GST_NUMBER_REQUIRED],
      unique: true,
      trim: true,
      uppercase: true,
      minlength: [
        company_validation_limits.GST_NUMBER_LENGTH,
        company_validation_messages.GST_NUMBER_MIN,
      ],
      maxlength: [
        company_validation_limits.GST_NUMBER_LENGTH,
        company_validation_messages.GST_NUMBER_MAX,
      ],
      match: [
        company_validation_patterns.GST_NUMBER,
        company_validation_messages.GST_NUMBER_INVALID,
      ],
    },
    pan_number: {
      type: String,
      required: [true, company_validation_messages.PAN_NUMBER_REQUIRED],
      unique: true,
      trim: true,
      uppercase: true,
      minlength: [
        company_validation_limits.PAN_NUMBER_LENGTH,
        company_validation_messages.PAN_NUMBER_MIN,
      ],
      maxlength: [
        company_validation_limits.PAN_NUMBER_LENGTH,
        company_validation_messages.PAN_NUMBER_MAX,
      ],
      match: [
        company_validation_patterns.PAN_NUMBER,
        company_validation_messages.PAN_NUMBER_INVALID,
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
      required: [true, company_validation_messages.CREATED_BY_REQUIRED],
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

// The company list is searched by name and filtered by type and active state,
// so the compound key leads with the type. GST and PAN are looked up whole
// rather than searched, and their unique indexes already serve that.
company_schema.index({ company_name: "text" });
company_schema.index({ company_type: 1, is_active: 1 });

module.exports = mongoose.model("Company", company_schema);
