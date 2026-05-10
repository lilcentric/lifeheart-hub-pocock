-- ============================================================
-- Migration 003: Extend staff_details with fields required by issue #15
-- ============================================================

alter table staff_details
  add column preferred_name             text,
  add column personal_email             text,
  add column emergency_contact_relationship text,
  add column visa_type                  text,
  add column visa_expiry_date           date;
