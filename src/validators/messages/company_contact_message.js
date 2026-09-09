const { contact_position } = require("@enums");
const {
  user_validation_limits,
} = require("@validators/constants/user_constants");
const {
  company_contact_validation_limits,
} = require("@validators/constants/company_contact_constants");

/**
 * The accepted contact positions, spelled the way a caller should send them.
 *
 * Built from the enum rather than typed out, so adding or removing a position
 * updates this message on its own.
 */
const contact_positions = Object.values(contact_position).join(", ");

/**
 * `ADDRESS_NOT_OWNED` is the one message here that no single field can produce.
 * A contact carries both a company and one of that company's addresses, and
 * either can be valid on its own while the pair is wrong -- an address that
 * belongs to a different company. That is a rule about one field given another,
 * so the controller checks it after `find_active_company_address` hands back the
 * address and the company that owns it.
 *
 * `UPDATE_MIN` is what an empty PATCH body is answered with. A request that
 * names no field is a call that would do nothing, and telling the caller so
 * beats a 200 that changed nothing.
 *
 * `PHONE_NUMBER_*` interpolate `user_validation_limits`, because a contact's
 * phone number is the same ten digit number a user's is. See the header of
 * `company_contact_constants.js`.
 */
const company_contact_messages = Object.freeze({
  CREATED: "Company contact created successfully",
  FETCHED: "Company contact fetched successfully",
  LISTED: "Company contacts fetched successfully",
  UPDATED: "Company contact updated successfully",
  DELETED: "Company contact deleted successfully",
  NOT_FOUND: "Company contact not found",
  INVALID_ID: "Invalid company contact id",
  ADDRESS_NOT_OWNED:
    "The selected address does not belong to the selected company",
});

const company_contact_validation_messages = Object.freeze({
  UPDATE_MIN: "At least one field must be sent to update a contact",
  COMPANY_REQUIRED: "Company is required",
  COMPANY_BASE: "Company must be a string",
  COMPANY_EMPTY: "Company cannot be empty",
  COMPANY_INVALID: "Company must reference an active company",
  COMPANY_ADDRESS_REQUIRED: "Company address is required",
  COMPANY_ADDRESS_BASE: "Company address must be a string",
  COMPANY_ADDRESS_EMPTY: "Company address cannot be empty",
  COMPANY_ADDRESS_INVALID:
    "Company address must reference an active company address",
  NAME_REQUIRED: "Name is required",
  NAME_BASE: "Name must be a string",
  NAME_EMPTY: "Name cannot be empty",
  NAME_MIN: `Name must be at least ${company_contact_validation_limits.NAME_MIN} characters`,
  NAME_MAX: `Name must not exceed ${company_contact_validation_limits.NAME_MAX} characters`,
  PHONE_NUMBER_REQUIRED: "Phone number is required",
  PHONE_NUMBER_BASE: "Phone number must be a string",
  PHONE_NUMBER_EMPTY: "Phone number cannot be empty",
  PHONE_NUMBER_MIN: `Phone number must be at least ${user_validation_limits.PHONE_NUMBER_MIN} characters`,
  PHONE_NUMBER_MAX: `Phone number must not exceed ${user_validation_limits.PHONE_NUMBER_MAX} characters`,
  PHONE_NUMBER_INVALID: `Phone number must be exactly ${user_validation_limits.PHONE_NUMBER_MAX} digits`,
  POSITION_REQUIRED: "Position is required",
  POSITION_BASE: "Position must be a string",
  POSITION_EMPTY: "Position cannot be empty",
  POSITION_INVALID: `Position must be one of: ${contact_positions}`,
  IS_ACTIVE_BASE: "Active flag must be a boolean",
  CREATED_BY_REQUIRED: "Created by is required",
  CREATED_BY_BASE: "Created by must be a string",
  CREATED_BY_INVALID: "Created by must reference an active user",
  UPDATED_BY_BASE: "Updated by must be a string",
  UPDATED_BY_INVALID: "Updated by must reference an active user",
  UNKNOWN_FIELD: "Request body contains an unsupported field",
});

module.exports = {
  company_contact_messages,
  company_contact_validation_messages,
};
