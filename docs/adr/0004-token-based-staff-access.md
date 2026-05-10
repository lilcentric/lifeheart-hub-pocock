# ADR 0004 — Token-Based Access for Staff Self-Service Portal

## Status
Accepted

## Context
Staff members need to submit their personal details and trigger document signing during onboarding. The question was whether to give staff a full login account or use a simpler access mechanism.

## Decision
Staff members access their self-service portal via a unique URL token generated at the time the admin sends the onboarding link. No login account, no password. The token is stored against the onboarding record and is valid until onboarding completes or an admin revokes it. Staff may return to the link multiple times.

## Consequences
- Staff have no persistent account — if they lose the email they cannot recover access without admin intervention (admin can resend the link)
- No password management, no staff-facing account UI
- Token must be cryptographically random and long enough to resist guessing
- If a self-service account with login becomes a future requirement, a migration to link tokens to auth accounts is needed
