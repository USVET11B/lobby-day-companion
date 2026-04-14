"use client";

import { useState, useEffect, useMemo, Suspense } from "react";

type Note = {
  id: string;
  session_token: string;
  participant_name: string;
  organization: string | null;
  legislator_id: string | null;
  legislator_name: string | null;
  legislator_chamber: string | null;
  legislator_district: number | null;
  planning_to_visit: boolean;
  visited: boolean;
  spoke_with_staff: boolean;
  left_materials: boolean;
  notes: string;
  lobby_date: string;
  created_at: string;
  updated_at: string;
};

type Session = {
  id: string;
  session_token: string;
  participant_name: string;
  organization: string | null;
  lobby_date: string;
  created_at: string;
  last_active_at: string;
};

type AdminData = {
  sessions: Session[];
  notes: Note[];
};

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="text-ca-dark/40">Loading admin…</div>}>
      <AdminContent />
    </Suspense>
  );
}

function AdminContent() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [data, setData] = useState<AdminData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterDate, setFilterDate] = useState<string>("");
  const [filterOrg, setFilterOrg] = useState<string>("");
  const [filterParticipant, setFilterParticipant] = useState<string>("");
  const [showEmptyNotes, setShowEmptyNotes] = useState(false);
  const [view, setView] = useState<"byParticipant" | "byLegislator">("byParticipant");

  useEffect(() => {
    const saved = sessionStorage.getItem("lobby-admin-pw");
    if (saved) {
      setPassword(saved);
      fetchData(saved);
    }
  }, []);

  async function fetchData(pw: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/notes", {
        headers: { Authorization: `Bearer ${pw}` },
      });
      if (res.status === 401) {
        setError("Wrong password.");
        setAuthed(false);
        sessionStorage.removeItem("lobby-admin-pw");
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || `Error ${res.status}`);
        return;
      }
      const json = (await res.json()) as AdminData;
      setData(json);
      setAuthed(true);
      sessionStorage.setItem("lobby-admin-pw", pw);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!password) return;
    await fetchData(password);
  }

  const organizations = useMemo(() => {
    if (!data) return [] as string[];
    const set = new Set<string>();
    data.notes.forEach((n) => n.organization && set.add(n.organization));
    return Array.from(set).sort();
  }, [data]);

  const dates = useMemo(() => {
    if (!data) return [] as string[];
    const set = new Set<string>();
    data.notes.forEach((n) => set.add(n.lobby_date));
    return Array.from(set).sort().reverse();
  }, [data]);

  const filteredNotes = useMemo(() => {
    if (!data) return [];
    return data.notes.filter((n) => {
      if (filterDate && n.lobby_date !== filterDate) return false;
      if (filterOrg && n.organization !== filterOrg) return false;
      if (
        filterParticipant &&
        !n.participant_name.toLowerCase().includes(filterParticipant.toLowerCase())
      )
        return false;
      if (!showEmptyNotes) {
        const hasContent =
          n.notes.trim().length > 0 ||
          n.planning_to_visit ||
          n.visited ||
          n.spoke_with_staff ||
          n.left_materials;
        if (!hasContent) return false;
      }
      return true;
    });
  }, [data, filterDate, filterOrg, filterParticipant, showEmptyNotes]);

  // Group by legislator for coordination view. Dedupe participants by
  // normalized name+org so multi-device sessions collapse.
  const groupedByLegislator = useMemo(() => {
    const groups = new Map<string, Note[]>();
    for (const n of filteredNotes) {
      if (!n.legislator_id) continue;
      if (!groups.has(n.legislator_id)) groups.set(n.legislator_id, []);
      groups.get(n.legislator_id)!.push(n);
    }
    return Array.from(groups.entries())
      .map(([legId, notes]) => {
        const first = notes[0];

        // Collapse to one row per unique participant, OR-ing the flags.
        const byParticipant = new Map<string, Note>();
        for (const n of notes) {
          const key = participantKey(n);
          const existing = byParticipant.get(key);
          if (!existing) {
            byParticipant.set(key, { ...n });
          } else {
            byParticipant.set(key, {
              ...existing,
              planning_to_visit:
                existing.planning_to_visit || n.planning_to_visit,
              visited: existing.visited || n.visited,
              spoke_with_staff:
                existing.spoke_with_staff || n.spoke_with_staff,
              left_materials: existing.left_materials || n.left_materials,
            });
          }
        }
        const uniqueParticipants = Array.from(byParticipant.values());
        const planners = uniqueParticipants.filter((n) => n.planning_to_visit);
        const visitors = uniqueParticipants.filter((n) => n.visited);
        return {
          legislator_id: legId,
          legislator_name: first.legislator_name || "Unknown",
          legislator_chamber: first.legislator_chamber || "",
          legislator_district: first.legislator_district,
          notes: uniqueParticipants,
          planners,
          visitors,
        };
      })
      .filter((g) => g.planners.length > 0 || g.visitors.length > 0)
      .sort((a, b) => {
        if (b.planners.length !== a.planners.length)
          return b.planners.length - a.planners.length;
        return a.legislator_name.localeCompare(b.legislator_name);
      });
  }, [filteredNotes]);

  // Normalize name + org so the same person across devices collapses into one.
  function participantKey(n: { participant_name: string; organization: string | null }) {
    return `${n.participant_name.trim().toLowerCase()}|${(n.organization || "").trim().toLowerCase()}`;
  }

  // Merge notes for the same (participant, legislator) across multiple sessions
  // — keep the most recently updated record, OR-ing the boolean flags.
  function mergeNotesByLegislator(notes: Note[]): Note[] {
    const byLeg = new Map<string, Note>();
    for (const n of notes) {
      if (!n.legislator_id) continue;
      const existing = byLeg.get(n.legislator_id);
      if (!existing) {
        byLeg.set(n.legislator_id, { ...n });
        continue;
      }
      const merged: Note = {
        ...existing,
        planning_to_visit: existing.planning_to_visit || n.planning_to_visit,
        visited: existing.visited || n.visited,
        spoke_with_staff: existing.spoke_with_staff || n.spoke_with_staff,
        left_materials: existing.left_materials || n.left_materials,
        // Prefer the non-empty, more recent note text
        notes:
          (n.notes?.trim().length ?? 0) > 0 &&
          new Date(n.updated_at) > new Date(existing.updated_at)
            ? n.notes
            : existing.notes?.trim().length
            ? existing.notes
            : n.notes,
        updated_at:
          new Date(n.updated_at) > new Date(existing.updated_at)
            ? n.updated_at
            : existing.updated_at,
      };
      byLeg.set(n.legislator_id, merged);
    }
    return Array.from(byLeg.values());
  }

  const groupedByParticipant = useMemo(() => {
    const groups = new Map<string, Note[]>();
    for (const n of filteredNotes) {
      const key = participantKey(n);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(n);
    }
    return Array.from(groups.entries()).map(([key, notes]) => {
      const first = notes[0];
      const merged = mergeNotesByLegislator(notes).sort((a, b) =>
        (a.legislator_name || "").localeCompare(b.legislator_name || "")
      );
      return {
        token: key,
        participant_name: first.participant_name,
        organization: first.organization,
        lobby_date: first.lobby_date,
        notes: merged,
      };
    });
  }, [filteredNotes]);

  function exportCsv() {
    if (!data) return;
    // Export deduped rows — one per (participant, legislator).
    const byKey = new Map<string, Note>();
    for (const n of filteredNotes) {
      if (!n.legislator_id) continue;
      const key = `${participantKey(n)}|${n.legislator_id}`;
      const existing = byKey.get(key);
      if (!existing) {
        byKey.set(key, { ...n });
      } else {
        byKey.set(key, {
          ...existing,
          planning_to_visit:
            existing.planning_to_visit || n.planning_to_visit,
          visited: existing.visited || n.visited,
          spoke_with_staff: existing.spoke_with_staff || n.spoke_with_staff,
          left_materials: existing.left_materials || n.left_materials,
          notes:
            (n.notes?.trim().length ?? 0) > 0 &&
            new Date(n.updated_at) > new Date(existing.updated_at)
              ? n.notes
              : existing.notes?.trim().length
              ? existing.notes
              : n.notes,
          updated_at:
            new Date(n.updated_at) > new Date(existing.updated_at)
              ? n.updated_at
              : existing.updated_at,
        });
      }
    }
    const dedupedNotes = Array.from(byKey.values());
    const rows = [
      [
        "date",
        "participant",
        "organization",
        "legislator",
        "chamber",
        "district",
        "planning_to_visit",
        "visited",
        "spoke_with_staff",
        "left_materials",
        "notes",
        "updated_at",
      ],
      ...dedupedNotes.map((n) => [
        n.lobby_date,
        n.participant_name,
        n.organization || "",
        n.legislator_name || "",
        n.legislator_chamber || "",
        n.legislator_district?.toString() || "",
        n.planning_to_visit ? "yes" : "",
        n.visited ? "yes" : "",
        n.spoke_with_staff ? "yes" : "",
        n.left_materials ? "yes" : "",
        (n.notes || "").replace(/\n/g, " "),
        n.updated_at,
      ]),
    ];
    const csv = rows
      .map((row) =>
        row
          .map((cell) => {
            const s = String(cell ?? "");
            return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
          })
          .join(",")
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lobby-day-notes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!authed) {
    return (
      <div className="max-w-sm mx-auto bg-white border border-ca-dark/10 rounded-2xl shadow-soft p-6 mt-8">
        <h1 className="text-xl font-bold text-ca-dark mb-1">Admin Access</h1>
        <p className="text-sm text-ca-dark/60 mb-4">
          Lobby Day notes dashboard — password required.
        </p>
        <form onSubmit={handleLogin} className="space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            className="w-full border border-ca-dark/20 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ca-blue"
          />
          {error && <div className="text-sm text-ca-red">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ca-dark text-white rounded-lg py-3 font-semibold hover:bg-ca-dark-hover disabled:bg-ca-dark/50"
          >
            {loading ? "Checking..." : "Unlock"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ca-dark">Lobby Day Dashboard</h1>
          <p className="text-sm text-ca-dark/60">
            {data?.notes.length ?? 0} total notes · {data?.sessions.length ?? 0} sessions
          </p>
        </div>
        <button
          onClick={exportCsv}
          className="bg-ca-gold text-ca-dark font-semibold rounded-lg px-4 py-2 text-sm hover:bg-ca-gold-hover transition-colors"
        >
          Export CSV
        </button>
      </div>

      {/* View toggle */}
      <div className="flex gap-2 bg-white border border-ca-dark/10 rounded-xl p-1 shadow-card">
        <button
          onClick={() => setView("byParticipant")}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            view === "byParticipant"
              ? "bg-ca-dark text-white"
              : "text-ca-dark/60 hover:text-ca-dark"
          }`}
        >
          By Participant
        </button>
        <button
          onClick={() => setView("byLegislator")}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            view === "byLegislator"
              ? "bg-ca-dark text-white"
              : "text-ca-dark/60 hover:text-ca-dark"
          }`}
        >
          Coordination Map (By Office)
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-ca-dark/10 rounded-xl p-4 shadow-card space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-semibold text-ca-dark/70 uppercase tracking-wide">
              Date
            </label>
            <select
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full mt-1 border border-ca-dark/20 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="">All dates</option>
              {dates.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-ca-dark/70 uppercase tracking-wide">
              Organization
            </label>
            <select
              value={filterOrg}
              onChange={(e) => setFilterOrg(e.target.value)}
              className="w-full mt-1 border border-ca-dark/20 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="">All orgs</option>
              {organizations.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-ca-dark/70 uppercase tracking-wide">
              Participant
            </label>
            <input
              type="text"
              value={filterParticipant}
              onChange={(e) => setFilterParticipant(e.target.value)}
              placeholder="Search name..."
              className="w-full mt-1 border border-ca-dark/20 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-ca-dark/70">
          <input
            type="checkbox"
            checked={showEmptyNotes}
            onChange={(e) => setShowEmptyNotes(e.target.checked)}
            className="w-4 h-4 rounded"
          />
          Show empty / no-action records
        </label>
      </div>

      {/* By-legislator coordination view */}
      {view === "byLegislator" && (
        <div className="space-y-3">
          {groupedByLegislator.length === 0 && (
            <div className="text-center py-12 bg-white border border-ca-dark/10 rounded-xl text-ca-dark/50">
              No one has marked any offices yet.
            </div>
          )}
          {groupedByLegislator.map((g) => (
            <div
              key={g.legislator_id}
              className="bg-white border border-ca-dark/10 rounded-xl shadow-card overflow-hidden"
            >
              <div className="px-4 py-3 bg-ca-cream border-b border-ca-dark/5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-ca-dark">{g.legislator_name}</div>
                  <div className="text-xs text-ca-dark/60">
                    {g.legislator_chamber} D-{g.legislator_district}
                  </div>
                </div>
                <div className="flex gap-2">
                  {g.planners.length > 0 && (
                    <span className="bg-ca-gold/20 text-ca-dark text-xs font-bold px-3 py-1 rounded-full">
                      {g.planners.length} planning
                    </span>
                  )}
                  {g.visitors.length > 0 && (
                    <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
                      {g.visitors.length} visited
                    </span>
                  )}
                </div>
              </div>
              <div className="divide-y divide-ca-dark/5">
                {g.planners.map((n) => (
                  <div
                    key={n.id}
                    className="px-4 py-2 flex items-center justify-between"
                  >
                    <div className="text-sm">
                      <span className="font-semibold text-ca-dark">
                        {n.participant_name}
                      </span>
                      {n.organization && (
                        <span className="text-ca-dark/60 ml-2">
                          · {n.organization}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1 flex-wrap justify-end">
                      {n.visited ? (
                        <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase">
                          Visited
                        </span>
                      ) : (
                        <span className="text-[10px] bg-ca-gold/20 text-ca-dark px-2 py-0.5 rounded-full font-bold uppercase">
                          Planning
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {g.visitors
                  .filter((n) => !n.planning_to_visit)
                  .map((n) => (
                    <div
                      key={n.id}
                      className="px-4 py-2 flex items-center justify-between"
                    >
                      <div className="text-sm">
                        <span className="font-semibold text-ca-dark">
                          {n.participant_name}
                        </span>
                        {n.organization && (
                          <span className="text-ca-dark/60 ml-2">
                            · {n.organization}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase">
                        Walked in
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* By-participant view */}
      {view === "byParticipant" && (
      <div className="space-y-4">
        {groupedByParticipant.length === 0 && (
          <div className="text-center py-12 bg-white border border-ca-dark/10 rounded-xl text-ca-dark/50">
            No notes match the current filters.
          </div>
        )}
        {groupedByParticipant.map((group) => (
          <div
            key={group.token}
            className="bg-white border border-ca-dark/10 rounded-2xl shadow-card overflow-hidden"
          >
            <div className="bg-gradient-to-r from-ca-dark to-ca-blue text-white px-4 py-3">
              <div className="font-bold">{group.participant_name}</div>
              <div className="text-xs text-white/70">
                {group.organization || "No org"} · {group.lobby_date} · {group.notes.length} notes
              </div>
            </div>
            <div className="divide-y divide-ca-dark/5">
              {group.notes.map((n) => (
                <div key={n.id} className="px-4 py-3">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-ca-dark">
                      {n.legislator_name || "Unknown legislator"}
                    </span>
                    <span className="text-xs text-ca-dark/50">
                      {n.legislator_chamber} D-{n.legislator_district}
                    </span>
                    {n.planning_to_visit && !n.visited && (
                      <span className="text-[10px] bg-ca-gold/20 text-ca-dark px-2 py-0.5 rounded-full font-bold uppercase">
                        Planning
                      </span>
                    )}
                    {n.visited && (
                      <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase">
                        Visited
                      </span>
                    )}
                    {n.spoke_with_staff && (
                      <span className="text-[10px] bg-ca-blue/10 text-ca-blue px-2 py-0.5 rounded-full font-bold uppercase">
                        Staff
                      </span>
                    )}
                    {n.left_materials && (
                      <span className="text-[10px] bg-ca-gold/20 text-ca-dark px-2 py-0.5 rounded-full font-bold uppercase">
                        Materials
                      </span>
                    )}
                  </div>
                  {n.notes && (
                    <div className="text-sm text-ca-dark/80 whitespace-pre-wrap">
                      {n.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}
