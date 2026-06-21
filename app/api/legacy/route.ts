import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const pin = new URL(req.url).searchParams.get("pin");
  if (!pin || pin.length < 4) {
    return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  const { data: rows, error } = await supabase
    .from("mjw_user_data")
    .select("username, data_value")
    .eq("data_key", "health");

  if (error || !rows) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  for (const row of rows) {
    try {
      const healthData = JSON.parse(row.data_value);
      if (healthData?.legacyAccess?.pin === pin) {
        const acc = healthData.legacyAccess;
        const granted: string[] = acc.grantedSections ?? [];

        // Also fetch medications for this user if granted
        let medications = undefined;
        if (granted.includes("medications")) {
          const { data: medRows } = await supabase
            .from("mjw_user_data")
            .select("data_value")
            .eq("username", row.username)
            .eq("data_key", "medications")
            .single();
          if (medRows) {
            try { medications = JSON.parse(medRows.data_value); } catch {}
          }
        }

        return NextResponse.json({
          granted,
          trustedName: acc.trustedName,
          message:     acc.message ?? "",
          profile:     granted.includes("emergency_card") ? healthData.profile    : undefined,
          medicalAid:  granted.includes("emergency_card") ? healthData.medicalAid : undefined,
          medications: granted.includes("medications")    ? medications            : undefined,
          policies:    granted.includes("policies")       ? healthData.policies    : undefined,
          wishes:      granted.includes("wishes")         ? healthData.wishes      : undefined,
        });
      }
    } catch {
      // bad JSON, skip
    }
  }

  return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
}
