# AIRSTONE API — Product Requirements Document

**Version:** 1.0
**Status:** Base version — describes what is built today
**Last updated:** 2026-09-08
**Related document:** `docs/trd/v1/trd_v1.md`

---

## 1. About this document

This document explains **what** the AIRSTONE API must do and **why**.
It does not explain how the code works. That is in the technical document
(the TRD) listed above.

Anyone can read this document. You do not need to be a developer.

---

## 2. Overview

AIRSTONE API is the backend service for the AIRSTONE system. A backend is the
part that stores the data and applies the rules. Apps and websites talk to it.

This service takes care of two things:

1. **Who you are** — it keeps the list of users and checks their passwords.
2. **What you are allowed to do** — it puts every user into one of three groups
   and keeps each group inside its own area.

### 2.1 Why we start here

AIRSTONE staff work at different levels. They all use the same system, but they
must not all see the same things. An admin should not be able to create other
admins. A normal employee should not reach admin screens at all.

If we build work features first and add these rules later, every feature would
need its own set of checks. Those checks would slowly stop matching each other.
That is how security holes appear. So we fix the rules first, then build
features on top of them.

### 2.2 What version 1 must achieve

| # | Goal | How we know it is done |
| - | ---- | ---------------------- |
| G1 | Three separate groups of users, each with its own way in | Each group has its own login and its own set of web addresses |
| G2 | A pass given to one group cannot open another group's doors | The group is stored inside the pass and checked on every request |
| G3 | The one super admin can be made on an empty system, and only once | There is a documented way to create it that needs no earlier account, and it refuses a second |
| G4 | Every user has a short ID staff can quote | The system makes the ID itself, and no two users share one |
| G5 | Every reply from the API looks the same | Success and failure use one common format |

## 3. The three user groups

Every user belongs to **one** group. A user cannot be in two groups at once.

### 3.1 Super admin

The owner of the system. **There is exactly one.** The system does not allow a
second.

- This is the only group that can be created on an empty system.
- Once that one account exists, the system refuses to create another. The
  address that creates it closes by itself.
- Creates **admins**. It cannot create employees; that is the admin's job.
- No one can create, change, or remove a super admin through the normal user
  screens. This is on purpose. It means the system can never end up with zero
  super admins.

### 3.2 Admin

Day-to-day management. Admins run the system inside the limits a super admin
sets.

- Logs in through the admin login only.
- Cannot create or change a super admin, and cannot create another admin.
- Creates **employees**.

### 3.3 Employee

The largest group, and the normal setting for any new account.

- Logs in through the employee login only.
- Has no admin powers at all.
- Creates nobody.

### 3.4 Who can do what — version 1

Each group creates the group below it. A super admin creates admins. An admin
creates employees. An employee creates nobody. Nobody creates a super admin,
because there is only ever one and it is made at install time.

| Task | Super admin | Admin | Employee |
| ---- | :---------: | :---: | :------: |
| Create the one super admin account (install time only) | Open to all¹ | No | No |
| Log in at own login page | Yes | Yes | Yes |
| Log in at another group's login page | No | No | No |
| Open `/super-admin` addresses | Yes | No | No |
| Open `/admin` addresses | No | Yes | No |
| Open `/employee` addresses | No | No | Yes |
| Create a second super admin | Never | Never | Never |
| Create an admin | Yes | No | No |
| Create an employee | No | Yes | No |
| See the list of admin accounts | Yes | No | No |
| See the list of employee accounts | Yes | Yes | No |
| Turn off an admin account | Yes | No | No |
| Turn off an employee account | Yes | Yes | No |
| Turn off a super admin account | Never | Never | Never |

¹ This one has to be open. There is no account yet, so there is nobody to
approve it. It stops working as soon as the super admin exists, so it is open
only until it is first used.

Turning an account off does not delete it. The record stays, marked as not
active, and the person can no longer log in. Nothing in version 1 turns one back
on. A super admin account is left out of every row above on purpose: there is
only one, and the system must not offer a way to remove the only account that
can make an admin.

---

## 4. The rules the system must follow

Each rule has a number so the technical document can point back to it.

### 4.1 Creating the first account

- **FR-1.1** There must be one address, open to all, that creates the super
  admin account.
- **FR-1.2** The system must set the group to super admin itself. If the caller
  tries to send a group, the request must be refused.
- **FR-1.3** The system must make the employee ID itself. If the caller tries to
  send one, the request must be refused.
- **FR-1.4** These details are needed: first name, last name, email, phone
  number, username, password.
- **FR-1.5** Email, phone number, username, and employee ID must each be unique
  across all users, in every group.
- **FR-1.6** Passwords must never be stored in a way that lets anyone read them
  back.
- **FR-1.7** A new account must be sent back **without** a pass. Creating an
  account is not the same as logging in.
- **FR-1.8** If the email, phone number, or username is already taken, the reply
  must say which one.
- **FR-1.9** The system must hold **exactly one** super admin. Once that account
  exists, this address must refuse every later attempt with a clear message
  saying a super admin is already there. A switched-off super admin still
  counts, so switching it off does not reopen the address.

### 4.2 Creating admins and employees

- **FR-1.10** A super admin must be able to create an **admin**. Nobody else
  may. This is the admin signup.
- **FR-1.11** An admin must be able to create an **employee**. Nobody else may,
  including a super admin. Each group creates the group below it and no other.
  This is the employee signup.
- **FR-1.12** Both must accept these five details and nothing else: first name,
  last name, email, phone number, username. Sending a group, an employee ID, or
  a password must be refused.
- **FR-1.13** The system must set the new account's group itself, from the
  address that was called.
- **FR-1.14** The system must make the employee ID itself, by the same rule as
  section 4.5 (the employee ID).
- **FR-1.15** Every account created this way must start on one shared default
  password. The person who created the account passes it on. The reply must not
  repeat it.
- **FR-1.16** The reply must include the employee ID the system made, because
  that is the only place the caller can learn it.
- **FR-1.17** The same uniqueness rules apply as FR-1.5. A repeated email, phone
  number, or username must say which one.

### 4.3 Logging in

- **FR-2.1** Each of the three groups must have its own login address.
- **FR-2.2** A login must accept a username and a password, and nothing else.
- **FR-2.3** A login must only accept accounts from its own group. The group
  must never be taken from the request.
- **FR-2.4** Only accounts that are switched on may log in.
- **FR-2.5** A wrong username, a wrong password, an account from the wrong
  group, and a switched-off account must all give the same reply.
- **FR-2.6** A good login must send back the account details and a pass that
  stops working after a set time.
- **FR-2.7** The pass must hold the user's ID and group.
- **FR-2.8** The account details sent back must never include the password.

### 4.4 Checking who may do what

- **FR-3.1** Protected addresses must need a valid pass.
- **FR-3.2** A missing pass, a broken pass, or a pass we did not issue must be
  refused with "please log in".
- **FR-3.3** A pass that has run out of time must give a different message from
  a broken pass, so an app can tell "log in again" apart from "something is
  wrong".
- **FR-3.4** A valid pass from a group that is not allowed on an address must be
  refused with "you are not allowed". This is a different reply from "please log
  in".
- **FR-3.5** If a developer sets up an address with a group name that does not
  exist, the service must fail to start. It must not wait until a real user
  arrives.

### 4.5 The employee ID

- **FR-4.1** The ID must be 7 characters: two digits for the year, two for the
  month, and three for a running number.
- **FR-4.2** The running number must go back to 001 at the start of every month.
  The month is counted in Indian Standard Time.
- **FR-4.3** Two accounts created at the very same moment must never get the
  same ID.
- **FR-4.4** Once 999 accounts exist for one month, the system must refuse with
  a clear message that says exactly this, not a general error.

### 4.6 Replies

- **FR-5.1** Every reply, good or bad, must have a status, a message a person
  can read, and a data section.
- **FR-5.2** The data section must always be an object `{ }`, even when there is
  nothing to send, in which case it is empty. It must never be a list, a plain
  value, or missing.
- **FR-5.3** A list of records must sit inside the data object under a name. The
  list must never be the data section itself. This way an app tells a single
  record apart from a list by its name, not by its shape.
- **FR-5.4** When the details sent in are wrong, the reply must point out each
  wrong field one by one, as a list under the name `errors`.
- **FR-5.5** When something breaks on our side, the reply must give a general
  message and an empty data object. It must never show inner details.

---

## 5. Other requirements

| Area | What is needed |
| ---- | -------------- |
| **Security** | Passwords are stored scrambled, and cannot be turned back. Passes are signed with a secret key that comes from the server settings. If that key is missing, the service must refuse to work rather than run without it. Standard safety headers go on every reply. |
| **The shared starting password** | Every account an admin or a super admin creates begins on the same fixed password, and nothing yet forces the person to change it. Anyone who knows that value can sign into any account that still has it. This is a known weak point, accepted because there is no email provider to send an invite through. Making a new user change it at first sign-in is the fix, and it is not built. |
| **Privacy** | The password is left out of every read and every reply by default. This is done in two separate places, so one mistake does not expose it. |
| **Correctness** | The database itself checks that emails, phone numbers, and usernames are unique. We do not rely on the code checking first, because two requests arriving together could both pass that check. |
| **Clear errors** | A caller must always be able to tell whose problem it is: their input (400), their password (401), their group (403), a clash with data that already exists (409), or ours (500). Field-level details go under `data.errors`. |
| **Easy to move** | Anything that changes between machines — database address, secret key, pass lifetime, port — comes from settings. None of it is written into the code. |
| **Easy to maintain** | Group names, size limits, and the wording shown to users are each written in one place only, so a change is made once. |
| **Visibility** | Every request is logged. Unexpected faults are logged in full on the server, while the caller only sees a general message. |
| **Runtime** | Node.js version 20 or newer. |

---

## 6. Assumptions

- All users are AIRSTONE staff. There is no public sign-up.
- There is one service and one database. We do not serve several companies from
  one system.
- The company works in Indian Standard Time, and the employee ID month follows
  it.
- The apps using this API belong to us, so they can hold a pass safely.

---

## 7. Word list

| Word | What it means here |
| ---- | ------------------ |
| **Group (user type)** | One of super admin, admin, or employee. It decides which addresses a user can open, and which group a user may create. |
| **Pass (token)** | The thing you get when you log in. You send it with later requests to prove who you are. It stops working after a set time. |
| **First-time setup (bootstrap)** | Creating the very first account on an empty system, without logging in, because there is nobody yet to approve it. It works only once. |
| **Signup** | Creating an account. The super admin signup is the first-time setup above; the admin and employee signups are done by a signed-in person one level up. |
| **`emp_id`** | The 7-character employee ID the system makes for each user. |
| **Login page (entry point)** | The address one group uses to log in. |
| **Reply format (envelope)** | The common shape every reply uses: a status, a message, and a data object. |
| **Backend** | The part that stores data and applies rules. Apps talk to it; people do not see it. |
