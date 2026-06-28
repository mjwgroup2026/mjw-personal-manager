import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SENTRA_ENDPOINT =
  "https://jamkzojjefippbbfbdqe.supabase.co/functions/v1/redeem-code";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const SENTRA_API_KEY = Deno.env.get("SENTRA_API_KEY");
  if (!SENTRA_API_KEY) {
    return new Response(
      JSON.stringify({ error: "SENTRA_API_KEY is not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { code, user_id, platform } = await req.json();

    if (!code || !user_id) {
      return new Response(
        JSON.stringify({ error: "code and user_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate code against Sentra
    const sentraRes = await fetch(SENTRA_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-platform-id": "ledgera",
        "x-api-key": SENTRA_API_KEY,
      },
      body: JSON.stringify({
        code: code.trim().toUpperCase(),
        user_id,
        platform: platform || "ledgera",
      }),
    });

    const sentraData = await sentraRes.json();
    console.log("Sentra response:", JSON.stringify(sentraData));

    if (!sentraRes.ok || !sentraData.valid) {
      return new Response(
        JSON.stringify({ valid: false, error: sentraData.error || "Invalid or expired redeem code" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Code is valid — update subscription_status
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    // Support multiple possible field names from Sentra
    const durationDays = sentraData.duration_days || sentraData.extension_days || sentraData.days || 30;
    const plan = sentraData.plan || "starter";
    const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    // Upsert subscription
    const { error: upsertError } = await supabase
      .from("subscription_status")
      .upsert(
        {
          user_id,
          plan,
          status: "active",
          started_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          renewed_at: now.toISOString(),
          store_provider: "redeem_code",
          store_transaction_id: code.trim().toUpperCase(),
        },
        { onConflict: "user_id" }
      );

    if (upsertError) {
      return new Response(
        JSON.stringify({ valid: false, error: "Failed to activate subscription" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send webhook event
    const webhookEndpoint = `${supabaseUrl}/functions/v1/sentra-webhook`;
    await fetch(webhookEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseServiceKey}`,
        apikey: supabaseServiceKey,
      },
      body: JSON.stringify({
        platform: "ledgera",
        event: "SUBSCRIPTION_PURCHASED",
        user_id,
        timestamp: now.toISOString(),
        plan,
        amount: 0,
        metadata: { redeem_code: code.trim().toUpperCase(), duration_days: durationDays },
      }),
    }).catch(() => {});

    return new Response(
      JSON.stringify({
        valid: true,
        plan,
        duration_days: durationDays,
        expires_at: expiresAt.toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
