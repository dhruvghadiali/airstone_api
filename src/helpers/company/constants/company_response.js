/**
 * The columns of the company itself that any endpoint may return.
 *
 * `is_active` is here because a row that can be deactivated and restored has to
 * tell the client which state it is in.
 *
 * `updated_at` is here so a client can tell whether the copy it holds is the
 * current one.
 *
 * `created_by` and `updated_by` are not. They are ids of staff accounts, and no
 * screen shows them today. Add them with a populate spec when one does, rather
 * than returning a bare id nobody can read.
 *
 * @type {string}
 */
const COMPANY_SELECT = [
  "company_name",
  "company_type",
  "email",
  "phone_number",
  "gst_number",
  "pan_number",
  "is_active",
  "created_at",
  "updated_at",
].join(" ");

/**
 * The columns of one address.
 *
 * `company` is not here. An address is only ever returned inside the company it
 * belongs to, so the id would repeat what the reader already has.
 *
 * @type {string}
 */
const COMPANY_ADDRESS_SELECT = [
  "address",
  "pincode",
  "is_active",
  "created_at",
  "updated_at",
].join(" ");

/**
 * The columns of one contact.
 *
 * `company` and `company_address` are not here, for the reason `company` is left
 * off an address: a contact is returned inside the address it works at.
 *
 * @type {string}
 */
const COMPANY_CONTACT_SELECT = [
  "name",
  "phone_number",
  "position",
  "is_active",
  "created_at",
  "updated_at",
].join(" ");

/**
 * How the list expands a company's branches and the people at them.
 *
 * `addresses` and `contacts` are populate virtuals rather than stored arrays --
 * a child knows its parent, the parent keeps no list -- so nothing is fetched
 * until this spec asks for it.
 *
 * Each `match` hides deactivated children. A company that is still traded with
 * should not list a branch that has closed, and the row would otherwise
 * contradict what the address and contact endpoints return. This is presentation
 * rather than protection: the rows are still there, and any query that forgets
 * the match will see them.
 *
 * The children shown are all of the company's active ones, never only those that
 * matched a filter. A search decides which companies appear, not what each one
 * contains, so a row is the same complete picture of the company however it was
 * found.
 */
const COMPANY_TREE_POPULATE = Object.freeze([
  Object.freeze({
    path: "addresses",
    select: COMPANY_ADDRESS_SELECT,
    match: { is_active: true },
    populate: Object.freeze({
      path: "contacts",
      select: COMPANY_CONTACT_SELECT,
      match: { is_active: true },
    }),
  }),
]);

/**
 * The shape every company response is built from.
 *
 * Read through `get_response_shape(company_response, "<action>")`.
 *
 * `default` is the bare company, and it is what create, update and delete
 * answer with. Its `populate` is empty: a company references only the staff
 * accounts that created and updated it, and neither is returned.
 *
 * `list` is the same columns with the tree hung off them, because a table of
 * companies is the one place a reader wants the branches and the people without
 * asking again. It is a variant rather than a change to `default` so a create
 * reply does not start carrying an empty `addresses` array for children it just
 * wrote and already returned.
 *
 * Both selects list the company's own columns only. `addresses` is a virtual, so
 * it is not a column a projection has to name -- naming it would ask the
 * database for a field that does not exist.
 */
const company_response = Object.freeze({
  default: Object.freeze({
    select: COMPANY_SELECT,
    populate: Object.freeze([]),
  }),
  list: Object.freeze({
    select: COMPANY_SELECT,
    populate: COMPANY_TREE_POPULATE,
  }),
});

/**
 * The shape every company address response is built from.
 *
 * Kept apart from `company_response` rather than made a variant of it, because
 * the two describe different things. A variant is one entity serialised two
 * ways; this is a second entity.
 */
const company_address_response = Object.freeze({
  default: Object.freeze({
    select: COMPANY_ADDRESS_SELECT,
    populate: Object.freeze([]),
  }),
});

/**
 * The same contact columns plus the two ids that say where the person sits.
 *
 * A populate path has to be in the projection or mongoose has no reference to
 * follow, so the contact list selects `company` and `company_address` even
 * though what a reader wants is the documents behind them.
 *
 * @type {string}
 */
const COMPANY_CONTACT_LIST_SELECT = [
  COMPANY_CONTACT_SELECT,
  "company",
  "company_address",
].join(" ");

/**
 * How the contact list expands the branch a person works at and the firm that
 * owns it.
 *
 * Both are real reference fields on the contact rather than virtuals: a contact
 * stores its company as well as its address, so the firm is one lookup rather
 * than a hop through the address. They are returned side by side for the same
 * reason -- nesting the company under the address would suggest the contact
 * reached it that way.
 *
 * Neither carries a `match`. A `match` on a to-one reference does not hide the
 * row, it replaces the document with null, so a contact under a deactivated
 * company would arrive claiming to belong to nobody. Both selects include
 * `is_active`, which says the same thing honestly.
 */
const COMPANY_CONTACT_PARENTS_POPULATE = Object.freeze([
  Object.freeze({ path: "company", select: COMPANY_SELECT }),
  Object.freeze({ path: "company_address", select: COMPANY_ADDRESS_SELECT }),
]);

/**
 * The shape every company contact response is built from. A third entity, so a
 * third config, for the reason given above.
 *
 * `default` is the bare contact, and it is what update and delete answer with.
 * A contact returned inside a company already sits under the address it belongs
 * to, so repeating either id there would say what the nesting already says.
 *
 * `list` is that plus the branch and the firm, because a table of contacts is
 * read across companies -- a row saying only "Ramesh, purchase" is of no use
 * without the firm beside it.
 */
const company_contact_response = Object.freeze({
  default: Object.freeze({
    select: COMPANY_CONTACT_SELECT,
    populate: Object.freeze([]),
  }),
  list: Object.freeze({
    select: COMPANY_CONTACT_LIST_SELECT,
    populate: COMPANY_CONTACT_PARENTS_POPULATE,
  }),
});

module.exports = {
  company_response,
  company_address_response,
  company_contact_response,
  COMPANY_SELECT,
  COMPANY_ADDRESS_SELECT,
  COMPANY_CONTACT_SELECT,
  COMPANY_CONTACT_LIST_SELECT,
};
