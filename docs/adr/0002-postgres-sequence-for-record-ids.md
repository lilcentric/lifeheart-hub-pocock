# ADR 0002 — Postgres Sequence for LF-HDC-XXXXX Record IDs

## Status
Accepted

## Context
Onboarding records use a human-readable ID format (`LF-HDC-XXXXX`). The original plan generated IDs in application code by querying `max(id)`, parsing the sequence number, incrementing, and inserting. This is a race condition: two concurrent inserts both read the same max and generate a duplicate ID, causing one to fail with a primary key violation.

## Decision
Use a Postgres sequence (`create sequence onboarding_id_seq`) as the source of truth for the numeric component. The ID is formatted server-side. Application code calls a Supabase RPC rather than computing the ID itself.

## Consequences
- No duplicate ID collisions under concurrent inserts
- ID generation cannot be replicated in application code without a DB round-trip
- Sequence gaps are possible (rolled-back transactions do not return their sequence value) — this is acceptable; IDs need to be unique, not gapless
