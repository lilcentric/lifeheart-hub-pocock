"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { resolveStaffToken } from "@/lib/token-service";

export interface StaffDetailsInput {
  full_name: string;
  preferred_name?: string;
  personal_email?: string;
  phone?: string;
  emergency_contact_name?: string;
  emergency_contact_relationship?: string;
  emergency_contact_phone?: string;
  citizenship_status: string;
  visa_type?: string;
  visa_expiry_date?: string;
}

type ActionResult = { success: true } | { error: string };

export async function submitStaffDetails(
  token: string,
  input: StaffDetailsInput
): Promise<ActionResult> {
  const supabase = createServiceClient();

  const record = await resolveStaffToken(token);
  if (!record) return { error: "Invalid or expired link" };

  const nameParts = input.full_name.trim().split(/\s+/);
  const first_name = nameParts[0];
  const last_name = nameParts.slice(1).join(" ") || "";

  const { error: upsertError } = await supabase
    .from("staff_details")
    .upsert(
      {
        record_id: record.id,
        first_name,
        last_name,
        preferred_name: input.preferred_name ?? null,
        personal_email: input.personal_email ?? null,
        phone: input.phone ?? null,
        emergency_contact_name: input.emergency_contact_name ?? null,
        emergency_contact_relationship: input.emergency_contact_relationship ?? null,
        emergency_contact_phone: input.emergency_contact_phone ?? null,
        right_to_work: input.citizenship_status,
        visa_type: input.visa_type ?? null,
        visa_expiry_date: input.visa_expiry_date ?? null,
      },
      { onConflict: "record_id" }
    );

  if (upsertError) return { error: (upsertError as { message: string }).message };

  const { error: updateError } = await supabase
    .from("onboarding_records")
    .update({ employee_details_form_status: "completed" })
    .eq("id", record.id);

  if (updateError) return { error: (updateError as { message: string }).message };

  return { success: true };
}
