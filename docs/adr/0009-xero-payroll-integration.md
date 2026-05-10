# ADR 0009 — Xero Payroll AU Integration for Employee Self-Setup

## Status
Accepted

## Context
The original design included a staff details form collecting banking, TFN, tax, and super details directly in the app. Lifeheart already uses Xero Payroll AU, which has its own employee self-setup flow that collects this same information. Collecting it in two places creates duplication and a data accuracy risk.

## Decision
Remove payroll fields (banking, TFN, tax, super) from the in-app staff details form entirely. When an admin sends the onboarding link, the system:
1. Immediately sends the Lifeheart onboarding email (token link + reference documents), including a note that a Xero setup email will arrive within the hour
2. Creates the employee record in Xero Payroll AU via the Xero API (OAuth2)
3. Triggers the Xero self-setup invitation 1 hour later via a scheduled job

The 1-hour delay prevents both emails arriving simultaneously. The staff member enters their payroll details once, directly in Xero. The `xero_employee_id` returned by the API is stored on the onboarding record for reference.

The in-app `staff_details` table retains only fields Xero does not own: contact details, emergency contact, and right-to-work information.

## Consequences
- Xero OAuth2 credentials must be configured and maintained (token refresh handled server-side)
- If the Xero API call fails at link-send time, the onboarding link is still sent but Xero setup must be triggered manually — failure must be surfaced clearly to the admin
- Staff receive two emails: Lifeheart token link immediately, Xero self-setup 1 hour later via scheduled job. The Lifeheart email includes a note warning them to expect the Xero email.
- Payroll data lives exclusively in Xero — the app has no visibility into whether staff completed their Xero setup beyond the `xero_employee_id` being set
