const app_error = require("@middlewares/app_error");
const public_directory = require("@src/public_path");

const { http_status } = require("@enums");
const { error_messages } = require("@validators/messages");

const not_found_handler = (req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return next(
      new app_error(http_status.NOT_FOUND, error_messages.ROUTE_NOT_FOUND),
    );
  }

  return res
    .status(http_status.NOT_FOUND)
    .sendFile(`${public_directory}/errors/404.html`);
};

module.exports = not_found_handler;
