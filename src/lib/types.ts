export type EmploymentType = "permanent" | "casual";

export type OnboardingStatus =
  | "completed"
  | "not_completed"
  | "not_received"
  | "not_signed"
  | "in_progress"
  | "pending_verification"
  | "na";

export type UserRole = "admin" | "officer" | "viewer";

export type Profile = {
  id: string;
  full_name: string;
  role: UserRole;
};

export type ContractTemplate = {
  id: string;
  name: string;
  employment_type: EmploymentType;
  version: string;
  annature_template_id: string;
  archived: boolean;
  created_at: string;
};

export type NewContractTemplate = Omit<ContractTemplate, "id" | "archived" | "created_at">;

export type EmploymentBundleTemplate = {
  id: string;
  name: string;
  employment_type: EmploymentType;
  version: string;
  annature_template_id: string;
  archived: boolean;
  created_at: string;
};

export type NewEmploymentBundleTemplate = Omit<EmploymentBundleTemplate, "id" | "archived" | "created_at">;

export type OnboardingRecord = {
  id: string;
  created_by: string | null;
  staff_name: string;
  onboarding_officer: string;
  date_onboarding_began: string | null;
  date_shift_began: string | null;

  // Recruitment
  job_application_status: OnboardingStatus;
  interview_status: OnboardingStatus;
  reference_checks_status: OnboardingStatus;

  // Recruitment legacy
  cv_status: OnboardingStatus;

  // Documentation
  position_description_status: OnboardingStatus;
  employment_contract_status: OnboardingStatus;
  code_of_conduct_status: OnboardingStatus;
  employee_details_form_status: OnboardingStatus;
  conflict_of_interest_status: OnboardingStatus;

  // Compliance
  ndiswsc_status: OnboardingStatus;
  identity_right_to_work_status: OnboardingStatus;
  wwcc_status: OnboardingStatus;
  ndis_orientation_status: OnboardingStatus;
  qualifications_status: OnboardingStatus;
  first_aid_cpr_status: OnboardingStatus;
  car_insurance_status: OnboardingStatus;

  // Training & Induction
  training_status: OnboardingStatus;
  orientation_induction_status: OnboardingStatus;

  // Training legacy
  training_needs_status: OnboardingStatus;

  // Admin legacy
  uniforms_status: OnboardingStatus;

  // Archive
  archived_at: string | null;
  archived_by: string | null;

  // Phase 2 metadata
  employment_bundle_id: string | null;
  xero_employee_id: string | null;

  // Phase 2 storage paths (single-file uploads)
  identity_right_to_work_storage_path: string | null;
  ndis_orientation_storage_path: string | null;
  car_insurance_storage_path: string | null;
  wwcc_storage_path: string | null;
  ndiswsc_storage_path: string | null;

  // Phase 2 Annature envelope IDs
  bundle_a_envelope_id: string | null;
  tna_envelope_id: string | null;

  // Phase 2: TNA status
  tna_status: OnboardingStatus;

  // Overhaul: employment bundle send
  flexible_working_opted_in: boolean;
  signing_url: string | null;
  fwa_envelope_id: string | null;
  fwa_signing_url: string | null;
  flexible_working_status: OnboardingStatus;
  policies_status: OnboardingStatus;
  additional_training_status: OnboardingStatus;
  additional_training_storage_path: string | null;

  // Original compliance field (migration)
  screening_checks_status: OnboardingStatus;

  // Timestamps
  created_at: string;
  updated_at: string;
};

export type OnboardingToken = {
  id: string;
  record_id: string;
  staff_email: string;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
};

export type OnboardingRecordWithOfficer = OnboardingRecord & {
  officer_profile: Pick<Profile, "id" | "full_name"> | null;
};

export type OnboardingDocument = {
  id: string;
  record_id: string;
  document_type: string;
  filename: string | null;
  storage_path: string;
  created_at: string;
};

export type StaffDetail = {
  id: string;
  record_id: string;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  personal_email: string | null;
  phone: string | null;
  emergency_contact_name: string | null;
  emergency_contact_relationship: string | null;
  emergency_contact_phone: string | null;
  right_to_work: string | null;
  visa_type: string | null;
  visa_expiry_date: string | null;
  created_at: string;
  updated_at: string;
};

// Supabase Database type (minimal — replace with codegen output once project is linked)
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "id"> & { id: string };
        Update: Partial<Profile>;
        Relationships: [];
      };
      onboarding_records: {
        Row: OnboardingRecord;
        Insert: Omit<OnboardingRecord, "id" | "created_at" | "updated_at"> & {
          id?: string;
        };
        Update: Partial<
          Omit<OnboardingRecord, "id" | "created_at" | "updated_at">
        >;
        Relationships: [];
      };
      onboarding_tokens: {
        Row: OnboardingToken;
        Insert: Omit<OnboardingToken, "created_at">;
        Update: Partial<Omit<OnboardingToken, "id" | "created_at">>;
        Relationships: [];
      };
      staff_details: {
        Row: StaffDetail;
        Insert: Omit<StaffDetail, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<StaffDetail, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      onboarding_documents: {
        Row: OnboardingDocument;
        Insert: Omit<OnboardingDocument, "id" | "created_at">;
        Update: Partial<Omit<OnboardingDocument, "id" | "created_at">>;
        Relationships: [];
      };
      employment_bundle_templates: {
        Row: EmploymentBundleTemplate;
        Insert: Omit<EmploymentBundleTemplate, "id" | "archived" | "created_at">;
        Update: Partial<EmploymentBundleTemplate>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      onboarding_status: OnboardingStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
