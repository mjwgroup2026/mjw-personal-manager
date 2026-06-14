import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

function getUsername(session: Awaited<ReturnType<typeof getServerSession>>): string | null {
  if (!session) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (session as any).user?.username ?? null;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const username = getUsername(session);
  if (!username) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const key = req.nextUrl.searchParams.get("key");
  if (!key) return NextResponse.json({ error: "Missing key" }, { status: 400 });

  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ value: null, source: "no-db" });

  const { data, error } = await db
    .from("mjw_user_data")
    .select("data_value")
    .eq("username", username)
    .eq("data_key", key)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ value: data?.data_value ?? null });
}

// POST is used by navigator.sendBeacon on page unload (same logic as PUT)
export async function POST(req: NextRequest) {
  return PUT(req);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const username = getUsername(session);
  if (!username) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const key = req.nextUrl.searchParams.get("key");
  if (!key) return NextResponse.json({ error: "Missing key" }, { status: 400 });

  const { value } = await req.json();

  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: true, source: "no-db" });

  const { error } = await db.from("mjw_user_data").upsert(
    { username, data_key: key, data_value: value, updated_at: new Date().toISOString() },
    { onConflict: "username,data_key" }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
