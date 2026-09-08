const { user_type } = require("@enums");
const {
  emp_id_generation,
  user_validation_limits,
} = require("@validators/constants");

/**
 * The accepted user types, spelled the way a caller should send them.
 *
 * Built from the enum rather than typed out, so adding or removing a role
 * updates this message on its own. A hand-written list is the copy that goes
 * stale unnoticed: the request is still refused, just with wording naming a role
 * that no longer exists.
 */
const user_types = Object.values(user_type).join(", ");

const user_messages = Object.freeze({
  CREATED: "Super admin account created successfully",
  SIGNED_IN: "Super admin signed in successfully",
  ADMIN_SIGNED_IN: "Admin signed in successfully",
  EMPLOYEE_SIGNED_IN: "Employee signed in successfully",
  ALREADY_EXISTS:
    "A user with the same username, email, phone number, or employee id already exists",
  INVALID_CREDENTIALS: "Invalid username or password",
  AUTH_TOKEN_REQUIRED: "A Bearer authentication token is required",
  INVALID_AUTH_TOKEN: "Authentication token is invalid",
  AUTH_TOKEN_EXPIRED: "Authentication token has expired",
  ACCESS_FORBIDDEN: "You do not have permission to access this resource",
  EMP_ID_SEQUENCE_EXHAUSTED: `No more than ${emp_id_generation.SEQUENCE_MAX} employee ids can be issued in a single month`,
  EMP_ID_GENERATION_FAILED:
    "Could not allocate a unique employee id, please retry",
});

const user_validation_messages = Object.freeze({
  USERNAME_REQUIRED: "Username is required",
  USERNAME_BASE: "Username must be a string",
  USERNAME_EMPTY: "Username cannot be empty",
  USERNAME_MIN: `Username must be at least ${user_validation_limits.USERNAME_MIN} characters`,
  USERNAME_MAX: `Username must not exceed ${user_validation_limits.USERNAME_MAX} characters`,
  PASSWORD_REQUIRED: "Password is required",
  PASSWORD_BASE: "Password must be a string",
  PASSWORD_EMPTY: "Password cannot be empty",
  PASSWORD_MIN: `Password must be at least ${user_validation_limits.PASSWORD_MIN} characters`,
  PASSWORD_REQUEST_MAX: `Password must not exceed ${user_validation_limits.PASSWORD_REQUEST_MAX} characters`,
  PASSWORD_STORAGE_MAX: `Stored password must not exceed ${user_validation_limits.PASSWORD_STORAGE_MAX} characters`,
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
  PHONE_NUMBER_INVALID:
    "Phone number must be a valid international phone number",
  FIRST_NAME_REQUIRED: "First name is required",
  FIRST_NAME_BASE: "First name must be a string",
  FIRST_NAME_EMPTY: "First name cannot be empty",
  FIRST_NAME_MIN: "First name cannot be empty",
  FIRST_NAME_MAX: `First name must not exceed ${user_validation_limits.FIRST_NAME_MAX} characters`,
  LAST_NAME_REQUIRED: "Last name is required",
  LAST_NAME_BASE: "Last name must be a string",
  LAST_NAME_EMPTY: "Last name cannot be empty",
  LAST_NAME_MIN: "Last name cannot be empty",
  LAST_NAME_MAX: `Last name must not exceed ${user_validation_limits.LAST_NAME_MAX} characters`,
  EMP_ID_REQUIRED: "Employee id is required",
  EMP_ID_BASE: "Employee id must be a string",
  EMP_ID_EMPTY: "Employee id cannot be empty",
  EMP_ID_MIN: `Employee id must be at least ${user_validation_limits.EMP_ID_MIN} characters`,
  EMP_ID_MAX: `Employee id must not exceed ${user_validation_limits.EMP_ID_MAX} characters`,
  EMP_ID_INVALID: `Employee id must be exactly ${user_validation_limits.EMP_ID_MAX} alphanumeric characters`,
  USER_TYPE_REQUIRED: "User type is required",
  USER_TYPE_BASE: "User type must be a string",
  USER_TYPE_INVALID: `User type must be one of: ${user_types}`,
  UNKNOWN_FIELD: "Request body contains an unsupported field",
});

module.exports = { user_messages, user_validation_messages };
