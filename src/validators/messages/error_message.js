const error_messages = Object.freeze({
  ROUTE_NOT_FOUND: 'Route not found',
  VALIDATION_FAILED: 'Validation failed',
  INVALID_IDENTIFIER: 'Invalid resource identifier',
  DUPLICATE_VALUE: 'A record with the same value already exists',
  INVALID_JSON: 'Request body contains invalid JSON',
  INTERNAL_SERVER_ERROR: 'Internal server error',
});

module.exports = { error_messages };
