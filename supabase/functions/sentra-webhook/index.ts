import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SENTRA_ENDPOINT =
  "https://jamkzojjefippbbfbdqe.supabase.co/functions/v1/webhook-receiver";

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
    const payload = await req.json();

    const res = await fetch(SENTRA_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-platform-id": "ledgera",
        "x-api-key": SENTRA_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.text();
    return new Response(data, {
      status: res.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
