# Lifeheart Hub — Domain Context

## Bounded Context

Staff onboarding administration for Lifeheart. HR administrators and onboarding officers track compliance, documentation, and training for new staff members from paperwork initiation through to shift commencement.

---

## Core Terms

### Staff Member
A person being onboarded at Lifeheart. Exists only as a named record in the system — does **not** have a login account. Distinct from a User.

### User
A person who logs into the system (HR admin or onboarding officer). Represented by a `profiles` row linked to a Supabase Auth account. Users are never the subject of an onboarding record.

### Onboarding Record
The primary aggregate. One record per staff member undergoing onboarding. Tracks all checklist items from recruitment through to induction. Identified by a human-readable ID in the format `LF-HDC-XXXXX`.

### Onboarding Officer
The User assigned to shepherd a specific Onboarding Record to completion. Every record must have an assigned officer (required, not nullable). An officer may only edit records assigned to them.

### Role
The access level of a User. Three values:
- **admin** — full access including delete; can reassign onboarding officers; manages user roles
- **officer** — can create records and edit records assigned to them; cannot delete
- **viewer** — read-only; deferred, not yet built

### Onboarding Status
A per-field enum value indicating the state of one checklist item. Six values:

| Value | Label | Colour | Valid for |
|---|---|---|---|
| `completed` | Completed | Green | All fields |
| `not_completed` | Not Completed | Red | All fields |
| `not_received` | Not Received | Red | Document fields only |
| `not_signed` | Not Signed | Red | Document fields only |
| `in_progress` | In Progress | Amber | All fields |
| `na` | N/A | Grey | All fields |

`not_received` means a document was sent to the staff member but not yet returned. `not_signed` means a document was received but not yet executed. These two values are only meaningful for document-type checklist fields (position description, employment contract, code of conduct, employee details form, ID verification, relevant insurance, conflict of interest).

### Overall Status
A derived value — not stored in the database. Computed in application code from the individual field statuses. Rule: `Completed` when every non-`na` field is `completed`; `In Progress` otherwise.

### Date Onboarding Began
The date the Onboarding Record was opened and paperwork initiated. May be before the staff member's first shift. Used as the baseline for "average days to complete onboarding" metrics.

### Date Shift Began
The date the staff member commenced working shifts. May precede full onboarding completion — the tracker exists specifically to surface outstanding compliance items for staff already on shift.

### Legacy Columns
Four checklist fields retained from the original spreadsheet but flagged for removal pending lean workflow sign-off: **CV**, **Training Needs**, **Uniforms**, **Onboarding Officer Default**. Displayed visually dimmed in the tracker table to signal their provisional status.

### Record ID
Human-readable unique identifier in the format `LF-HDC-XXXXX` where XXXXX is a zero-padded integer from a Postgres sequence. Assigned at record creation, never changes.
