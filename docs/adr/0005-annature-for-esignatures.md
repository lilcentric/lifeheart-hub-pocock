# ADR 0005 — Annature for E-Signatures (API Integration)

## Status
Accepted

## Context
Several onboarding documents require legally valid e-signatures (employment contracts, policies, Training Needs Analysis). Lifeheart already uses Annature. The question was whether to build e-signature capability in-house or integrate a third-party service.

## Decision
Integrate Annature via API. Annature handles legal compliance under Australia's Electronic Transactions Act, audit trails, and tamper-evident signatures. The app triggers envelopes via Annature's REST API; staff never leave the Lifeheart portal — signing is embedded or opened in a new tab via Annature's hosted signing page. Signed documents are returned via Annature webhook and stored in Supabase Storage.

## Consequences
- Annature per-envelope costs continue (accepted — not a cost concern)
- Legal compliance is Annature's responsibility, not Lifeheart's
- If Annature is discontinued or changes its API, envelope triggering breaks and migration is required
- The Training Needs Analysis uses Annature's sequential signing (staff → admin) which must be configured as a template in Annature with two signature fields in order
