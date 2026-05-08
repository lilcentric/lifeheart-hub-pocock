export type EmploymentType = "permanent" | "casual";

export interface ContractTemplate {
  id: string;
  name: string;
  employment_type: EmploymentType;
  version: string;
  template_id: string;
  archived: boolean;
  created_at: string;
}

export type NewContractTemplate = Omit<ContractTemplate, "id" | "archived" | "created_at">;

export type OnboardingStatus =
  | "completed"
  | "not_completed"
  | "not_received"
  | "not_signed"
  | "in_progress"
  | "pending_verification"
  | "na";

export type UserRole = "admin" | "officer" | "viewer";

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
}

export interface OnboardingRecord {
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
  screening_checks_status: OnboardingStatus;
  ndiswsc_status: OnboardingStatus;

  // Training & Induction
  training_status: OnboardingStatus;
  orientation_induction_status: OnboardingStatus;

  // Compliance & identity (Phase 2)
  identity_right_to_work_status: OnboardingStatus;
  wwcc_status: OnboardingStatus;
  ndiswsc_status: OnboardingStatus;
  ndis_orientation_status: OnboardingStatus;
  qualifications_status: OnboardingStatus;
  first_aid_cpr_status: OnboardingStatus;
  car_insurance_status: OnboardingStatus;

  // Training legacy
  training_needs_status: OnboardingStatus;

  // Admin legacy
  uniforms_status: OnboardingStatus;

  // Archive
  archived_at: string | null;
  archived_by: string | null;

  // Phase 2 metadata
  contract_template_id: string | null;
  xero_employee_id: string | null;

  created_at: string;
  updated_at: string;
}

export interface OnboardingToken {
  token: string;
  record_id: string;
  revoked_at: string | null;
  created_at: string;
}

export type OnboardingRecordWithOfficer = OnboardingRecord & {
  officer_profile: Pick<Profile, "id" | "full_name"> | null;
};

export interface OnboardingToken {
  id: string;
  record_id: string;
  staff_email: string;
  revoked_at: string | null;
  created_at: string;
}

export interface OnboardingDocument {
  id: string;
  record_id: string;
  document_type: string;
  storage_path: string;
  created_at: string;
}

export interface StaffDetail {
  id: string;
  record_id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  right_to_work: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContractTemplate {
  id: string;
  name: string;
  employment_type: string;
  version: string;
  annature_template_id: string;
  archived: boolean;
  created_at: string;
}

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
        Insert: Omit<OnboardingToken, "token" | "created_at"> & {
          token?: string;
        };
        Update: Partial<Omit<OnboardingToken, "token" | "created_at">>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      onboarding_status: OnboardingStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
