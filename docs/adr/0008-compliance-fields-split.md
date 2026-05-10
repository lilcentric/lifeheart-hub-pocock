# ADR 0008 — Split Broad Compliance Fields Into Specific Staff Upload Fields

## Status
Accepted

## Context
The initial schema used broad catch-all fields (`screening_checks_status`, `id_verification_status`, `relevant_insurance_status`) that don't reflect the distinct compliance items Lifeheart actually tracks. Phase 2 introduces a staff self-service portal where each compliance item has its own conditional logic, upload behaviour, and status milestones.

## Decision
Replace the three broad fields with seven specific fields in migration `002_compliance_split.sql`:

**Removed:**
- `screening_checks_status` (too broad)
- `id_verification_status` (replaced)
- `relevant_insurance_status` (replaced)

**Added:**
- `identity_right_to_work_status` — merged 100 points ID + right to work; single upload
- `wwcc_status` — WWCC; conditional (have one / applying); single upload
- `ndiswsc_status` — NDIS Worker Screening Check; conditional with `pending_verification` milestone; single upload
- `ndis_orientation_status` — NDIS Worker Orientation Module completion certificate; single upload
- `qualifications_status` — qualifications relevant to role; multiple uploads via `onboarding_documents` table
- `first_aid_cpr_status` — First Aid & CPR certificates; multiple uploads via `onboarding_documents` table
- `car_insurance_status` — car insurance certificate; single upload

**Enum change:** `pending_verification` added to `onboarding_status` enum. Used only by `ndiswsc_status` but available to all fields for future use.

**New tables:**
- `onboarding_documents` — one row per uploaded file for multi-upload fields (qualifications, first aid/CPR). Columns: `id`, `onboarding_record_id`, `document_type`, `storage_path`, `uploaded_at`.
- `onboarding_tokens` — stores staff self-service tokens. Columns: `id`, `onboarding_record_id`, `token` (uuid), `created_at`, `revoked_at`.
- `staff_details` — employee details form submission. One row per onboarding record.
- `contract_templates` — versioned employment contract templates with Annature template IDs.

## Consequences
- Existing records have null values for the new fields — migration sets defaults to `not_completed`
- The three removed fields must be dropped after confirming no historical data needs preserving
- `pending_verification` in the enum is forward-compatible but only NDISWSC uses it today
- Multi-upload fields require the `onboarding_documents` table rather than a simple storage path column
