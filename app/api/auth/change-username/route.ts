import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

function err(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

function getUsername(session: Awaited<ReturnType<typeof getServerSession>>): string | null {
  if (!session) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (session as any).user?.username ?? null;
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const oldUsername = getUsername(session);
  if (!oldUsername) return err("Unauthorized", 401);

  const { newUsername } = await req.json();
  if (!newUsername) return err("New username is required.");
  const uname = newUsername.toLowerCase().trim();
  if (uname.length < 3) return err("Username must be at least 3 characters.");
  if (!/^[a-z0-9_-]+$/.test(uname)) return err("Username can only contain letters, numbers, - and _.");
  if (uname === oldUsername) return err("That is already your username.");

  const db = getSupabaseAdmin();
  if (!db) return err("Not available — Supabase is not configured.", 503);

  // Check not already taken
  const { data: existing } = await db
    .from("mjw_users")
    .select("username")
    .eq("username", uname)
    .single();
  if (existing) return err("That username is already taken.");

  // Check the current user exists in mjw_users (registered users only — env users can't change username here)
  const { data: currentUser } = await db
    .from("mjw_users")
    .select("username")
    .eq("username", oldUsername)
    .single();
  if (!currentUser) return err("Username changes are only available for registered accounts. Env-var accounts must be updated manually.");

  // Update username in mjw_users
  const { error: updateErr } = await db
    .from("mjw_users")
    .update({ username: uname })
    .eq("username", oldUsername);
  if (updateErr) return err(updateErr.message, 500);

  // Migrate all user data to new username
  await db.from("mjw_user_data").update({ username: uname }).eq("username", oldUsername);

  return NextResponse.json({ ok: true });
}
