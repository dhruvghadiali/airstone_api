const {
  company_address_validation_limits,
} = require("@validators/constants/company_address_constants");

/**
 * `COMPANY_INVALID` is the wording `reference_error` carries when the `company`
 * in the body points at no company, or at one that has been deactivated. The
 * controller raises it before the write; the schema only declares the `ref`.
 *
 * `PINCODE_MIN` and `PINCODE_MAX` read identically because a PIN code is one
 * fixed length rather than a range. Both are spelled out so the request
 * validator has a message for either side of the bound and never has to invent
 * one.
 */
const company_address_messages = Object.freeze({
  CREATED: "Company address created successfully",
  FETCHED: "Company address fetched successfully",
  LISTED: "Company addresses fetched successfully",
  UPDATED: "Company address updated successfully",
  DELETED: "Company address deleted successfully",
  NOT_FOUND: "Company address not found",
});

const company_address_validation_messages = Object.freeze({
  COMPANY_REQUIRED: "Company is required",
  COMPANY_BASE: "Company must be a string",
  COMPANY_EMPTY: "Company cannot be empty",
  COMPANY_INVALID: "Company must reference an active company",
  ADDRESS_REQUIRED: "Address is required",
  ADDRESS_BASE: "Address must be a string",
  ADDRESS_EMPTY: "Address cannot be empty",
  ADDRESS_MIN: `Address must be at least ${company_address_validation_limits.ADDRESS_MIN} characters`,
  ADDRESS_MAX: `Address must not exceed ${company_address_validation_limits.ADDRESS_MAX} characters`,
  PINCODE_REQUIRED: "Pincode is required",
  PINCODE_BASE: "Pincode must be a string",
  PINCODE_EMPTY: "Pincode cannot be empty",
  PINCODE_MIN: `Pincode must be exactly ${company_address_validation_limits.PINCODE_LENGTH} digits`,
  PINCODE_MAX: `Pincode must be exactly ${company_address_validation_limits.PINCODE_LENGTH} digits`,
  PINCODE_INVALID: `Pincode must be ${company_address_validation_limits.PINCODE_LENGTH} digits and cannot start with zero`,
  IS_ACTIVE_BASE: "Active flag must be a boolean",
  CREATED_BY_REQUIRED: "Created by is required",
  CREATED_BY_BASE: "Created by must be a string",
  CREATED_BY_INVALID: "Created by must reference an active user",
  UPDATED_BY_BASE: "Updated by must be a string",
  UPDATED_BY_INVALID: "Updated by must reference an active user",
  UNKNOWN_FIELD: "Request body contains an unsupported field",
});

module.exports = {
  company_address_messages,
  company_address_validation_messages,
};
