-- Add filename column to onboarding_documents for display purposes
alter table onboarding_documents
  add column filename text;
