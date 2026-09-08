const app_error = require("@middlewares/app_error");

const { http_status } = require("@enums");
const { error_messages } = require("@validators/messages");
const { send_response } = require("@helpers/common");

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
  if (error instanceof app_error) {
    return {
      status_code: error.status_code,
      message: error.message,
      data: error.details,
    };
  }

  if (error.isJoi || error.name === "JoiValidationError") {
    return {
      status_code: http_status.BAD_REQUEST,
      message: error_messages.VALIDATION_FAILED,
      data: format_joi_errors(error),
    };
  }

  if (error.name === "ValidationError" && error.errors) {
    return {
      status_code: http_status.BAD_REQUEST,
      message: error_messages.VALIDATION_FAILED,
      data: format_mongoose_errors(error),
    };
  }

  if (error.name === "CastError") {
    return {
      status_code: http_status.BAD_REQUEST,
      message: error_messages.INVALID_IDENTIFIER,
      data: [
        {
          field: error.path,
          message: `Invalid value for ${error.path}`,
          type: "cast_error",
        },
      ],
    };
  }

  if (error.code === 11000) {
    return {
      status_code: http_status.CONFLICT,
      message: error_messages.DUPLICATE_VALUE,
      data: format_duplicate_error(error),
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
