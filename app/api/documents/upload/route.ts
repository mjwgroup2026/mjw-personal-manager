import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

const BUCKET = "mjw-documents";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getUsername(session: any): string | null {
  return session?.user?.username ?? null;
}

async function ensureBucket(db: NonNullable<ReturnType<typeof getSupabaseAdmin>>) {
  const { data: buckets } = await db.storage.listBuckets();
  if (!buckets?.find((b) => b.name === BUCKET)) {
    await db.storage.createBucket(BUCKET, { public: false });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const username = getUsername(session);
  if (!username) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ error: "Storage not configured" }, { status: 503 });

  await ensureBucket(db);

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (file.size > 20 * 1024 * 1024) return NextResponse.json({ error: "File exceeds 20 MB limit" }, { status: 400 });

  const safeFilename = file.name.replace(/[^a-zA-Z0-9._\-() ]/g, "_");
  const storagePath = `${username}/${Date.now()}_${safeFilename}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await db.storage.from(BUCKET).upload(storagePath, buffer, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    storagePath,
    fileName: file.name,
    size: file.size,
    mimeType: file.type || "application/octet-stream",
  });
}
