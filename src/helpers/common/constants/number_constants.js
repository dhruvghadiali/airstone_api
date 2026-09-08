/**
 * The bases the money helpers in this folder are built on.
 *
 * Named rather than written inline because the same 100 means two different
 * things below, and a reader should not have to work out which is which.
 */

/** Paise in one rupee. Money is compared in whole paise, never in float rupees. */
const PAISA_IN_RUPEE = 100;

/** A percentage is out of this. Used to split tax out of a tax inclusive total. */
const PERCENT_BASE = 100;

module.exports = { PAISA_IN_RUPEE, PERCENT_BASE };
