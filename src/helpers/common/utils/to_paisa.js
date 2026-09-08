const { PAISA_IN_RUPEE } = require("@helpers/common/constants");

/**
 * Turns an amount in rupees into whole paise.
 *
 * Money is compared in paise, not in rupees. Adding floats reaches
 * 4999.999999999999 for values that are each exact to two places, so a
 * reconciliation check written against rupees fails on arithmetic rather than on
 * the numbers a person typed.
 *
 * @param   {number|string} value  An amount in rupees.
 * @returns {number} The same amount in whole paise.
 */
const to_paisa = (value) => Math.round(Number(value) * PAISA_IN_RUPEE);

module.exports = { to_paisa };
