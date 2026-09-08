const app_error = require("@middlewares/app_error");

const { http_status } = require("@enums");
const { error_messages } = require("@validators/messages");

/**
 * Builds the 400 for a reference in the request body that points at a missing
 * or soft deleted document.
 *
 * A standalone function with nothing to share, so it sits as a flat file rather
 * than in a folder of its own.
 *
 * This check used to be a Mongoose schema validator, which surfaced it as a
 * ValidationError. It now runs in the controller, so this rebuilds the same
 * envelope -- field, message and type -- rather than inventing a second error
 * shape the client would have to learn.
 *
 * It is a util rather than a helper because it touches no database, no `req`
 * and no `res`. It is also not any one feature's: product, purchase, sale,
 * stock and address all raise it about references of their own, and putting it
 * in one of their folders would have the other four reaching across a feature
 * boundary for it.
 *
 * @param   {string} field    The body field holding the bad reference, so the
 *                            caller knows which one to fix.
 * @param   {string} message  What is wrong with it, in the caller's terms.
 * @returns {app_error} A 400 carrying one detail entry. Throw it; do not return
 *                      it.
 */
const reference_error = (field, message) =>
  new app_error(http_status.BAD_REQUEST, error_messages.VALIDATION_FAILED, [
    { field, message, type: "reference_error" },
  ]);

module.exports = { reference_error };
