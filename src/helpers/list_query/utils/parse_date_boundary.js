const moment = require("moment");

const { app_time } = require("@validators/constants");
const {
  DATE_ONLY,
  HAS_TIMEZONE,
  ACCEPTED_FORMATS,
} = require("@helpers/list_query/constants");

/**
 * Reads one end of a date range and returns the instant Mongo stores.
 *
 * A value with no timezone is read as Indian Standard Time, because that is the
 * clock the person picking the date is looking at. A plain date is widened to
 * the whole Indian day, so `created_to=2026-08-15` still includes a row created
 * at 6pm on the 15th -- which is what "up to the 15th" means to a user.
 *
 * Everything is normalised here, so a controller never deals with date strings.
 *
 * @param   {*} value                      What the caller sent.
 * @param   {Object} [options={}]
 * @param   {boolean} [options.end_of_day] Widen a plain date to the end of the
 *                                         day instead of the start. Ignored when
 *                                         the caller named an instant.
 * @returns {Date|null} The instant, or null when the value is not a date this
 *                      API accepts.
 */
const parse_date_boundary = (value, { end_of_day = false } = {}) => {
  const raw = String(value).trim();

  // An explicit offset is the caller being precise; it is taken at face value.
  if (HAS_TIMEZONE.test(raw)) {
    const exact = moment.parseZone(raw, moment.ISO_8601, true);

    return exact.isValid() ? exact.toDate() : null;
  }

  const normalized = raw.replace(" ", "T");
  const parsed = moment
    .utc(normalized, ACCEPTED_FORMATS, true)
    // Keeps the wall clock the caller typed and reads it as IST.
    .utcOffset(app_time.UTC_OFFSET, true);

  if (!parsed.isValid()) return null;

  if (!DATE_ONLY.test(normalized)) return parsed.toDate();

  return (end_of_day ? parsed.endOf("day") : parsed.startOf("day")).toDate();
};

module.exports = { parse_date_boundary };
