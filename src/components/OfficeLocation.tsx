"use client";

import {
  getFloor,
  getSwingQuadrant,
  getSwingFloorOccupancy,
} from "@/lib/data";
import type { Quadrant } from "@/types";

export default function OfficeLocation({
  room,
  building,
  compact = false,
}: {
  room: string | null;
  building: string | null;
  compact?: boolean;
}) {
  if (!room) return null;

  const isSwing = !!building && building.includes("1021 O");
  const isLOB = !!building && building.includes("1020 N");

  if (!isSwing && !isLOB) {
    return (
      <div className="text-xs text-ca-dark/60 bg-ca-cream border border-ca-dark/10 rounded-lg px-3 py-2">
        Historic State Capitol · see the paper capitol map for exact location
      </div>
    );
  }

  if (isLOB) {
    return (
      <div className="text-xs text-ca-dark/70 bg-ca-cream border border-ca-dark/10 rounded-lg px-3 py-2">
        Legislative Office Building · 1020 N St. · between the Swing Space and
        the State Capitol. Floor {getFloor(room) ?? "?"}.
      </div>
    );
  }

  const floor = getFloor(room);
  const quadrant = getSwingQuadrant(room);
  const occupancy =
    floor !== null ? getSwingFloorOccupancy(floor) : { label: "", detail: null };

  return (
    <div className="bg-ca-cream border border-ca-dark/10 rounded-xl p-3 space-y-2">
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <div className="text-xs font-bold uppercase tracking-wide text-ca-dark">
          Swing Space · Floor {floor}
        </div>
        {occupancy.label && (
          <div className="text-[10px] text-ca-dark/60 font-medium">
            {occupancy.label}
          </div>
        )}
      </div>

      {!compact && occupancy.detail && (
        <div className="text-[11px] text-ca-dark/60 leading-snug">
          {occupancy.detail}
        </div>
      )}

      <FloorDiagram highlight={quadrant} />

      <div className="text-[11px] text-ca-dark/70 leading-snug">
        <strong className="text-ca-dark">Room {room}</strong> —{" "}
        {describeQuadrant(quadrant)}
      </div>
    </div>
  );
}

function describeQuadrant(q: Quadrant): string {
  switch (q) {
    case "NW":
      return "exit the elevator, turn left, walk past the restroom toward the 10th Street side";
    case "SW":
      return "exit the elevator, turn left and head toward the O Street (south) corner on the 10th Street side";
    case "NE":
      return "exit the elevator, turn right and head toward the 11th Street side of the building";
    case "SE":
      return "exit the elevator, turn right toward the O Street (south) corner on the 11th Street side";
    default:
      return "location within the floor varies — check the lobby directory";
  }
}

function FloorDiagram({ highlight }: { highlight: Quadrant }) {
  const base =
    "relative aspect-[5/4] border-2 border-dashed border-ca-dark/20 rounded text-[10px] font-semibold flex items-center justify-center transition-colors";
  const active = "bg-ca-gold/60 border-ca-gold text-ca-dark";
  const inactive = "bg-white/60 text-ca-dark/40";

  return (
    <div className="relative">
      <div className="grid grid-cols-[auto_1fr_auto_1fr_auto] grid-rows-[auto_auto_auto_auto_auto] gap-1 text-[9px] text-ca-dark/50">
        {/* Row 1: north label */}
        <div />
        <div className="text-center font-semibold text-ca-dark/60">
          ↑ inside
        </div>
        <div />
        <div className="text-center font-semibold text-ca-dark/60">
          ↑ inside
        </div>
        <div />

        {/* Row 2: top quadrants */}
        <div className="font-bold self-center">10th St</div>
        <div className={`${base} ${highlight === "NW" ? active : inactive}`}>
          NW
          <span className="absolute bottom-0.5 right-1 text-[8px] font-normal">220-350</span>
        </div>
        <div className="font-bold self-center text-ca-dark/40">
          <div>elev</div>
        </div>
        <div className={`${base} ${highlight === "NE" ? active : inactive}`}>
          NE
          <span className="absolute bottom-0.5 right-1 text-[8px] font-normal">510-640</span>
        </div>
        <div className="font-bold self-center">11th St</div>

        {/* Row 3: center (lobby / elevators / restroom) */}
        <div />
        <div className="text-center text-[9px] text-ca-dark/50">restroom</div>
        <div className="text-center text-[9px] text-ca-dark/50">lobby</div>
        <div className="text-center text-[9px] text-ca-dark/50">elevators</div>
        <div />

        {/* Row 4: bottom quadrants */}
        <div className="font-bold self-center">10th St</div>
        <div className={`${base} ${highlight === "SW" ? active : inactive}`}>
          SW
          <span className="absolute bottom-0.5 right-1 text-[8px] font-normal">100-240</span>
        </div>
        <div className="font-bold self-center text-ca-dark/40">
          <div>rest</div>
        </div>
        <div className={`${base} ${highlight === "SE" ? active : inactive}`}>
          SE
          <span className="absolute bottom-0.5 right-1 text-[8px] font-normal">620-740</span>
        </div>
        <div className="font-bold self-center">11th St</div>

        {/* Row 5: south label */}
        <div />
        <div className="text-center font-semibold text-ca-dark/60">
          O St (entrance) ↓
        </div>
        <div />
        <div className="text-center font-semibold text-ca-dark/60">
          O St (entrance) ↓
        </div>
        <div />
      </div>
    </div>
  );
}
