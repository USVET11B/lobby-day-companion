"use client";

import { useState, useMemo } from "react";
import { getHearingRooms } from "@/lib/data";
import type { HearingRoom } from "@/types";
import OfficeLocation from "@/components/OfficeLocation";

type ChamberFilter = "All" | "Assembly" | "Senate";

export default function HearingsPage() {
  const rooms = useMemo(() => getHearingRooms(), []);
  const [chamberFilter, setChamberFilter] = useState<ChamberFilter>("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = rooms.filter(
    (r) => chamberFilter === "All" || r.chamber === chamberFilter
  );

  // Group by building + floor
  const grouped = useMemo(() => {
    const map = new Map<string, HearingRoom[]>();
    for (const r of filtered) {
      const key = `${r.building_short}|${r.floor}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return Array.from(map.entries())
      .map(([key, items]) => {
        const first = items[0];
        return {
          key,
          building: first.building,
          building_short: first.building_short,
          floor: first.floor,
          rooms: items.sort((a, b) => a.room.localeCompare(b.room)),
        };
      })
      .sort((a, b) => {
        if (a.building_short !== b.building_short)
          return a.building_short === "Swing" ? -1 : 1;
        return a.floor - b.floor;
      });
  }, [filtered]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-ca-dark">Hearing Rooms</h1>
        <p className="text-sm text-ca-dark/60 mt-1">
          Committee hearing rooms across the Swing Space and historic State
          Capitol. Useful if you&apos;re tracking a specific hearing on lobby day.
        </p>
      </div>

      <div className="flex gap-2">
        {(["All", "Assembly", "Senate"] as ChamberFilter[]).map((c) => (
          <button
            key={c}
            onClick={() => setChamberFilter(c)}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              chamberFilter === c
                ? "bg-ca-dark text-white"
                : "bg-white border border-ca-dark/20 text-ca-dark/70 hover:border-ca-dark/40"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {grouped.map((g) => (
          <div key={g.key} className="space-y-2">
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-bold text-ca-dark uppercase tracking-wide">
                {g.building_short === "Swing" ? "Swing Space" : "Historic State Capitol"}{" "}
                · Floor {g.floor}
              </h2>
              <span className="text-xs text-ca-dark/50">
                {g.rooms.length} {g.rooms.length === 1 ? "room" : "rooms"}
              </span>
            </div>
            <div className="space-y-2">
              {g.rooms.map((r) => (
                <HearingRoomCard
                  key={r.id}
                  room={r}
                  expanded={expandedId === r.id}
                  onToggle={() =>
                    setExpandedId(expandedId === r.id ? null : r.id)
                  }
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {grouped.length === 0 && (
        <div className="text-center py-12 text-ca-dark/40 bg-white rounded-xl border border-ca-dark/10">
          No hearing rooms match.
        </div>
      )}
    </div>
  );
}

function HearingRoomCard({
  room,
  expanded,
  onToggle,
}: {
  room: HearingRoom;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`bg-white border rounded-xl overflow-hidden transition-shadow ${
        expanded ? "border-ca-blue/40 shadow-card-hover" : "border-ca-dark/10 shadow-card"
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full text-left px-4 py-3 flex items-center gap-3"
      >
        <span
          className={`inline-flex items-center justify-center w-12 h-9 rounded-lg text-sm font-bold flex-shrink-0 ${
            room.chamber === "Assembly"
              ? "bg-ca-gold/20 text-ca-dark"
              : "bg-ca-blue/10 text-ca-blue"
          }`}
        >
          {room.room}
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-ca-dark">
            {room.chamber} Hearing Room
          </div>
          <div className="text-xs text-ca-dark/60 truncate">{room.description}</div>
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
          <div className="text-xs text-ca-dark/70">
            <span className="font-semibold text-ca-dark/80">Building:</span>{" "}
            {room.building}
          </div>
          {room.building_short === "Swing" && room.floor >= 4 && (
            <OfficeLocation
              room={`${room.floor}${room.room.slice(1)}`}
              building={room.building}
            />
          )}
        </div>
      )}
    </div>
  );
}
