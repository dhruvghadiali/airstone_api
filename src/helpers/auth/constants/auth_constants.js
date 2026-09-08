/**
 * Values the auth helper uses and nobody else does.
 *
 * Anything a model, a validator or another feature also reads belongs in
 * `@validators/constants` instead. Only auth's own wording lives here.
 */

/**
 * The one column a signin query asks for that the response never carries.
 *
 * `password` is `select: false` on the schema, so a query has to name it to get
 * it. It is kept out of the response config on purpose: that config means "what
 * a client is shown", and a hash is the one thing that must be read and never
 * shown.
 *
 * @type {string}
 */
const CREDENTIAL_SELECT = "+password";

module.exports = { CREDENTIAL_SELECT };
