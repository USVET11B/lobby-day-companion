"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { getLegislators, getFloor, getAvailableFloors, sortLegislators, getBuildingShort, type SortMode } from "@/lib/data";
import SortFloorBar from "@/components/SortFloorBar";
import { getSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import type { Legislator, LobbySession } from "@/types";

type NoteRecord = {
  legislator_id: string;
  planning_to_visit: boolean;
  visited: boolean;
  spoke_with_staff: boolean;
  left_materials: boolean;
  notes: string;
  saveState: "idle" | "saving" | "saved" | "error";
};

export default function ChecklistPage() {
  const [session, setSession] = useState<LobbySession | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [notes, setNotes] = useState<Record<string, NoteRecord>>({});
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "planned" | "visited" | "unvisited">("all");
  const [floorFilter, setFloorFilter] = useState<number | "all">("all");
  const [sortMode, setSortMode] = useState<SortMode>("default");

  const allLegislators = useMemo(() => getLegislators(), []);
  const availableFloors = useMemo(() => getAvailableFloors(), []);
  const legislatorsById = useMemo(() => {
    const m = new Map<string, Legislator>();
    for (const l of allLegislators) m.set(l.id, l);
    return m;
  }, [allLegislators]);

  useEffect(() => {
    setSession(getSession());
    setHydrated(true);
  }, []);

  // Load existing notes for this session on mount
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("lobby_day_notes")
        .select("*")
        .eq("session_token", session.session_token);
      if (cancelled || error || !data) return;
      const loaded: Record<string, NoteRecord> = {};
      for (const row of data) {
        if (!row.legislator_id) continue;
        loaded[row.legislator_id] = {
          legislator_id: row.legislator_id,
          planning_to_visit: !!row.planning_to_visit,
          visited: !!row.visited,
          spoke_with_staff: !!row.spoke_with_staff,
          left_materials: !!row.left_materials,
          notes: row.notes || "",
          saveState: "saved",
        };
      }
      setNotes(loaded);
    })();
    return () => {
      cancelled = true;
    };
  }, [session]);

  // Debounced save queue
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const flushSave = useCallback(
    async (legId: string) => {
      if (!session) return;
      const record = notes[legId];
      if (!record) return;
      const leg = legislatorsById.get(legId);
      if (!leg) return;

      setNotes((prev) => ({
        ...prev,
        [legId]: { ...prev[legId], saveState: "saving" },
      }));

      const payload = {
        session_token: session.session_token,
        participant_name: session.participant_name,
        organization: session.organization,
        legislator_id: leg.id,
        legislator_name: leg.name,
        legislator_chamber: leg.chamber,
        legislator_district: leg.district,
        planning_to_visit: record.planning_to_visit,
        visited: record.visited,
        spoke_with_staff: record.spoke_with_staff,
        left_materials: record.left_materials,
        notes: record.notes,
      };

      const { error } = await supabase
        .from("lobby_day_notes")
        .upsert(payload, { onConflict: "session_token,legislator_id" });

      setNotes((prev) => ({
        ...prev,
        [legId]: {
          ...prev[legId],
          saveState: error ? "error" : "saved",
        },
      }));
    },
    [session, notes, legislatorsById]
  );

  const queueSave = useCallback(
    (legId: string) => {
      if (saveTimers.current[legId]) {
        clearTimeout(saveTimers.current[legId]);
      }
      saveTimers.current[legId] = setTimeout(() => {
        flushSave(legId);
      }, 800);
    },
    [flushSave]
  );

  const updateField = useCallback(
    (legId: string, field: keyof NoteRecord, value: boolean | string) => {
      setNotes((prev) => {
        const existing = prev[legId] || {
          legislator_id: legId,
          planning_to_visit: false,
          visited: false,
          spoke_with_staff: false,
          left_materials: false,
          notes: "",
          saveState: "idle" as const,
        };
        return {
          ...prev,
          [legId]: { ...existing, [field]: value, saveState: "saving" },
        };
      });
      queueSave(legId);
    },
    [queueSave]
  );

  const filtered = useMemo(() => {
    const result = allLegislators.filter((leg) => {
      if (filter === "visited" && !notes[leg.id]?.visited) return false;
      if (filter === "unvisited" && notes[leg.id]?.visited) return false;
      if (filter === "planned" && !notes[leg.id]?.planning_to_visit) return false;
      if (floorFilter !== "all" && getFloor(leg.capitol_room) !== floorFilter)
        return false;
      if (search) {
        const q = search.toLowerCase();
        const matchName = leg.name.toLowerCase().includes(q);
        const matchDistrict = leg.district.toString() === q;
        const matchRoom = leg.capitol_room?.toLowerCase().includes(q);
        if (!matchName && !matchDistrict && !matchRoom) return false;
      }
      return true;
    });
    return sortLegislators(result, sortMode);
  }, [allLegislators, notes, search, filter, floorFilter, sortMode]);

  const visitedCount = useMemo(
    () => Object.values(notes).filter((n) => n.visited).length,
    [notes]
  );

  const plannedCount = useMemo(
    () => Object.values(notes).filter((n) => n.planning_to_visit).length,
    [notes]
  );

  const notesCount = useMemo(
    () => Object.values(notes).filter((n) => (n.notes || "").trim().length > 0).length,
    [notes]
  );

  if (!hydrated) return null;

  if (!session) {
    return (
      <div className="text-center py-12 text-ca-dark/60">
        Please sign in above to use the checklist.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-ca-dark">Visit Checklist</h1>
        <p className="text-sm text-ca-dark/60 mt-1">
          Tap a legislator to see capitol room + contact info. Your notes save
          automatically.
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-white border border-ca-dark/10 rounded-xl p-3 text-center shadow-card">
          <div className="text-xl font-bold text-ca-gold">{plannedCount}</div>
          <div className="text-[10px] text-ca-dark/60 uppercase tracking-wide">Planning</div>
        </div>
        <div className="bg-white border border-ca-dark/10 rounded-xl p-3 text-center shadow-card">
          <div className="text-xl font-bold text-ca-blue">{visitedCount}</div>
          <div className="text-[10px] text-ca-dark/60 uppercase tracking-wide">Visited</div>
        </div>
        <div className="bg-white border border-ca-dark/10 rounded-xl p-3 text-center shadow-card">
          <div className="text-xl font-bold text-ca-dark">{notesCount}</div>
          <div className="text-[10px] text-ca-dark/60 uppercase tracking-wide">Notes</div>
        </div>
        <div className="bg-white border border-ca-dark/10 rounded-xl p-3 text-center shadow-card">
          <div className="text-xl font-bold text-ca-dark">{allLegislators.length}</div>
          <div className="text-[10px] text-ca-dark/60 uppercase tracking-wide">Total</div>
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by name, district, or room number..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border border-ca-dark/20 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ca-blue focus:border-ca-blue bg-white"
      />

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["all", "planned", "visited", "unvisited"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              filter === f
                ? "bg-ca-dark text-white"
                : "bg-white border border-ca-dark/20 text-ca-dark/70 hover:border-ca-dark/40"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <SortFloorBar
        sortMode={sortMode}
        setSortMode={setSortMode}
        floorFilter={floorFilter}
        setFloorFilter={setFloorFilter}
        availableFloors={availableFloors}
      />

      {/* Items */}
      <div className="space-y-2">
        {filtered.map((leg) => (
          <ChecklistItem
            key={leg.id}
            legislator={leg}
            note={notes[leg.id]}
            onUpdate={updateField}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-ca-dark/40 bg-white rounded-xl border border-ca-dark/10">
          No legislators match your filters.
        </div>
      )}
    </div>
  );
}

function ChecklistItem({
  legislator: leg,
  note,
  onUpdate,
}: {
  legislator: Legislator;
  note?: NoteRecord;
  onUpdate: (id: string, field: keyof NoteRecord, value: boolean | string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isVisited = note?.visited || false;
  const isPlanning = note?.planning_to_visit || false;
  const hasNotes = (note?.notes || "").length > 0;
  const saveState = note?.saveState || "idle";

  return (
    <div
      className={`bg-white border rounded-xl overflow-hidden transition-shadow ${
        isVisited
          ? "border-green-400/60 shadow-card"
          : isPlanning
          ? "border-ca-gold/60 shadow-card"
          : expanded
          ? "border-ca-blue/40 shadow-card-hover"
          : "border-ca-dark/10 shadow-card"
      }`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-4 py-3 flex items-center gap-3"
      >
        <span
          className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-white text-sm font-bold flex-shrink-0 ${
            leg.party === "D" ? "bg-dem" : "bg-rep"
          }`}
        >
          {leg.party}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-ca-dark truncate">{leg.name}</span>
            {isVisited && (
              <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                Visited
              </span>
            )}
            {isPlanning && !isVisited && (
              <span className="text-[10px] bg-ca-gold/20 text-ca-dark px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                Planning
              </span>
            )}
            {hasNotes && !isVisited && !isPlanning && (
              <span className="text-[10px] bg-ca-blue/10 text-ca-blue px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                Notes
              </span>
            )}
          </div>
          <div className="text-sm text-ca-dark/60 flex items-center gap-2 flex-wrap">
            <span>
              {leg.chamber} D-{leg.district}
            </span>
            {leg.capitol_room && (
              <>
                <span className="text-ca-dark/30">·</span>
                <span className="font-semibold text-ca-blue">Room {leg.capitol_room}</span>
                {getBuildingShort(leg.capitol_building) && (
                  <span className="text-[10px] bg-ca-dark/5 text-ca-dark/70 px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide">
                    {getBuildingShort(leg.capitol_building)}
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        <svg
          className={`w-5 h-5 text-ca-dark/40 transition-transform flex-shrink-0 ${
            expanded ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-ca-dark/5 pt-3 space-y-3">
          {leg.capitol_building && (
            <div className="text-xs text-ca-dark/60">
              <span className="font-semibold text-ca-dark/80">Location:</span> {leg.capitol_building}
            </div>
          )}

          {/* Plan to visit — prominent pre-event action */}
          <button
            type="button"
            onClick={() => onUpdate(leg.id, "planning_to_visit", !isPlanning)}
            className={`w-full rounded-lg py-2.5 px-4 text-sm font-semibold border-2 transition-colors ${
              isPlanning
                ? "bg-ca-gold border-ca-gold text-ca-dark hover:bg-ca-gold-hover"
                : "bg-white border-ca-gold/50 text-ca-dark hover:bg-ca-gold/10"
            }`}
          >
            {isPlanning ? "✓ I'm planning to visit this office" : "I plan to visit this office"}
          </button>

          {/* Contact */}
          <div className="flex flex-wrap gap-2">
            {leg.capitol_phone && (
              <a
                href={`tel:${leg.capitol_phone.replace(/[^\d+]/g, "")}`}
                className="inline-flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 rounded-lg px-3 py-2 text-sm font-medium"
              >
                {leg.capitol_phone}
              </a>
            )}
            {leg.capitol_email && (
              <a
                href={`mailto:${leg.capitol_email}`}
                className="inline-flex items-center gap-2 bg-ca-blue/5 text-ca-blue border border-ca-blue/20 rounded-lg px-3 py-2 text-sm font-medium"
              >
                Email
              </a>
            )}
          </div>

          {/* Checkboxes */}
          <div className="grid grid-cols-3 gap-2">
            <CheckboxPill
              label="Visited"
              checked={note?.visited || false}
              onChange={(v) => onUpdate(leg.id, "visited", v)}
              color="green"
            />
            <CheckboxPill
              label="Spoke w/ Staff"
              checked={note?.spoke_with_staff || false}
              onChange={(v) => onUpdate(leg.id, "spoke_with_staff", v)}
              color="blue"
            />
            <CheckboxPill
              label="Left Materials"
              checked={note?.left_materials || false}
              onChange={(v) => onUpdate(leg.id, "left_materials", v)}
              color="gold"
            />
          </div>

          {/* Notes */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-ca-dark/70 uppercase tracking-wide">
                Notes
              </label>
              <SaveIndicator state={saveState} />
            </div>
            <textarea
              placeholder="What was said, who you met with, follow-ups needed, materials handed out... Voice-to-text works great here."
              value={note?.notes || ""}
              onChange={(e) => onUpdate(leg.id, "notes", e.target.value)}
              rows={4}
              className="w-full border border-ca-dark/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ca-blue focus:border-ca-blue resize-y"
            />
          </div>

          {/* Committees (compact) */}
          {leg.committees && leg.committees.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {leg.committees.slice(0, 6).map((c, i) => (
                <span
                  key={i}
                  className={`text-[10px] px-2 py-0.5 rounded-full ${
                    c.role === "Chair"
                      ? "bg-ca-blue text-white font-semibold"
                      : "bg-ca-dark/5 text-ca-dark/70"
                  }`}
                >
                  {c.committee}
                  {c.role === "Chair" ? " (Chair)" : ""}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CheckboxPill({
  label,
  checked,
  onChange,
  color,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  color: "green" | "blue" | "gold";
}) {
  const colorClass = checked
    ? color === "green"
      ? "bg-green-500 border-green-500 text-white"
      : color === "blue"
      ? "bg-ca-blue border-ca-blue text-white"
      : "bg-ca-gold border-ca-gold text-ca-dark"
    : "bg-white border-ca-dark/20 text-ca-dark/60 hover:border-ca-dark/40";

  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`px-2 py-2 rounded-lg text-xs font-semibold border transition-colors ${colorClass}`}
    >
      {checked ? "✓ " : ""}
      {label}
    </button>
  );
}

function SaveIndicator({ state }: { state: NoteRecord["saveState"] }) {
  if (state === "saving")
    return <span className="text-[10px] text-ca-dark/50">Saving…</span>;
  if (state === "saved")
    return <span className="text-[10px] text-green-600 font-medium">Saved</span>;
  if (state === "error")
    return <span className="text-[10px] text-ca-red font-medium">Retry on next edit</span>;
  return null;
}
