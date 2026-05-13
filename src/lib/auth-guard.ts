import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export type AuthedContext = {
  userId: string;
  role: Profile["role"];
};

export async function withRole<T>(
  minRole: "officer" | "admin",
  fn: (ctx: AuthedContext) => Promise<T>
): Promise<T | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorised" };

  const { data: rawProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const profile = rawProfile as Pick<Profile, "role"> | null;
  if (!profile) return { error: "Unauthorised" };

  if (minRole === "admin" && profile.role !== "admin") return { error: "Unauthorised" };
  if (minRole === "officer" && !["admin", "officer"].includes(profile.role))
    return { error: "Unauthorised" };

  return fn({ userId: user.id, role: profile.role });
}
