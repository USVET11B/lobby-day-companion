import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const adminPassword = process.env.LOBBY_ADMIN_PASSWORD;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://uwmbqudhfqvfgqrpmpxj.supabase.co";

  if (!adminPassword || !serviceKey) {
    return NextResponse.json(
      { error: "Admin not configured. Missing env vars." },
      { status: 500 }
    );
  }

  const auth = req.headers.get("authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (token !== adminPassword) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  };

  const dateParam = req.nextUrl.searchParams.get("date");

  const notesUrl = new URL(`${supabaseUrl}/rest/v1/lobby_day_notes`);
  notesUrl.searchParams.set("select", "*");
  notesUrl.searchParams.set("order", "updated_at.desc");
  if (dateParam) notesUrl.searchParams.set("lobby_date", `eq.${dateParam}`);

  const sessionsUrl = new URL(`${supabaseUrl}/rest/v1/lobby_day_sessions`);
  sessionsUrl.searchParams.set("select", "*");
  sessionsUrl.searchParams.set("order", "created_at.desc");

  const [notesRes, sessionsRes] = await Promise.all([
    fetch(notesUrl.toString(), { headers, cache: "no-store" }),
    fetch(sessionsUrl.toString(), { headers, cache: "no-store" }),
  ]);

  if (!notesRes.ok || !sessionsRes.ok) {
    const notesErr = notesRes.ok ? null : await notesRes.text();
    const sessionsErr = sessionsRes.ok ? null : await sessionsRes.text();
    return NextResponse.json(
      {
        error: "Supabase fetch failed",
        notesStatus: notesRes.status,
        sessionsStatus: sessionsRes.status,
        notesErr,
        sessionsErr,
      },
      { status: 500 }
    );
  }

  const notes = await notesRes.json();
  const sessions = await sessionsRes.json();

  return NextResponse.json({ sessions, notes });
}
