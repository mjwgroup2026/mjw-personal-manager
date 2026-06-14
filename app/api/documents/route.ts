import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

const BUCKET = "mjw-documents";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getUsername(session: any): string | null {
  return session?.user?.username ?? null;
}

function validatePath(path: string, username: string): boolean {
  // Security: ensure the path belongs to this user
  return path.startsWith(`${username}/`) && !path.includes("..") && !path.includes("//");
}

// GET — generate a short-lived signed download URL
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const username = getUsername(session);
  if (!username) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: "Storage not configured" }, { status: 503 });

  const path = req.nextUrl.searchParams.get("path");
  if (!path) return NextResponse.json({ error: "Missing path" }, { status: 400 });
  if (!validatePath(path, username)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await db.storage.from(BUCKET).createSignedUrl(path, 3600);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ url: data.signedUrl });
}

// DELETE — permanently remove a file from storage
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const username = getUsername(session);
  if (!username) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: "Storage not configured" }, { status: 503 });

  const path = req.nextUrl.searchParams.get("path");
  if (!path) return NextResponse.json({ error: "Missing path" }, { status: 400 });
  if (!validatePath(path, username)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { error } = await db.storage.from(BUCKET).remove([path]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
