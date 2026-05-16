import { z } from "zod";

export const newEmploymentBundleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  employment_type: z.enum(["permanent", "casual"]),
  version: z.string().min(1, "Version is required"),
  annature_template_id: z.string().min(1, "Annature template ID is required"),
});
