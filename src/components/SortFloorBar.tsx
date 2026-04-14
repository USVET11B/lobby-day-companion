"use client";

import type { SortMode } from "@/lib/data";

export default function SortFloorBar({
  sortMode,
  setSortMode,
  floorFilter,
  setFloorFilter,
  availableFloors,
}: {
  sortMode: SortMode;
  setSortMode: (m: SortMode) => void;
  floorFilter: number | "all";
  setFloorFilter: (f: number | "all") => void;
  availableFloors: number[];
}) {
  return (
    <div className="bg-white border border-ca-dark/10 rounded-xl p-3 shadow-card space-y-3">
      <div>
        <div className="text-xs font-semibold text-ca-dark/70 uppercase tracking-wide mb-1.5">
          Sort by
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {(
            [
              { mode: "default" as SortMode, label: "Default" },
              { mode: "alpha" as SortMode, label: "A–Z" },
              { mode: "room" as SortMode, label: "Room #" },
            ]
          ).map(({ mode, label }) => (
            <button
              key={mode}
              onClick={() => setSortMode(mode)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                sortMode === mode
                  ? "bg-ca-dark text-white"
                  : "bg-ca-dark/5 text-ca-dark/70 hover:bg-ca-dark/10"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-ca-dark/70 uppercase tracking-wide block mb-1.5">
          Floor
        </label>
        <select
          value={floorFilter === "all" ? "all" : String(floorFilter)}
          onChange={(e) =>
            setFloorFilter(
              e.target.value === "all" ? "all" : parseInt(e.target.value, 10)
            )
          }
          className="w-full border border-ca-dark/20 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ca-blue focus:border-ca-blue"
        >
          <option value="all">All floors</option>
          {availableFloors.map((f) => (
            <option key={f} value={f}>
              Floor {f}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
