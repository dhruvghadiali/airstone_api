const { company_type } = require("@enums");
const {
  user_validation_limits,
} = require("@validators/constants/user_constants");
const {
  company_validation_limits,
} = require("@validators/constants/company_constants");

/**
 * The accepted company types, spelled the way a caller should send them.
 *
 * Built from the enum rather than typed out, so adding or removing a type
 * updates this message on its own.
 */
const company_types = Object.values(company_type).join(", ");

/**
 * `GST_NUMBER_EXISTS` and `PAN_NUMBER_EXISTS` are what a duplicate key on those
 * two unique indexes should be reported as. Without them the error handler
 * falls back to `error_messages.DUPLICATE_VALUE`, which does not say which of
 * the two numbers the caller has already used.
 *
 * `UPDATE_MIN` is what an empty PATCH body is answered with. A request that
 * names no field is a call that would do nothing, and telling the caller so
 * beats a 200 that changed nothing.
 *
 * `ADDRESS_LIST_*` are about the `address` array in a create body, not about an
 * address. The address's own wording lives in
 * `company_address_validation_messages`, so the two never share a key.
 *
 * `EMAIL_MIN`, `EMAIL_MAX`, `PHONE_NUMBER_MIN` and `PHONE_NUMBER_MAX`
 * interpolate `user_validation_limits` rather than a company constant of their
 * own, because the company model holds a company's email and phone to the same
 * bounds a user's are held to. See the header of `company_constants.js`.
 */
const company_messages = Object.freeze({
  CREATED: "Company created successfully",
  FETCHED: "Company fetched successfully",
  LISTED: "Companies fetched successfully",
  UPDATED: "Company updated successfully",
  DELETED: "Company deleted successfully",
  NOT_FOUND: "Company not found",
  GST_NUMBER_EXISTS: "A company with this GST number already exists",
  PAN_NUMBER_EXISTS: "A company with this PAN number already exists",
  ALREADY_EXISTS:
    "A company with the same GST number or PAN number already exists",
  INVALID_ID: "Invalid company id",
});

const company_validation_messages = Object.freeze({
  COMPANY_NAME_REQUIRED: "Company name is required",
  COMPANY_NAME_BASE: "Company name must be a string",
  COMPANY_NAME_EMPTY: "Company name cannot be empty",
  COMPANY_NAME_MIN: `Company name must be at least ${company_validation_limits.COMPANY_NAME_MIN} characters`,
  COMPANY_NAME_MAX: `Company name must not exceed ${company_validation_limits.COMPANY_NAME_MAX} characters`,
  COMPANY_TYPE_REQUIRED: "Company type is required",
  COMPANY_TYPE_BASE: "Company type must be a string",
  COMPANY_TYPE_EMPTY: "Company type cannot be empty",
  COMPANY_TYPE_INVALID: `Company type must be one of: ${company_types}`,
  EMAIL_REQUIRED: "Email is required",
  EMAIL_BASE: "Email must be a string",
  EMAIL_EMPTY: "Email cannot be empty",
  EMAIL_MIN: `Email must be at least ${user_validation_limits.EMAIL_MIN} characters`,
  EMAIL_MAX: `Email must not exceed ${user_validation_limits.EMAIL_MAX} characters`,
  EMAIL_INVALID: "Email must be a valid email address",
  PHONE_NUMBER_REQUIRED: "Phone number is required",
  PHONE_NUMBER_BASE: "Phone number must be a string",
  PHONE_NUMBER_EMPTY: "Phone number cannot be empty",
  PHONE_NUMBER_MIN: `Phone number must be at least ${user_validation_limits.PHONE_NUMBER_MIN} characters`,
  PHONE_NUMBER_MAX: `Phone number must not exceed ${user_validation_limits.PHONE_NUMBER_MAX} characters`,
  PHONE_NUMBER_INVALID: `Phone number must be exactly ${user_validation_limits.PHONE_NUMBER_MAX} digits`,
  GST_NUMBER_REQUIRED: "GST number is required",
  GST_NUMBER_BASE: "GST number must be a string",
  GST_NUMBER_EMPTY: "GST number cannot be empty",
  GST_NUMBER_MIN: `GST number must be exactly ${company_validation_limits.GST_NUMBER_LENGTH} characters`,
  GST_NUMBER_MAX: `GST number must be exactly ${company_validation_limits.GST_NUMBER_LENGTH} characters`,
  GST_NUMBER_INVALID: `GST number must be a valid ${company_validation_limits.GST_NUMBER_LENGTH} character GSTIN`,
  PAN_NUMBER_REQUIRED: "PAN number is required",
  PAN_NUMBER_BASE: "PAN number must be a string",
  PAN_NUMBER_EMPTY: "PAN number cannot be empty",
  PAN_NUMBER_MIN: `PAN number must be exactly ${company_validation_limits.PAN_NUMBER_LENGTH} characters`,
  PAN_NUMBER_MAX: `PAN number must be exactly ${company_validation_limits.PAN_NUMBER_LENGTH} characters`,
  PAN_NUMBER_INVALID:
    "PAN number must be five letters, four digits and one letter",
  UPDATE_MIN: "At least one field must be sent to update a company",
  ADDRESS_LIST_REQUIRED: "At least one address is required",
  ADDRESS_LIST_BASE: "Address must be a list of addresses",
  ADDRESS_LIST_MIN: `A company needs at least ${company_validation_limits.ADDRESS_LIST_MIN_ITEMS} address`,
  IS_ACTIVE_BASE: "Active flag must be a boolean",
  CREATED_BY_REQUIRED: "Created by is required",
  CREATED_BY_BASE: "Created by must be a string",
  CREATED_BY_INVALID: "Created by must reference an active user",
  UPDATED_BY_BASE: "Updated by must be a string",
  UPDATED_BY_INVALID: "Updated by must reference an active user",
  UNKNOWN_FIELD: "Request body contains an unsupported field",
});

module.exports = { company_messages, company_validation_messages };
