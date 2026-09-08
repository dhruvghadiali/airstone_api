/**
 * The date formats a list query accepts, and the patterns that tell them apart.
 *
 * The frontend may send a plain date from a date picker, a date with a time, or
 * a full ISO timestamp. These describe what is allowed; `parse_date_boundary`
 * decides what each one means.
 */

/** Matches a date with no time at all, which is read as a whole day. */
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** Matches a value that already names its own timezone, taken at face value. */
const HAS_TIMEZONE = /(?:Z|[+-]\d{2}:?\d{2})$/i;

/**
 * Everything a caller may send without a timezone. Parsed strictly, so a value
 * that is close but not one of these is rejected rather than guessed at.
 *
 * @type {string[]}
 */
const ACCEPTED_FORMATS = [
  "YYYY-MM-DD",
  "YYYY-MM-DDTHH:mm",
  "YYYY-MM-DDTHH:mm:ss",
  "YYYY-MM-DDTHH:mm:ss.SSS",
];

module.exports = { DATE_ONLY, HAS_TIMEZONE, ACCEPTED_FORMATS };
