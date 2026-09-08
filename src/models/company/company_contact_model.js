const mongoose = require("mongoose");

const { contact_position } = require("@enums");
const { company_contact_validation_messages } = require("@validators/messages");
const {
  validation_patterns,
  user_validation_limits,
  company_contact_validation_limits,
} = require("@validators/constants");

/**
 * A named person at a company, and the branch of it they sit in.
 *
 * The fields:
 *
 * `company` and `company_address` are both stored rather than the company being
 * read through the address, so a contact can be listed for a company without
 * loading every address it has. The cost is that the two can disagree: an
 * address that is perfectly valid may belong to a different company. That is a
 * rule about one field given another, which no single field validator can see,
 * so the controller checks the pair with `find_active_company_address` -- it
 * proves the address is active and hands back the company that owns it in one
 * query -- and raises `ADDRESS_NOT_OWNED` when they do not match.
 *
 * `name` is the whole name in one field, written the way the person introduces
 * themselves.
 *
 * `position` is what the contact is to us -- who to call about a purchase, an
 * invoice, an order -- rather than their printed job title.
 *
 * `created_by` and `updated_by` name users, and `updated_by` starts null for the
 * same reason it does on the company itself.
 */
const company_contact_schema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: [true, company_contact_validation_messages.COMPANY_REQUIRED],
      index: true,
    },
    company_address: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CompanyAddress",
      required: [
        true,
        company_contact_validation_messages.COMPANY_ADDRESS_REQUIRED,
      ],
      index: true,
    },
    name: {
      type: String,
      required: [true, company_contact_validation_messages.NAME_REQUIRED],
      trim: true,
      minlength: [
        company_contact_validation_limits.NAME_MIN,
        company_contact_validation_messages.NAME_MIN,
      ],
      maxlength: [
        company_contact_validation_limits.NAME_MAX,
        company_contact_validation_messages.NAME_MAX,
      ],
    },
    phone_number: {
      type: String,
      required: [
        true,
        company_contact_validation_messages.PHONE_NUMBER_REQUIRED,
      ],
      trim: true,
      minlength: [
        user_validation_limits.PHONE_NUMBER_MIN,
        company_contact_validation_messages.PHONE_NUMBER_MIN,
      ],
      maxlength: [
        user_validation_limits.PHONE_NUMBER_MAX,
        company_contact_validation_messages.PHONE_NUMBER_MAX,
      ],
      match: [
        validation_patterns.PHONE_NUMBER,
        company_contact_validation_messages.PHONE_NUMBER_INVALID,
      ],
      index: true,
    },
    position: {
      type: String,
      required: [true, company_contact_validation_messages.POSITION_REQUIRED],
      enum: {
        values: Object.values(contact_position),
        message: company_contact_validation_messages.POSITION_INVALID,
      },
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
      required: [true, company_contact_validation_messages.CREATED_BY_REQUIRED],
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

// Contacts are listed two ways -- everyone at a company, and everyone at one of
// its branches -- and both lists are of active contacts only.
company_contact_schema.index({ company: 1, is_active: 1 });
company_contact_schema.index({ company_address: 1, is_active: 1 });

module.exports = mongoose.model("CompanyContact", company_contact_schema);
