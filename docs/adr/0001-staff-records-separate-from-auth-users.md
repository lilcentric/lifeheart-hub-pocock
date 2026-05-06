# ADR 0001 — Staff Onboarding Records are Separate from Auth Users

## Status
Accepted

## Context
The system tracks two types of people: staff members being onboarded (the subject of checklist records) and HR/admin users who operate the system. The question was whether these should be unified — i.e. whether a staff member being onboarded should also have a login and see their own record.

## Decision
Staff members are represented only as named records (`onboarding_records.staff_name`). They have no login account and no visibility into the system. Auth users (`profiles`) are exclusively the HR staff running the onboarding process.

## Consequences
- Simpler auth model — no self-service portal, no staff-facing permissions
- Staff members cannot view or update their own checklist items
- If a self-service portal is added later, `onboarding_records` will need a foreign key to `auth.users` and a migration
