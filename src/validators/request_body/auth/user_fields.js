const joi = require("joi");

const { user_validation_messages } = require("@validators/messages");
const {
  validation_patterns,
  user_validation_limits,
  user_validation_patterns,
} = require("@validators/constants");

/**
 * The user account fields, defined once and shared by every auth validator.
 *
 * A signup names six of these and a signin names two, but a username is a
 * username either way. Defining each field once is what stops the two endpoints
 * disagreeing about what a valid username is -- and what makes "allow longer
 * passwords" one edit rather than four.
 *
 * Every rule here has to match `user_model`, because the model validates the
 * same value again on the way to the database. Where they differ, a caller sees
 * a Mongoose error instead of the Joi one written for them, so the limits and
 * patterns are read from `@validators/constants` rather than typed in twice.
 *
 * `password` is the deliberate exception: Joi caps a submitted password at
 * `PASSWORD_REQUEST_MAX` while the model allows `PASSWORD_STORAGE_MAX`, because
 * what the model stores is a bcrypt hash and not what the caller typed.
 *
 * Every field is `required()`. An update validator that needs a subset marks
 * them optional itself with `.fork()` or by re-declaring, rather than this file
 * carrying an optional variant of each.
 */

/**
 * The name a caller signs in with.
 *
 * Lower-cased and trimmed so `  Alice ` and `alice` are the same account. The
 * model applies `lowercase: true` too, so the stored value and the value looked
 * up always match.
 */
const username = joi
  .string()
  .trim()
  .lowercase()
  .min(user_validation_limits.USERNAME_MIN)
  .max(user_validation_limits.USERNAME_MAX)
  .required()
  .messages({
    "any.required": user_validation_messages.USERNAME_REQUIRED,
    "string.base": user_validation_messages.USERNAME_BASE,
    "string.empty": user_validation_messages.USERNAME_EMPTY,
    "string.min": user_validation_messages.USERNAME_MIN,
    "string.max": user_validation_messages.USERNAME_MAX,
  });

/**
 * The password as the caller typed it.
 *
 * Not trimmed, on purpose: a leading or trailing space is a character the
 * person chose, and silently removing it would lock them out of an account they
 * typed correctly.
 *
 * The maximum is `PASSWORD_REQUEST_MAX`, not the model's storage maximum. The
 * model stores a hash of fixed length, so the two limits measure different
 * things. Capping the request also keeps bcrypt from being handed a megabyte to
 * hash.
 */
const password = joi
  .string()
  .min(user_validation_limits.PASSWORD_MIN)
  .max(user_validation_limits.PASSWORD_REQUEST_MAX)
  .required()
  .messages({
    "any.required": user_validation_messages.PASSWORD_REQUIRED,
    "string.base": user_validation_messages.PASSWORD_BASE,
    "string.empty": user_validation_messages.PASSWORD_EMPTY,
    "string.min": user_validation_messages.PASSWORD_MIN,
    "string.max": user_validation_messages.PASSWORD_REQUEST_MAX,
  });

/**
 * The account's email address. Unique across all users.
 *
 * The pattern is deliberately loose -- something, an `@`, something, a dot,
 * something. A stricter regex rejects addresses that are actually deliverable,
 * and the only real proof an address works is sending to it.
 */
const email = joi
  .string()
  .trim()
  .lowercase()
  .min(user_validation_limits.EMAIL_MIN)
  .max(user_validation_limits.EMAIL_MAX)
  .pattern(validation_patterns.EMAIL)
  .required()
  .messages({
    "any.required": user_validation_messages.EMAIL_REQUIRED,
    "string.base": user_validation_messages.EMAIL_BASE,
    "string.empty": user_validation_messages.EMAIL_EMPTY,
    "string.min": user_validation_messages.EMAIL_MIN,
    "string.max": user_validation_messages.EMAIL_MAX,
    "string.pattern.base": user_validation_messages.EMAIL_INVALID,
  });

/**
 * The account's phone number. Unique across all users.
 *
 * Exactly ten digits, with no country code, spaces or punctuation -- the
 * business operates in one country, so the number is stored the way it is
 * dialled there. The minimum and maximum are the same value; both are declared
 * so a too-short and a too-long number each get their own message.
 */
const phone_number = joi
  .string()
  .trim()
  .min(user_validation_limits.PHONE_NUMBER_MIN)
  .max(user_validation_limits.PHONE_NUMBER_MAX)
  .pattern(validation_patterns.PHONE_NUMBER)
  .required()
  .messages({
    "any.required": user_validation_messages.PHONE_NUMBER_REQUIRED,
    "string.base": user_validation_messages.PHONE_NUMBER_BASE,
    "string.empty": user_validation_messages.PHONE_NUMBER_EMPTY,
    "string.min": user_validation_messages.PHONE_NUMBER_MIN,
    "string.max": user_validation_messages.PHONE_NUMBER_MAX,
    "string.pattern.base": user_validation_messages.PHONE_NUMBER_INVALID,
  });

/** The person's given name. Trimmed, but otherwise stored as they wrote it. */
const first_name = joi
  .string()
  .trim()
  .min(user_validation_limits.FIRST_NAME_MIN)
  .max(user_validation_limits.FIRST_NAME_MAX)
  .required()
  .messages({
    "any.required": user_validation_messages.FIRST_NAME_REQUIRED,
    "string.base": user_validation_messages.FIRST_NAME_BASE,
    "string.empty": user_validation_messages.FIRST_NAME_EMPTY,
    "string.min": user_validation_messages.FIRST_NAME_MIN,
    "string.max": user_validation_messages.FIRST_NAME_MAX,
  });

/** The person's family name. Trimmed, but otherwise stored as they wrote it. */
const last_name = joi
  .string()
  .trim()
  .min(user_validation_limits.LAST_NAME_MIN)
  .max(user_validation_limits.LAST_NAME_MAX)
  .required()
  .messages({
    "any.required": user_validation_messages.LAST_NAME_REQUIRED,
    "string.base": user_validation_messages.LAST_NAME_BASE,
    "string.empty": user_validation_messages.LAST_NAME_EMPTY,
    "string.min": user_validation_messages.LAST_NAME_MIN,
    "string.max": user_validation_messages.LAST_NAME_MAX,
  });

module.exports = {
  email,
  first_name,
  last_name,
  password,
  phone_number,
  username,
};
