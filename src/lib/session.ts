"use client";

import type { LobbySession } from "@/types";

const KEY = "lobby-day-session-v1";

export function getSession(): LobbySession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LobbySession;
    if (!parsed?.session_token || !parsed?.participant_name) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setSession(session: LobbySession) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(session));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}

export function generateToken(): string {
  const rand = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(rand, (b) => b.toString(16).padStart(2, "0")).join("");
}
