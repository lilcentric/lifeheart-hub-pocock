# ADR 0003 — Officer Write Access Scoped to Assigned Records

## Status
Accepted

## Context
The system has three roles: admin, officer, viewer. The original plan used a single RLS policy granting identical write access to both admins and officers across all records. This would allow an officer to edit or delete any record in the system.

## Decision
Officer write access is scoped by row-level security to records where `onboarding_officer = auth.uid()`. Officers can insert new records (and become the assigned officer) and update only their own. Deletion is restricted to admins only. Every record requires a non-null `onboarding_officer` at creation — orphan records with no assigned officer are not permitted.

## Consequences
- An officer cannot edit a record reassigned away from them without admin intervention
- If an officer leaves and records need reassigning, an admin must update `onboarding_officer` directly
- Eliminates a class of accidental cross-officer edits
