/**
 * The fixed value sets the company feature stores.
 *
 * `company_type` records which side of the business a company sits on. `both`
 * exists because a firm AIRSTONE buys stone from is frequently a firm it also
 * sells to, and splitting that into two company records would give the same
 * legal entity two GST numbers in the system.
 *
 * `contact_position` is who the person at the company is to us, not their
 * printed job title. It is deliberately short: it exists so a purchase call
 * reaches the purchase desk rather than the owner, and a widening list of
 * titles would stop being useful for that. `other` is the escape hatch for a
 * contact who fits none of the five.
 */
const company_type = Object.freeze({
  BOTH: "both",
  CUSTOMER: "customer",
  SUPPLIER: "supplier",
});

const contact_position = Object.freeze({
  OTHER: "other",
  OWNER: "owner",
  SALES: "sales",
  MANAGER: "manager",
  ACCOUNTS: "accounts",
  PURCHASE: "purchase",
});

/**
 * The company types we may buy from.
 *
 * A firm we only sell stone to cannot supply us raw material, so a supplier
 * list is held to this set rather than to every company on file. `both` is in
 * it because the same firm often sells to us and buys from us.
 *
 * Built from `company_type` rather than typed again, so renaming a value moves
 * this set with it.
 */
const supplier_company_types = Object.freeze([
  company_type.BOTH,
  company_type.SUPPLIER,
]);

module.exports = { company_type, contact_position, supplier_company_types };
