"use client";

import { useState, useMemo } from "react";
import {
  getLegislators,
  getAvailableFloors,
  getFloor,
  getSwingQuadrant,
  getSwingFloorOccupancy,
  getHearingRooms,
} from "@/lib/data";
import type { Quadrant } from "@/types";

type Occupant = {
  kind: "legislator" | "hearing";
  room: string;
  quadrant: Quadrant;
  label: string;
  sublabel: string;
  chamber: "Senate" | "Assembly";
  party?: "D" | "R";
};

export default function MapPage() {
  const legislators = useMemo(() => getLegislators(), []);
  const hearingRooms = useMemo(() => getHearingRooms(), []);
  const floors = useMemo(() => getAvailableFloors(), []);

  // Default to floor 4 (lowest legislator floor in Swing Space)
  const [selectedFloor, setSelectedFloor] = useState<number>(() =>
    floors.find((f) => f >= 4) ?? floors[0] ?? 4
  );
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);

  const occupants = useMemo<Occupant[]>(() => {
    const out: Occupant[] = [];
    for (const l of legislators) {
      if (!l.capitol_room) continue;
      if (!l.capitol_building?.includes("1021 O")) continue;
      if (getFloor(l.capitol_room) !== selectedFloor) continue;
      out.push({
        kind: "legislator",
        room: l.capitol_room,
        quadrant: getSwingQuadrant(l.capitol_room),
        label: l.name,
        sublabel: `${l.chamber} D-${l.district}`,
        chamber: l.chamber,
        party: l.party,
      });
    }
    for (const h of hearingRooms) {
      if (h.building_short !== "Swing") continue;
      if (h.floor !== selectedFloor) continue;
      // Hearing rooms in Swing use short numbers like 1100, 2100 — their
      // "quadrant" doesn't map cleanly, so we'll show them in a separate
      // section below the diagram.
      out.push({
        kind: "hearing",
        room: h.room,
        quadrant: "unknown",
        label: `${h.chamber} Hearing Room`,
        sublabel: h.description,
        chamber: h.chamber,
      });
    }
    return out;
  }, [legislators, hearingRooms, selectedFloor]);

  const byQuadrant = useMemo(() => {
    const groups: Record<Quadrant, Occupant[]> = {
      NW: [],
      NE: [],
      SW: [],
      SE: [],
      center: [],
      unknown: [],
    };
    for (const o of occupants) {
      if (o.kind === "legislator") groups[o.quadrant].push(o);
    }
    for (const q of Object.keys(groups) as Quadrant[]) {
      groups[q].sort((a, b) => a.room.localeCompare(b.room));
    }
    return groups;
  }, [occupants]);

  const hearingOnFloor = occupants.filter((o) => o.kind === "hearing");
  const occupancy = getSwingFloorOccupancy(selectedFloor);
  const legislatorCount = occupants.filter((o) => o.kind === "legislator").length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-ca-dark">Swing Space Floor Map</h1>
        <p className="text-sm text-ca-dark/60 mt-1">
          Pick a floor to see where every legislator&apos;s office sits. Rooms are
          grouped into the four quadrants of the building, same layout on every floor.
        </p>
      </div>

      {/* Floor picker */}
      <div className="bg-white border border-ca-dark/10 rounded-xl p-3 shadow-card">
        <div className="text-xs font-semibold text-ca-dark/70 uppercase tracking-wide mb-2">
          Floor
        </div>
        <div className="grid grid-cols-6 gap-1.5">
          {floors
            .filter((f) => f >= 3)
            .map((f) => (
              <button
                key={f}
                onClick={() => {
                  setSelectedFloor(f);
                  setSelectedRoom(null);
                }}
                className={`px-2 py-2 rounded-lg text-sm font-bold transition-colors ${
                  selectedFloor === f
                    ? "bg-ca-dark text-white"
                    : "bg-ca-dark/5 text-ca-dark/70 hover:bg-ca-dark/10"
                }`}
              >
                {f}
              </button>
            ))}
        </div>
        <div className="mt-3 text-xs text-ca-dark/70">
          <span className="font-bold text-ca-dark">{occupancy.label}</span>
          {occupancy.detail && (
            <span className="text-ca-dark/60"> — {occupancy.detail}</span>
          )}
          <span className="text-ca-dark/50 ml-2">
            · {legislatorCount} offices
          </span>
        </div>
      </div>

      {/* Floor diagram */}
      {selectedFloor === 3 ? (
        <Floor3Diagram />
      ) : (
        <FloorDiagram
          byQuadrant={byQuadrant}
          selectedRoom={selectedRoom}
          onSelectRoom={setSelectedRoom}
        />
      )}

      {/* Selected room detail */}
      {selectedRoom && (
        <SelectedRoomCard
          occupant={occupants.find((o) => o.room === selectedRoom) || null}
          onClose={() => setSelectedRoom(null)}
        />
      )}

      {/* Hearing rooms on this floor */}
      {hearingOnFloor.length > 0 && (
        <div className="bg-white border border-ca-dark/10 rounded-xl p-4 shadow-card">
          <div className="text-xs font-semibold text-ca-dark/70 uppercase tracking-wide mb-2">
            Hearing rooms on this floor
          </div>
          <div className="space-y-2">
            {hearingOnFloor.map((h) => (
              <div
                key={h.room}
                className="flex items-start gap-3 border-l-2 border-ca-gold pl-3 py-1"
              >
                <span
                  className={`inline-flex items-center justify-center px-2 py-1 rounded text-xs font-bold flex-shrink-0 ${
                    h.chamber === "Assembly"
                      ? "bg-ca-gold/20 text-ca-dark"
                      : "bg-ca-blue/10 text-ca-blue"
                  }`}
                >
                  {h.room}
                </span>
                <div className="text-xs text-ca-dark/70 min-w-0">
                  <div className="font-semibold text-ca-dark">{h.label}</div>
                  <div>{h.sublabel}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FloorDiagram({
  byQuadrant,
  selectedRoom,
  onSelectRoom,
}: {
  byQuadrant: Record<Quadrant, Occupant[]>;
  selectedRoom: string | null;
  onSelectRoom: (room: string) => void;
}) {
  const edgeLabel =
    "flex items-center justify-center font-bold text-[10px] text-ca-dark/50 uppercase tracking-wider px-1";

  return (
    <div className="bg-white border border-ca-dark/10 rounded-xl p-3 shadow-card">
      {/* North label */}
      <div className="text-center text-[10px] text-ca-dark/50 font-semibold uppercase tracking-wider mb-2">
        ↑ Back of building (away from O St)
      </div>

      <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 items-stretch">
        {/* Row 1: 10th | NW | NE | 11th */}
        <div className={edgeLabel}>10th St</div>
        <QuadrantCell
          label="NW"
          range="rooms 220–350"
          corner="10th St side"
          occupants={byQuadrant.NW}
          selectedRoom={selectedRoom}
          onSelectRoom={onSelectRoom}
          alignCorner="topLeft"
        />
        <QuadrantCell
          label="NE"
          range="rooms 510–640"
          corner="11th St side"
          occupants={byQuadrant.NE}
          selectedRoom={selectedRoom}
          onSelectRoom={onSelectRoom}
          alignCorner="topRight"
        />
        <div className={edgeLabel}>11th St</div>

        {/* Row 2: center strip with restroom (far-left) | lobby | elevators (far-right) */}
        <div className={edgeLabel}>10th St</div>
        <div className="col-span-2 bg-ca-cream border-y border-dashed border-ca-dark/20 py-3 px-2 flex items-center justify-between text-[10px] uppercase tracking-wider font-bold text-ca-dark/60">
          <span>Restroom</span>
          <span className="text-ca-dark/70">Lobby</span>
          <span>Elevators</span>
        </div>
        <div className={edgeLabel}>11th St</div>

        {/* Row 3: 10th | SW | SE | 11th */}
        <div className={edgeLabel}>10th St</div>
        <QuadrantCell
          label="SW"
          range="rooms 100–240"
          corner="10th/O corner"
          occupants={byQuadrant.SW}
          selectedRoom={selectedRoom}
          onSelectRoom={onSelectRoom}
          alignCorner="bottomLeft"
        />
        <QuadrantCell
          label="SE"
          range="rooms 620–740"
          corner="11th/O corner"
          occupants={byQuadrant.SE}
          selectedRoom={selectedRoom}
          onSelectRoom={onSelectRoom}
          alignCorner="bottomRight"
        />
        <div className={edgeLabel}>11th St</div>
      </div>

      {/* South label (entrance) */}
      <div className="text-center text-[10px] text-ca-dark/50 font-semibold uppercase tracking-wider mt-2">
        ↓ O St entrance ↓
      </div>

      {byQuadrant.unknown.length > 0 && (
        <div className="mt-3 p-2 bg-ca-cream border border-ca-dark/10 rounded text-[11px] text-ca-dark/60">
          <span className="font-semibold">Not placed on map:</span>{" "}
          {byQuadrant.unknown.map((o) => o.room).join(", ")}
        </div>
      )}
    </div>
  );
}

function Floor3Diagram() {
  const edgeLabel =
    "flex items-center justify-center font-bold text-[10px] text-ca-dark/50 uppercase tracking-wider px-1";

  return (
    <div className="bg-white border border-ca-dark/10 rounded-xl p-3 shadow-card">
      <div className="text-center text-[10px] text-ca-dark/50 font-semibold uppercase tracking-wider mb-2">
        ↑ Back of building (away from O St)
      </div>

      <div className="grid grid-cols-[auto_1fr_auto] gap-2 items-stretch">
        {/* Left edge label */}
        <div className={edgeLabel}>10th St</div>

        {/* Wide center column */}
        <div className="border-2 border-dashed border-ca-dark/20 rounded-lg p-3 min-h-[260px]">
          {/* Top row: committee offices on each side */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-ca-blue/5 border border-ca-blue/20 rounded-lg p-2 text-center">
              <div className="text-[10px] font-bold uppercase tracking-wider text-ca-blue">
                Committee Offices
              </div>
              <div className="text-[9px] text-ca-dark/50 mt-0.5">10th St side</div>
            </div>
            <div className="bg-ca-blue/5 border border-ca-blue/20 rounded-lg p-2 text-center">
              <div className="text-[10px] font-bold uppercase tracking-wider text-ca-blue">
                Committee Offices
              </div>
              <div className="text-[9px] text-ca-dark/50 mt-0.5">11th St side</div>
            </div>
          </div>

          {/* Center: lobby with vertical cafeteria block */}
          <div className="bg-ca-cream border border-dashed border-ca-dark/30 rounded-lg p-3">
            <div className="text-center text-[10px] uppercase tracking-wider font-bold text-ca-dark/60 mb-2">
              Open Lobby
            </div>
            <div className="grid grid-cols-[auto_1fr_auto] items-stretch gap-2">
              <div className="text-[10px] uppercase tracking-wider font-bold text-ca-dark/60 self-center">
                Restroom
              </div>
              <div className="bg-ca-gold/30 border border-ca-gold/60 rounded-lg p-3 text-center min-h-[80px] flex flex-col items-center justify-center">
                <div className="text-[10px] font-bold uppercase tracking-wider text-ca-dark">
                  Cafeteria
                </div>
                <div className="text-[9px] text-ca-dark/60 mt-0.5">
                  small café
                </div>
                <div className="text-[9px] text-ca-dark/50">
                  no seating
                </div>
              </div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-ca-dark/60 self-center">
                Elevators
              </div>
            </div>
          </div>

          {/* Bottom: more committee offices */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="bg-ca-blue/5 border border-ca-blue/20 rounded-lg p-2 text-center">
              <div className="text-[10px] font-bold uppercase tracking-wider text-ca-blue">
                Committee Offices
              </div>
              <div className="text-[9px] text-ca-dark/50 mt-0.5">10th St side</div>
            </div>
            <div className="bg-ca-blue/5 border border-ca-blue/20 rounded-lg p-2 text-center">
              <div className="text-[10px] font-bold uppercase tracking-wider text-ca-blue">
                Committee Offices
              </div>
              <div className="text-[9px] text-ca-dark/50 mt-0.5">11th St side</div>
            </div>
          </div>
        </div>

        {/* Right edge label */}
        <div className={edgeLabel}>11th St</div>
      </div>

      <div className="text-center text-[10px] text-ca-dark/50 font-semibold uppercase tracking-wider mt-2">
        ↓ O St entrance ↓
      </div>

      <div className="mt-3 text-[11px] text-ca-dark/70 bg-ca-cream border border-ca-dark/10 rounded p-2 leading-snug">
        Floor 3 has no legislator offices. It houses Senate committee staff,
        the Department of Finance, Legislative Counsel, and a small café in
        the open lobby area (no seating).
      </div>
    </div>
  );
}

function QuadrantCell({
  label,
  range,
  corner,
  occupants,
  selectedRoom,
  onSelectRoom,
}: {
  label: string;
  range: string;
  corner: string;
  occupants: Occupant[];
  selectedRoom: string | null;
  onSelectRoom: (room: string) => void;
  alignCorner: "topLeft" | "topRight" | "bottomLeft" | "bottomRight";
}) {
  return (
    <div className="border-2 border-dashed border-ca-dark/20 rounded-lg p-2 min-h-[120px]">
      <div className="flex items-baseline justify-between mb-1.5">
        <div className="text-[10px] font-bold uppercase tracking-wider text-ca-dark/70">
          {label}
        </div>
        <div className="text-[9px] text-ca-dark/40">{corner}</div>
      </div>
      <div className="text-[9px] text-ca-dark/40 mb-1.5">{range}</div>
      <div className="flex flex-wrap gap-1">
        {occupants.length === 0 ? (
          <div className="text-[10px] text-ca-dark/30 italic">—</div>
        ) : (
          occupants.map((o) => (
            <button
              key={o.room}
              onClick={() => onSelectRoom(o.room)}
              className={`text-[10px] font-bold rounded px-1.5 py-0.5 transition-colors ${
                selectedRoom === o.room
                  ? "bg-ca-gold text-ca-dark ring-2 ring-ca-gold"
                  : o.party === "D"
                  ? "bg-dem/10 text-dem hover:bg-dem/20"
                  : "bg-rep/10 text-rep hover:bg-rep/20"
              }`}
              title={o.label}
            >
              {o.room}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function SelectedRoomCard({
  occupant,
  onClose,
}: {
  occupant: Occupant | null;
  onClose: () => void;
}) {
  if (!occupant) return null;
  return (
    <div className="bg-gradient-to-br from-ca-dark to-ca-blue text-white rounded-xl p-4 shadow-card-hover">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-ca-gold font-semibold uppercase tracking-wider">
            Room {occupant.room}
          </div>
          <div className="text-lg font-bold">{occupant.label}</div>
          <div className="text-xs text-white/70 mt-0.5">{occupant.sublabel}</div>
        </div>
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white text-xs"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
      <div className="text-xs text-white/80 mt-3 pt-3 border-t border-white/10">
        {describeQuadrant(occupant.quadrant)}
      </div>
    </div>
  );
}

function describeQuadrant(q: Quadrant): string {
  switch (q) {
    case "NW":
      return "Exit the elevator, turn left and walk past the restroom toward the 10th Street (away from O St) corner.";
    case "SW":
      return "Exit the elevator, turn left and head toward the 10th Street / O Street corner near the entrance.";
    case "NE":
      return "Exit the elevator, turn right and walk toward the 11th Street (away from O St) corner.";
    case "SE":
      return "Exit the elevator, turn right and head toward the 11th Street / O Street corner near the entrance.";
    default:
      return "Check the lobby directory for this room.";
  }
}
