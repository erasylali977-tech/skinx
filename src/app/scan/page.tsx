import { createClient } from "@/lib/supabase/server";
import { ScanClient } from "./ScanClient";

export default async function ScanPage() {
  let gender: "male" | "female" = "male";
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("sex")
        .eq("id", user.id)
        .single();
      if (profile?.sex === "Female") gender = "female";
    }
  } catch {
    // fallback to male on any error
  }
  return <ScanClient gender={gender} />;
}
