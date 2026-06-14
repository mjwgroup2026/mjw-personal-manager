import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";
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
  const username = getUsername(session);
  if (!username) return err("Unauthorized", 401);

  const { currentPassword, newPassword } = await req.json();
  if (!currentPassword || !newPassword) return err("All fields are required.");
  if (newPassword.length < 6) return err("New password must be at least 6 characters.");

  const db = getSupabaseAdmin();
  if (!db) return err("Not available — Supabase is not configured.", 503);

  const { data: user } = await db
    .from("mjw_users")
    .select("password_hash")
    .eq("username", username)
    .single();
  if (!user) return err("Password changes are only available for registered accounts. Env-var accounts must be updated via Vercel environment variables.");

  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) return err("Current password is incorrect.");

  const newHash = await bcrypt.hash(newPassword, 10);
  const { error: updateErr } = await db
    .from("mjw_users")
    .update({ password_hash: newHash })
    .eq("username", username);
  if (updateErr) return err(updateErr.message, 500);

  return NextResponse.json({ ok: true });
}
