"use client";

import { useEffect, useState } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import {
  getSession,
  setSession as persistSession,
  generateToken,
  clearSession,
} from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { getClientOrgs } from "@/lib/data";
import type { LobbySession } from "@/types";

export default function SessionGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const urlOrg = searchParams.get("org")?.toUpperCase() ?? "";
  const orgs = getClientOrgs();
  const isAdminRoute = pathname?.startsWith("/admin") ?? false;

  const [session, setSessionState] = useState<LobbySession | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const [name, setName] = useState("");
  const [org, setOrg] = useState(urlOrg);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSessionState(getSession());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (urlOrg && !org) setOrg(urlOrg);
  }, [urlOrg, org]);

  if (isAdminRoute) {
    return <>{children}</>;
  }

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center py-24 text-ca-dark/40">
        Loading...
      </div>
    );
  }

  if (session) {
    return (
      <>
        <SessionBadge session={session} onSignOut={() => {
          clearSession();
          setSessionState(null);
        }} />
        {children}
      </>
    );
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Please enter your name to continue.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const trimmedOrg = org.trim() || null;
      const today = new Date().toISOString().slice(0, 10);

      // Check for an existing session today matching name (+ org if provided).
      // This lets the same person sign in from multiple devices without
      // creating duplicate records.
      const { data: existingSessions } = await supabase
        .from("lobby_day_sessions")
        .select("*")
        .ilike("participant_name", trimmedName)
        .eq("lobby_date", today);

      const existing = (existingSessions || []).find((row) => {
        const rowOrg = (row.organization || "").toLowerCase();
        const myOrg = (trimmedOrg || "").toLowerCase();
        return rowOrg === myOrg;
      });

      let token: string;
      if (existing) {
        token = existing.session_token;
        // Touch last_active_at so the admin view knows this person came back.
        await supabase
          .from("lobby_day_sessions")
          .update({ last_active_at: new Date().toISOString() })
          .eq("session_token", token);
      } else {
        token = generateToken();
        const { error: insertError } = await supabase
          .from("lobby_day_sessions")
          .insert({
            session_token: token,
            participant_name: trimmedName,
            organization: trimmedOrg,
          });
        if (insertError) throw insertError;
      }

      const newSession: LobbySession = {
        session_token: token,
        participant_name: trimmedName,
        organization: trimmedOrg,
        lobby_date: today,
      };
      persistSession(newSession);
      setSessionState(newSession);
    } catch (err) {
      console.error(err);
      setError(
        "Something went wrong saving your sign-in. Check your connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-start justify-center pt-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-soft border border-ca-dark/10 overflow-hidden">
        <div className="bg-gradient-to-br from-ca-dark to-ca-blue text-white px-6 py-8 text-center">
          <div className="text-xs tracking-[0.2em] uppercase text-ca-gold font-semibold">
            Bear Flag Veterans
          </div>
          <h1 className="text-2xl font-bold mt-1">Lobby Day Companion</h1>
          <p className="text-sm text-white/80 mt-2">
            California State Capitol · Sign in to start your day
          </p>
        </div>

        <form onSubmit={handleSignIn} className="px-6 py-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-ca-dark mb-1">
              Your Name <span className="text-ca-red">*</span>
            </label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="First and last"
              className="w-full border border-ca-dark/20 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ca-blue focus:border-ca-blue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ca-dark mb-1">
              Organization <span className="text-ca-dark/40">(optional)</span>
            </label>
            <select
              value={org}
              onChange={(e) => setOrg(e.target.value)}
              className="w-full border border-ca-dark/20 rounded-lg px-4 py-3 text-base bg-white focus:outline-none focus:ring-2 focus:ring-ca-blue focus:border-ca-blue"
            >
              <option value="">— Select if you like —</option>
              {orgs.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.key} — {o.display_name.split(" - ")[0]}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="text-sm text-ca-red bg-ca-red/5 border border-ca-red/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-ca-dark hover:bg-ca-dark-hover disabled:bg-ca-dark/50 text-white font-semibold rounded-lg py-3 transition-colors"
          >
            {submitting ? "Signing in..." : "Enter the Capitol"}
          </button>

          <p className="text-xs text-ca-dark/50 text-center leading-relaxed pt-1">
            Your notes are saved as you type &mdash; no send button needed.
          </p>
        </form>
      </div>
    </div>
  );
}

function SessionBadge({
  session,
  onSignOut,
}: {
  session: LobbySession;
  onSignOut: () => void;
}) {
  return (
    <div className="bg-white border border-ca-dark/10 rounded-xl px-4 py-3 flex items-center justify-between mb-4 shadow-card">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-ca-blue to-ca-dark text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
          {session.participant_name
            .split(" ")
            .map((w) => w[0])
            .slice(0, 2)
            .join("")
            .toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-ca-dark truncate">
            {session.participant_name}
          </div>
          <div className="text-xs text-ca-dark/60 truncate">
            {session.organization || "Lobby day participant"} ·{" "}
            <span className="text-ca-blue font-medium">Notes auto-saving</span>
          </div>
        </div>
      </div>
      <button
        onClick={onSignOut}
        className="text-xs text-ca-dark/50 hover:text-ca-red transition-colors flex-shrink-0 ml-2"
      >
        Sign out
      </button>
    </div>
  );
}
