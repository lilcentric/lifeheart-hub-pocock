# ADR 0007 — Contract Templates Stored in Database Table

## Status
Accepted

## Context
Employment contracts have six active versions (Permanent 2.1–2.3, Casual 2.1–2.3) and new versions will be added over time. The question was whether to hardcode template IDs in environment variables or manage them in a database table.

## Decision
Store contract templates in a `contract_templates` table with columns for name, employment type, version, Annature template ID, and a soft-archived flag. All six versions are simultaneously active — admin selects the appropriate version per staff member when sending Bundle B. The selected template ID is recorded on the onboarding record permanently.

## Consequences
- New contract versions can be added by an admin via the UI without a code deployment
- Retired versions are soft-archived (hidden from selection) but remain on historical records for audit purposes
- Annature template IDs must be kept in sync with what exists in Annature's template library — stale IDs will cause envelope creation to fail silently if not validated
