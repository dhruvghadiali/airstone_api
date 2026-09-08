const mongoose = require("mongoose");

const { company_address_validation_messages } = require("@validators/messages");
const {
  validation_patterns,
  company_address_validation_limits,
} = require("@validators/constants");

/**
 * One place a company can be reached at -- a head office, a yard, a branch.
 *
 * A company has many of these rather than one address field of its own, because
 * a supplier delivers from one yard and invoices from another, and a contact is
 * attached to the branch they actually sit in.
 *
 * The fields:
 *
 * `address` holds the whole postal address as one block -- building, street,
 * area, city -- rather than a line each. It is stored the way the caller writes
 * it, so it is trimmed but not otherwise normalised.
 *
 * `pincode` is a String rather than a Number. It is an identifier that happens
 * to be spelled in digits, never something to do arithmetic on, and storing it
 * as a number invites a leading zero to be silently dropped.
 *
 * `company` only declares the relationship. Whether it points at a company that
 * exists and is still active is checked by the controller before the write,
 * using `is_active_company_exists`; a schema validator cannot do it without the
 * model and the helper importing each other.
 *
 * `created_by` and `updated_by` name users, and `updated_by` starts null for the
 * same reason it does on the company itself.
 */
const company_address_schema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: [true, company_address_validation_messages.COMPANY_REQUIRED],
      index: true,
    },
    address: {
      type: String,
      required: [true, company_address_validation_messages.ADDRESS_REQUIRED],
      trim: true,
      minlength: [
        company_address_validation_limits.ADDRESS_MIN,
        company_address_validation_messages.ADDRESS_MIN,
      ],
      maxlength: [
        company_address_validation_limits.ADDRESS_MAX,
        company_address_validation_messages.ADDRESS_MAX,
      ],
    },
    pincode: {
      type: String,
      required: [true, company_address_validation_messages.PINCODE_REQUIRED],
      trim: true,
      minlength: [
        company_address_validation_limits.PINCODE_LENGTH,
        company_address_validation_messages.PINCODE_MIN,
      ],
      maxlength: [
        company_address_validation_limits.PINCODE_LENGTH,
        company_address_validation_messages.PINCODE_MAX,
      ],
      match: [
        validation_patterns.PINCODE,
        company_address_validation_messages.PINCODE_INVALID,
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
      required: [true, company_address_validation_messages.CREATED_BY_REQUIRED],
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

// Addresses are read one company at a time, and always the active ones, so the
// compound key leads with the company.
company_address_schema.index({ company: 1, is_active: 1 });

module.exports = mongoose.model("CompanyAddress", company_address_schema);
