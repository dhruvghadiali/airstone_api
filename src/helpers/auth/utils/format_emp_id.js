const _ = require("lodash");

const { emp_id_generation } = require("@validators/constants");

/**
 * Joins a prefix and a counter into a finished employee id.
 *
 * The counter is padded to a fixed width so every id in a month is the same
 * length. That is what lets `get_last_emp_id_sequence` find the highest one by
 * sorting as text: at equal width, text order and number order agree.
 *
 * @param   {string} prefix    The `YYMM` half, from `build_emp_id_prefix`.
 * @param   {number} sequence  The counter for that month, starting at 1.
 * @returns {string} Seven characters, for example `2609001`.
 */
const format_emp_id = (prefix, sequence) =>
  `${prefix}${_.padStart(sequence, emp_id_generation.SEQUENCE_LENGTH, "0")}`;

module.exports = { format_emp_id };
