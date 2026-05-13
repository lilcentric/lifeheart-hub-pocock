# Lifeheart Hub — Domain Context

## Bounded Context

Staff onboarding administration for Lifeheart. HR administrators and onboarding officers track compliance, documentation, and training for new staff members from paperwork initiation through to shift commencement. Staff members interact via a self-service token link to submit their details and trigger document signing.

---

## Core Terms

### Staff Member
A person being onboarded at Lifeheart. Does **not** have a login account. Interacts with the system only via their Onboarding Token link. Distinct from a User.

### User
A person who logs into the system (HR admin or onboarding officer). Represented by a `profiles` row linked to a Supabase Auth account. Users are never the subject of an onboarding record.

### Onboarding Record
The primary aggregate. One record per staff member undergoing onboarding. Tracks all checklist items from recruitment through to induction. Identified by a human-readable ID in the format `LF-HDC-XXXXX`.

### Onboarding Officer
The User assigned to shepherd a specific Onboarding Record to completion. Every record must have an assigned officer (required, not nullable). An officer may only edit records assigned to them.

### Role
The access level of a User. Three values:
- **admin** — full access including delete and archive; can reassign onboarding officers; manages user roles; countersigns TNA documents
- **officer** — can create records and edit records assigned to them; cannot delete
- **viewer** — read-only; deferred, not yet built

### Onboarding Token
A unique URL token generated when an admin clicks "Send onboarding link." Stored against the onboarding record. Gives the staff member access to their self-service portal without a login account. Valid until onboarding is marked complete or an admin revokes it. Staff may return to the link multiple times to complete documents in stages. The staff member's email address is used only to send the link — it is not stored on the record.

### Onboarding Status
A per-field enum value indicating the state of one checklist item. Seven values:

| Value | Label | Colour | Valid for |
|---|---|---|---|
| `completed` | Completed | Green | All fields |
| `not_completed` | Not Completed | Red | All fields |
| `not_received` | Not Received | Red | Document fields only |
| `not_signed` | Not Signed | Red | Document fields only |
| `in_progress` | In Progress | Amber | All fields |
| `pending_verification` | Pending Verification | Amber | NDISWSC only |
| `na` | N/A | Grey | All fields |

`not_received` means a document was sent to the staff member but not yet returned. `not_signed` means a document was received but not yet executed. `pending_verification` means Lifeheart has received a verification request from the NDIS screening authority and has 30 days to verify.

### Overall Status
A derived value — not stored in the database. Computed in application code from the individual field statuses. Rule: `Completed` when every non-`na` field is `completed`; `In Progress` otherwise.

### Soft Archive
Completed onboarding records can be archived by an admin. Archived records are hidden from the default tracker view but never deleted, satisfying NDIS audit retention requirements. An admin can unarchive a record. Archived records are accessible via a toggle in the tracker.

### Document Taxonomy
Every document in the onboarding process belongs to one of three types:

| Type | Description | Examples |
|---|---|---|
| **Signing** | Sent via Annature for e-signature | Employment Contract, Core Policy |
| **Self-service form** | Staff fill in structured fields; data saved to `staff_details` table | Employee Details Form |
| **Reference** | Template sent to staff for reading only; no signature required | Staff Handbook, SIL Voyager Staff Manual |

### Signing Bundle
Documents are grouped into envelopes sent at specific trigger points:

| Bundle | Trigger | Documents |
|---|---|---|
| **Employment Bundle — Immediate** | When onboarding link is sent (admin selects one Employment Bundle Template in popup) | Position Description & Code of Conduct, Employment Contract, Conflict of Interest, Core Policy, High Intensity Policy, Implementing Behaviour Support — all combined in a single Annature template |
| **FWA — Immediate (optional)** | When onboarding link is sent, if admin checks the FWA checkbox | Individual Flexible Working Agreement - Overtime / 24hr — a separate Annature envelope sent alongside the Employment Bundle |
| **TNA — Sequential** | After admin completes their TNA section | Training Needs Analysis (staff signs → admin countersigns) |
| **Reference — Immediate** | When onboarding link is sent | Staff Handbook, SIL Voyager Staff Manual |

### Training Needs Analysis
A collaborative two-step signing document. Admin enters training requirements first. Staff then add their own input via the token link. Annature sends a sequential envelope: staff sign first, the assigned admin countersigns second. Not a legacy field.

### Employment Bundle Template
A versioned Annature template that combines all core signing documents into a single envelope: Position Description & Code of Conduct, Employment Contract, Conflict of Interest, Core Policy, High Intensity Policy, and Implementing Behaviour Support. Admin selects one Employment Bundle Template per staff member at link-send time. Registered in the `employment_bundle_templates` table. Seven versions are in active simultaneous use:

| Version | Type |
|---|---|
| Employment Bundle - Permanent 2.1 | Permanent |
| Employment Bundle - Permanent 2.2 | Permanent |
| Employment Bundle - Permanent 2.3 | Permanent |
| Employment Bundle - Permanent 2.4 | Permanent |
| Employment Bundle - Casual 2.1 | Casual |
| Employment Bundle - Casual 2.2 | Casual |
| Employment Bundle - Casual 2.3 | Casual |

The selected template is recorded on the onboarding record permanently. New versions can be added without code changes. Retired versions are soft-archived. Dropdown in the admin popup groups options by employment type (Permanent / Casual).

### Flexible Working Agreement
An optional, separate Annature envelope ("Individual Flexible Working Agreement - Overtime / 24hr") that an admin can choose to send alongside the Employment Bundle at link-send time. Triggered by checking the FWA checkbox in the send-link popup. Stored as a separate envelope with its own `fwa_envelope_id` and `fwa_signing_url` on the onboarding record. Completion is tracked via `flexible_working_status` (always shown in the admin record view; defaults to `na` when not sent). Appears as a 14th item in the staff portal checklist, visible only when `flexible_working_opted_in = true`.

### Staff Details
Minimal personal information collected from the staff member via the self-service token link. Stored in a `staff_details` table linked to the onboarding record. Payroll details (banking, TFN, tax, super) are captured directly by Xero via the Xero self-setup invitation — they are not stored in this system.

Fields collected here:

**Contact:** full name, preferred name, personal email, phone

**Emergency contact:** name, relationship, phone

**Right to work:** citizenship / visa status, visa expiry (if applicable)

Submitting the form auto-updates `employee_details_form_status` to `completed`.

### Xero Integration
When an admin sends the onboarding link, the system:
1. Immediately sends the Lifeheart onboarding email to the staff member (token link + reference documents). This email includes a note: *"You will receive a separate email from Xero within the next hour to complete your payroll setup. Please look out for it."*
2. Creates an employee record in Xero Payroll AU via the Xero API
3. Triggers the Xero self-setup invitation email **1 hour later** via a scheduled job

The 1-hour delay prevents both emails arriving simultaneously and gives the staff member time to open and read the Lifeheart email first. The staff member completes their own banking, TFN, tax, and super details directly in Xero. The system connects to Xero via OAuth2 using Lifeheart's Xero Payroll AU organisation. The `xero_employee_id` is stored on the onboarding record once created, for reference.

### Staff Upload Items
Documents staff submit via the self-service token link. Each has an associated status field on the onboarding record and zero or more file slots in Supabase Storage.

| Item | Upload type | Conditional logic | Status milestones |
|---|---|---|---|
| Identity & Right to Work | Single upload zone | None — 100 points ID and right to work collected together | `not_completed` → `completed` |
| WWCC | Single upload | Upload dropzone + "Don't have one? Here's how to get it →" link (Service NSW) | `not_completed` → `completed` |
| NDIS Worker Screening Check | Single upload | Upload dropzone + "Don't have one? Here's how to get it →" link (Service NSW, Lifeheart ID: `4-IBS0H1Z`) | `not_completed` → `in_progress` → `pending_verification` → `completed` |
| NDIS Worker Orientation Module | Single upload | None | `not_completed` → `completed` |
| Additional Training Certificates | Single upload | None — staff upload any additional training certificates | `not_completed` → `completed` |
| Qualifications | Multiple uploads | None — any number of certificates, endorsements, licences | `not_completed` → `completed` |
| First Aid & CPR | Multiple uploads | None | `not_completed` → `completed` |
| Car Insurance | Single upload | None | `not_completed` → `completed` |

### Document Storage
Staff-uploaded files and Annature-returned signed documents are stored in Supabase Storage, organised by onboarding record ID. Files that support multiple uploads (Qualifications, First Aid & CPR) are stored in an `onboarding_documents` table with one row per file. Single-upload items store their path as a column on the onboarding record. OneDrive remains the current file store and will be migrated to Supabase Storage incrementally.

### Date Onboarding Began
The date the Onboarding Record was opened and paperwork initiated. May be before the staff member's first shift. Used as the baseline for "average days to complete onboarding" metrics.

### Date Shift Began
The date the staff member commenced working shifts. May precede full onboarding completion — the tracker exists specifically to surface outstanding compliance items for staff already on shift.

### Legacy Columns
Three checklist fields retained from the original spreadsheet but flagged for removal pending lean workflow sign-off: **CV**, **Uniforms**, **Onboarding Officer Default**. Displayed visually dimmed in the tracker table. Training Needs Analysis was previously in this set but has been promoted to a first-class signing document.

### Record ID
Human-readable unique identifier in the format `LF-HDC-XXXXX` where XXXXX is a zero-padded integer from a Postgres sequence. Assigned at record creation, never changes.
