/**
 * The bounds and formats the companies collection is held to.
 *
 * A company's email and phone number formats are not here. They are the same
 * formats a user's are, so both read `validation_patterns` in `common`. Their
 * lengths still come from `user_validation_limits`.
 *
 * `ADDRESS_LIST_MIN_ITEMS` is about the `address` array the create endpoint
 * takes, not about an address. A company is entered with the place it trades
 * from, so one address is the floor.
 *
 * `GST_NUMBER_LENGTH` and `PAN_NUMBER_LENGTH` are single fixed lengths, not
 * ranges, so they take no MIN/MAX pair. The patterns are what actually reject a
 * malformed number; the lengths exist so the model can say what it expects
 * before the regex runs, and so the message can name a figure.
 *
 * `GST_NUMBER` reads left to right as five parts. A two digit state code. The
 * holder's ten character PAN. A one digit registration number for that PAN in
 * that state. The letter Z. A checksum character.
 */
const company_validation_limits = Object.freeze({
  ADDRESS_LIST_MIN_ITEMS: 1,
  COMPANY_NAME_MIN: 2,
  COMPANY_NAME_MAX: 150,
  GST_NUMBER_LENGTH: 15,
  PAN_NUMBER_LENGTH: 10,
});

const company_validation_patterns = Object.freeze({
  PAN_NUMBER: /^[A-Z]{5}[0-9]{4}[A-Z]$/,
  GST_NUMBER: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/,
});

module.exports = { company_validation_limits, company_validation_patterns };
