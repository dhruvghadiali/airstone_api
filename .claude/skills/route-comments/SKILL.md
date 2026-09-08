---
name: route-comments
description: Write or review the comments on a router or route file in the AIRSTONE project. Use whenever adding or changing anything under src/routes, or when asked to "comment this route", "document this router", "who can reach this endpoint". Routes are wiring and earn few comments; the ones they do earn are about access and about what is deliberately absent, and this skill says which file carries which.
---

# Route Comments

**A route file is wiring. It earns almost no comments. The two that matter are who may reach a
resource, and what is deliberately not mounted.**

`route-structure` owns how routers are composed. This skill owns what is written on them.

---

## 1. Which file carries what

| File | Comment |
|---|---|
| `src/app.js` | none — the mounts are self-describing |
| `src/routes/<role>/index.js` | one block: what this role's surface is, and anything absent by design |
| `src/routes/<role>/<feature>/index.js` | **the important one** — who may reach this resource and why |
| `src/routes/<role>/<feature>/<action>_route.js` | usually none |

The feature router is where access is decided, so it is where access is written down. Nowhere else
in the project states it, and a reader asking "who can delete a company" has exactly one file to
open.

---

## 2. The feature router

A `/** */` block above the `router.use(...)` that applies the middleware:

```js
/**
 * Every supplier credit route requires a valid token belonging to an employee.
 * Super admins reach one endpoint of this resource -- the register -- through
 * their own router, which mounts the list route and nothing else. Committing
 * the store's money is an employee action.
 */
router.use(authenticate_user, authorize_user_types(user_type.EMPLOYEE));
```

Say:

- **which roles reach this resource**, in words, not by repeating the `user_type` constants on the
  line below;
- **why**, when the answer is a business rule rather than an obvious one;
- **which other routers mount part of this resource**, because that fact lives in no single file
  and is the thing a reader will otherwise miss;
- **what is deliberately not mounted here** — see §4.

An unauthenticated feature router says so, and says why:

```js
/**
 * Signin and signup are open. They are the endpoints that issue a token, so
 * requiring one would leave nobody able to obtain the first.
 */
```

---

## 3. The role router

One block at the top of `src/routes/<role>/index.js` saying what the role's surface is:

```js
/**
 * The admin surface.
 *
 * Admins read every register a super admin can and may edit their own team's
 * rows, but reach no endpoint that creates or removes an account. Account
 * management is mounted on the super admin router alone.
 */
```

This is the map. It is worth writing even when it currently mounts one feature, because it is the
first file someone opens to answer "what can an admin do".

---

## 4. Absence is worth a comment; presence is not

A route that exists is visible. A route that does not exist is invisible, and the reason it is
missing is the fact most likely to be lost:

```js
// There is no delete route, by design. Withdrawing a credit would take its
// payment history with it, so a credit is closed rather than removed.
```

That line stops the next developer "completing the CRUD". It is the single highest-value comment
in `src/routes`.

The same applies to an order that looks arbitrary but is not:

```js
// Mounted before the `/:id` routes, so `/summary` is not read as an id.
router.use(summary_route);
```

---

## 5. Never restate the mechanics

```js
// Wrong -- every one of these says what the line already says.
// mount the list route
router.use(list_companies_route);

// require a token
router.use(authenticate_user);

// POST /signin
router.post("/signin", ...);
```

An operation route file is a path, a validator, a controller and `async_handler`. All four are
visible. It gets a comment only when something about it is not obvious — a middleware whose order
matters, a path that differs from the convention, a validator used for a reason the name does not
give.

---

## 6. Worked example

`src/routes/super_admin/auth/index.js`, as it should read:

```js
/**
 * Signup and signin are both open -- no token is required to reach either.
 *
 * Signup is the endpoint the system is bootstrapped through: until one super
 * admin exists there is nobody to authorise the call. It stays mounted after
 * that because the alternative is a route that has to be added and removed
 * around a deploy; `super_admin_signup` refuses to mint anything but a super
 * admin, so the risk it carries is a second administrator, not a privilege
 * hole.
 */
const router = express.Router();

router.use(super_admin_signup_route);
router.use(super_admin_signin_route);
```

The block records the one thing the file cannot show: that leaving signup permanently open is a
decision someone made, with a reason. Without it, the next person to read this file has to decide
whether it is a hole — and may "fix" it.

---

## 7. Definition of done

- [ ] Every feature router's `index.js` has a block saying which roles reach the resource and why.
- [ ] Every role router's `index.js` has a block describing that role's surface.
- [ ] Access is stated in words, not by restating the `user_type` constants on the next line.
- [ ] A resource mounted under more than one role says so, in the router that carries the rule.
- [ ] Anything deliberately not mounted is written down, with the reason.
- [ ] Any middleware or mount whose **order** matters carries a `//` note above it.
- [ ] No comment restates a path, a method, or the name of a validator or controller.
- [ ] Operation route files carry no comment unless something about them is genuinely not obvious.
- [ ] No comment sits inside an object literal — `comment-placement` holds here too.
