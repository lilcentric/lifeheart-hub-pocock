# ADR 0006 — Supabase Storage Over OneDrive for Document Storage

## Status
Accepted

## Context
Lifeheart currently stores documents in OneDrive. The question was whether to integrate OneDrive via Microsoft Graph API or use Supabase Storage for uploaded and signed documents.

## Decision
Use Supabase Storage. Files are organised by onboarding record ID. Signed documents returned from Annature webhooks are stored here automatically. Staff-uploaded documents go here via the token link portal.

## Consequences
- Microsoft Graph API integration is avoided — no Azure App Registration, no OAuth credentials to manage
- OneDrive remains the current store; migration to Supabase Storage happens incrementally at Lifeheart's pace
- Supabase Storage costs scale with storage volume (acceptable at current staff onboarding rates)
- If Lifeheart needs OneDrive access specifically (e.g. existing staff browsing files there), a sync or export feature would be needed as a future addition
