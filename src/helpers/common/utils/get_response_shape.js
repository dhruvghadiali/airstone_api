/**
 * Picks the columns and joins one action serialises with.
 *
 * A feature declares what its endpoints return in
 * `@helpers/<feature>/constants/<feature>_response`. This is the lookup that
 * turns such a config plus an action name into the shape that action uses: the
 * named variant when the feature declared one, and the feature's `default`
 * otherwise.
 *
 * It knows no entity, deliberately. A reference spec -- what a company looks
 * like when another feature expands it -- belongs to the feature that owns that
 * entity, or this file becomes the single place every feature's serialisation is
 * defined.
 *
 * `default` is required of every config, so a missing one is a programming error
 * that shows up on the first request rather than quietly returning an unshaped
 * document.
 *
 * @param   {Object} config  A feature's response config.
 * @param   {string} action  Action name, for example `"create"` or `"list"`.
 * @returns {Object} `{ select, populate }` for that action.
 */
const get_response_shape = (config, action) => config[action] || config.default;

module.exports = { get_response_shape };
