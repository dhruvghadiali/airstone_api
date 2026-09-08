const { app_time } = require("@validators/constants/common");

const PASSWORD_SALT_ROUNDS = 12;

/**
 * The password every account created by a super admin or an admin starts with.
 *
 * It is the same for everyone and it is written here in the source, so treat it
 * as public knowledge rather than as a secret. It is a starting point for a
 * brand new account, not protection for it.
 *
 * Two things follow from that, and both are still to be built:
 *   - a new user must be made to change it the first time they sign in;
 *   - until they do, their account is only as safe as this file is private.
 *
 * It is stored the same way as any other password -- hashed by the model before
 * it is saved -- so it is never written to the database in plain text.
 */
const DEFAULT_USER_PASSWORD = "Aristone@123456";

/**
 * emp_id is generated as <2-digit year><2-digit month><3-digit sequence>, e.g.
 * 2612001 is the first employee registered in December 2026. The sequence
 * restarts at 001 whenever the year or the month changes.
 */
const emp_id_generation = Object.freeze({
  TIMEZONE: app_time.TIMEZONE,
  UTC_OFFSET: app_time.UTC_OFFSET,
  YEAR_FORMAT: "YY",
  MONTH_FORMAT: "MM",
  PREFIX_LENGTH: 4,
  SEQUENCE_LENGTH: 3,
  SEQUENCE_START: 1,
  SEQUENCE_MAX: 999,
  MAX_ATTEMPTS: 5,
});

const user_validation_limits = Object.freeze({
  USERNAME_MIN: 3,
  USERNAME_MAX: 50,
  PASSWORD_MIN: 8,
  PASSWORD_REQUEST_MAX: 20,
  PASSWORD_STORAGE_MAX: 500,
  EMAIL_MIN: 5,
  EMAIL_MAX: 254,
  PHONE_NUMBER_MIN: 10,
  PHONE_NUMBER_MAX: 10,
  FIRST_NAME_MIN: 1,
  FIRST_NAME_MAX: 100,
  LAST_NAME_MIN: 1,
  LAST_NAME_MAX: 100,
  EMP_ID_MIN: 7,
  EMP_ID_MAX: 7,
});

const user_validation_patterns = Object.freeze({
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_NUMBER: /^\d{10}$/,
  EMP_ID: /^[A-Za-z0-9]{7}$/,
});

module.exports = {
  PASSWORD_SALT_ROUNDS,
  DEFAULT_USER_PASSWORD,
  emp_id_generation,
  user_validation_limits,
  user_validation_patterns,
};
