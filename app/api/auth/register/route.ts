import { getSupabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

function err(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

export async function POST(req: NextRequest) {
  const { username, password, name } = await req.json();

  if (!username || !password || !name) return err("All fields are required.");
  const uname = username.toLowerCase().trim();
  if (uname.length < 3) return err("Username must be at least 3 characters.");
  if (!/^[a-z0-9_-]+$/.test(uname)) return err("Username can only contain letters, numbers, - and _.");
  if (password.length < 6) return err("Password must be at least 6 characters.");
  if (name.trim().length < 1) return err("Name is required.");

  const db = getSupabaseAdmin();
  if (!db) return err("Registration is not available — Supabase is not configured.", 503);

  // Check username not already taken
  const { data: existing } = await db
    .from("mjw_users")
    .select("username")
    .eq("username", uname)
    .single();
  if (existing) return err("That username is already taken. Please choose another.");

  const hash = await bcrypt.hash(password, 10);
  const { error: insertErr } = await db.from("mjw_users").insert({
    username: uname,
    password_hash: hash,
    display_name: name.trim(),
  });

  if (insertErr) return err(insertErr.message, 500);
  return NextResponse.json({ ok: true });
}
