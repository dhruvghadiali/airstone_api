---
name: route-structure
description: Create, modify, review, or refactor Express routers and route files in the AIRSTONE project. Use whenever adding a new router, CRUD route, role route group, feature index.js, route middleware, or files under src/routes. Every role and feature must follow the same imports, router composition, middleware order, validator/controller barrel usage, naming, and export conventions.
---

# Route Structure

Routes are the HTTP composition layer. They declare paths and middleware, then hand validated
requests to controllers. They must not contain business logic, database queries, validation rules,
response construction, or direct model access.

## 1. Route tree and responsibilities

| Layer | Location | Responsibility |
|---|---|---|
| Application mount | `src/app.js` | Mount role routers under the public URL prefix and install global middleware/error handlers |
| Role root | `src/routes/<role>/index.js` | Compose role feature routers and role-specific health/auth routes |
| Feature router | `src/routes/<role>/<feature>/index.js` | Apply authentication/authorization and compose operation route modules |
| Leaf route | `src/routes/<role>/<feature>/<operation>_<feature>_route.js` | Declare one HTTP operation, its validators, and its controller |
| Shared middleware | `src/middlewares/` | Authenticate, authorize, validate, handle async errors |
| Controller | `src/controllers/<feature>/` | Perform business logic, database work, and response handling |

Use CommonJS `require(...)`, project aliases, double quotes, 2-space indentation, trailing commas,
and `module.exports = router`. Keep one operation per leaf route file.

## 2. Inspect before editing

Before adding or changing a route:

1. Read the nearest role root and feature `index.js`.
2. Read a neighboring leaf route for the same operation.
3. Read the controller export and the request-body, query-param, and route-param barrels.
4. Confirm the URL prefix mounted in `src/app.js` and every nested `router.use` prefix.
5. Confirm the role is allowed to perform the operation; role differences are intentional and must
   not be copied blindly from another role.

The final URL is the concatenation of all mount prefixes and the leaf path. Write that URL down when
adding a route so a feature cannot accidentally introduce a duplicate or unreachable endpoint.

## 3. Canonical leaf route

Imports are grouped as third-party, controller, middleware, validators, then the async wrapper. Use
barrel aliases for controllers and validators; never import a model or a validator implementation
file directly from a route.

```js
const express = require("express");

const { update_item } = require("@controllers/item");
const { update_item_schema } = require("@validators/request_body");
const { item_id_params_schema } = require("@validators/route_params");
const {
  validate_body,
  validate_params,
} = require("@middlewares/validate_request");

const async_handler = require("@middlewares/async_handler");

const router = express.Router();

router.patch(
  "/:id",
  validate_params(item_id_params_schema),
  validate_body(update_item_schema),
  async_handler(update_item),
);

module.exports = router;
```

Operation rules:

- `POST /` uses `validate_body(create_<feature>_schema)` when a body exists.
- `GET /` uses `validate_query(list_<feature>_query_schema)` for list endpoints.
- `GET /:id` uses `validate_params(<feature>_id_params_schema)`.
- `PATCH /:id` validates params first, then the update body.
- `DELETE /:id` validates params before the controller.
- Action routes such as `PATCH /:id/reassign` validate params, then the action body.
- `async_handler(...)` is always the final middleware before the controller call.
- Do not add validators to routes with no corresponding input, and do not add duplicate
  authentication or validation middleware in both a feature index and every leaf route.

For a bodyless route:

```js
router.delete(
  "/:id",
  validate_params(item_id_params_schema),
  async_handler(delete_item),
);
```

For a list route:

```js
router.get(
  "/",
  validate_query(list_items_query_schema),
  async_handler(list_items),
);
```

## 4. Feature router composition

The feature index owns access control and composes leaf routes. It does not implement operations:

```js
const express = require("express");

const { user_type } = require("@enums");
const {
  authenticate_user,
  authorize_user_types,
} = require("@middlewares/authenticate_user");

const get_item_route = require("@routes/employee/item/get_item_route");
const list_items_route = require("@routes/employee/item/list_items_route");
const create_item_route = require("@routes/employee/item/create_item_route");
const update_item_route = require("@routes/employee/item/update_item_route");
const delete_item_route = require("@routes/employee/item/delete_item_route");

const router = express.Router();

router.use(authenticate_user, authorize_user_types(user_type.EMPLOYEE));
router.use(get_item_route);
router.use(list_items_route);
router.use(create_item_route);
router.use(update_item_route);
router.use(delete_item_route);

module.exports = router;
```

Keep operation ordering consistent: get, list, create, update, delete. If a path is a prefix of
another path, mount the more specific route first. For example, mount `/:id/reassign` before
`/:id` so the action cannot be captured by the generic route.

Role-specific rules:

- Apply `authenticate_user` and `authorize_user_types(...)` once at the feature router boundary.
- Read-only role mirrors may compose only list/get routes; do not expose create/update/delete by
  copying a writable feature router.
- Auth routes are the exception to authenticated feature middleware and must remain public unless
  the existing role contract says otherwise.
- Keep role root prefixes and feature prefixes explicit. Do not hide URL prefixes inside leaf files.

## 5. Role roots and application mounting

Role roots compose feature routers under stable URL prefixes:

```js
const express = require("express");

const auth_router = require("@routes/employee/auth");
const item_router = require("@routes/employee/item");

const router = express.Router();

router.use("/auth", auth_router);
router.use("/items", item_router);

module.exports = router;
```

`src/app.js` mounts each role root, then installs not-found and error handlers after all routes.
Do not register a feature directly in `app.js` when it belongs to a role root.

## 6. Barrels and unused code

- Import controllers from `@controllers/<feature>` and validators from
  `@validators/request_body`, `@validators/query_params`, or `@validators/route_params`.
- When a new leaf route is added, require it from its feature `index.js` and mount it exactly once.
- Remove imports whose identifiers are not used by the file.
- Remove route modules that are not mounted only when confirmed unused and not intentionally reserved;
  do not delete an endpoint merely because another role has a read-only mirror.
- Do not import `express` or construct a router in a barrel that only re-exports values.
- Do not add helper functions or constants to a route file when the controller or middleware owns
  that behavior.

## 7. Comments

A route file is wiring and earns almost no comments. The two that matter: **the feature router's
`index.js` says which roles reach this resource and why**, and **anything deliberately not mounted
is written down with the reason** — a route that does not exist is invisible, and "there is no
delete route, by design" is what stops the next developer completing the CRUD.

Never restate the mechanics. `// mount the list route` earns nothing.

**`route-comments` is the full rule** — which file carries which comment, the feature router block,
the role router block, and the checklist. Read it before writing or reviewing route comments.

---

## 8. moment and lodash

Both are project dependencies (`moment ^2.30.1`, `lodash ^4.18.1`). Reach for them **whenever the
logic needs them** rather than hand-rolling the equivalent -- `moment` for every date computation
beyond passing a `Date` through, `lodash` for defensive access (`_.get`), key-set comparison
(`_.difference`), and coercion (`_.toNumber` then `_.isInteger`). Offsets and format strings come
from `@validators/constants`, never inlined.

Not where the language already reads better: `map`/`filter`/`find` on a plain array, optional
chaining rather than `_.get` on a value Joi already guaranteed, `Object.assign` rather than
`_.merge`.

A route file should need neither. If one has grown a `moment` import, the logic belongs in the
controller or, more likely, in that feature's helper.

---

## 9. Verification checklist

After editing routes:

1. Require every role root with `node -r module-alias/register`.
2. Confirm every feature index and leaf exports an Express router.
3. Confirm every mounted route module is mounted exactly once.
4. Confirm every leaf controller is imported from its controller barrel and every validator from its
   validator barrel.
5. Confirm params, query, and body validation appear before `async_handler` and the controller.
6. Confirm each path placeholder matches its route-parameter schema key.
7. Confirm specific action paths are mounted before generic `/:id` paths.
8. Confirm no comment sits inside an object literal, and that the feature router's `index.js`
   carries a header naming the roles that reach the resource.
9. Run `git diff --check` and remove unused imports or route declarations.

Keep route changes focused. Do not move business logic from controllers into routes or refactor
unrelated middleware while adding one endpoint.