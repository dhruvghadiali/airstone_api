const app_error = require("@middlewares/app_error");

const { http_status } = require("@enums");
const { error_messages } = require("@validators/messages");
const { send_response } = require("@helpers/common");

/**
 * Every failure that has per-field detail carries it as `{ errors: [...] }`.
 *
 * `data` is an object on every response, so a list of field failures has to sit
 * under a name rather than being the payload itself. `errors` is that name, and
 * it is always an array even for a single bad field, so a client maps over it
 * without checking how many there were.
 *
 * @param   {Array} errors  Per-field failures.
 * @returns {{errors: Array}} The list, under the key clients read.
 */
const as_error_data = (errors) => ({ errors });

const format_joi_errors = (error) =>
  error.details.map(({ message, path, type }) => ({
    field: path.join("."),
    message,
    type,
  }));

const format_mongoose_errors = (error) =>
  Object.values(error.errors).map((validation_error) => ({
    field: validation_error.path,
    message: validation_error.message,
    type: validation_error.kind || "validation_error",
  }));

const format_duplicate_error = (error) => {
  const duplicate_fields = Object.keys(
    error.key_value || error.keyPattern || {},
  );

  return duplicate_fields.map((field) => ({
    field,
    message: `${field} already exists`,
    type: "duplicate_value",
  }));
};

const normalize_error = (error) => {
  // `details` is whatever the thrower passed. An array of field failures is
  // named like every other one; an object is already the right shape and is
  // taken as given. Nothing else is guessed at.
  if (error instanceof app_error) {
    return {
      status_code: error.status_code,
      message: error.message,
      data: Array.isArray(error.details)
        ? as_error_data(error.details)
        : error.details,
    };
  }

  if (error.isJoi || error.name === "JoiValidationError") {
    return {
      status_code: http_status.BAD_REQUEST,
      message: error_messages.VALIDATION_FAILED,
      data: as_error_data(format_joi_errors(error)),
    };
  }

  if (error.name === "ValidationError" && error.errors) {
    return {
      status_code: http_status.BAD_REQUEST,
      message: error_messages.VALIDATION_FAILED,
      data: as_error_data(format_mongoose_errors(error)),
    };
  }

  if (error.name === "CastError") {
    return {
      status_code: http_status.BAD_REQUEST,
      message: error_messages.INVALID_IDENTIFIER,
      data: as_error_data([
        {
          field: error.path,
          message: `Invalid value for ${error.path}`,
          type: "cast_error",
        },
      ]),
    };
  }

  if (error.code === 11000) {
    return {
      status_code: http_status.CONFLICT,
      message: error_messages.DUPLICATE_VALUE,
      data: as_error_data(format_duplicate_error(error)),
    };
  }

  if (error.type === "entity.parse.failed") {
    return {
      status_code: http_status.BAD_REQUEST,
      message: error_messages.INVALID_JSON,
    };
  }

  return {
    status_code: http_status.INTERNAL_SERVER_ERROR,
    message: error_messages.INTERNAL_SERVER_ERROR,
  };
};

const error_handler = (error, _req, res, _next) => {
  const normalized_error = normalize_error(error);

  if (normalized_error.status_code === http_status.INTERNAL_SERVER_ERROR) {
    console.error(error);
  }

  return send_response(
    res,
    normalized_error.status_code,
    normalized_error.message,
    normalized_error.data,
  );
};

module.exports = { error_handler, normalize_error };
