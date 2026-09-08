/**
 * The business runs on Indian Standard Time, so a day boundary means IST
 * midnight wherever the process happens to run. Kept here because both emp_id
 * generation and the list date filters depend on it.
 */
const app_time = Object.freeze({
  TIMEZONE: "Asia/Kolkata",
  UTC_OFFSET: "+05:30",
});

/**
 * The Indian financial year runs 1 April to 31 March, so "this year" on a
 * dashboard means April onwards and not January onwards. Kept beside `app_time`
 * because the two are one decision: the year turns at IST midnight on 1 April,
 * not at the server's local midnight.
 *
 * `START_MONTH_INDEX` is moment's zero based month index, so 3 is April.
 *
 * `MONTH_KEY_FORMAT` and `MONTH_KEY_DB_FORMAT` spell the same key -- the year
 * and month of one bucket -- in the two dialects that have to agree on it:
 * moment builds the twelve buckets a chart is drawn from, `$dateToString`
 * labels the rows the database groups. They are declared together so a change
 * to one is a change to the other in the same edit.
 */
const financial_year = Object.freeze({
  START_MONTH_INDEX: 3,
  MONTHS_IN_YEAR: 12,
  MONTH_KEY_FORMAT: "YYYY-MM",
  MONTH_KEY_DB_FORMAT: "%Y-%m",
  MONTH_NAME_FORMAT: "MMMM",
  LABEL_SEPARATOR: "-",
});

const pagination_defaults = Object.freeze({
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
});

const validation_limits = Object.freeze({
  OBJECT_ID_LENGTH: 24,
});

/**
 * Money is stored as a plain number, and the paisa is the smallest unit any
 * amount anywhere in the system may carry.
 *
 * Kept here rather than repeated per module because purchases, sales and
 * supplier credits are not three independent decisions about precision -- they
 * are the same rupee. A module still spells the value into its own limits
 * object, so `<module>_validation_limits.AMOUNT_DECIMAL_PLACES` keeps reading
 * the way every other limit does.
 */
const money_precision = Object.freeze({
  AMOUNT_DECIMAL_PLACES: 2,
});

const sort_order = Object.freeze({
  ASC: "asc",
  DESC: "desc",
});

const sort_defaults = Object.freeze({
  FIELD: "created_at",
  ORDER: sort_order.DESC,
  // A sort key separates its field from its direction, several keys are joined
  // by a comma: sort=user_type:asc,first_name:asc
  KEY_SEPARATOR: ":",
  LIST_SEPARATOR: ",",
  // Sorting on more keys than this stops helping a reader and starts costing
  // the database an in memory sort.
  MAX_FIELDS: 3,
});

module.exports = {
  app_time,
  financial_year,
  money_precision,
  pagination_defaults,
  sort_order,
  sort_defaults,
  validation_limits,
};
