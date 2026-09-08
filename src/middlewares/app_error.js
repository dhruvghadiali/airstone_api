class app_error extends Error {
  constructor(status_code, message, details) {
    super(message);
    this.name = 'app_error';
    this.status_code = status_code;
    if (details) this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = app_error;
