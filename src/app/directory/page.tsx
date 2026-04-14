"use client";

import { useState, useMemo } from "react";
import {
  getLegislators,
  getFloor,
  getAvailableFloors,
  sortLegislators,
  getBuildingShort,
  type SortMode,
} from "@/lib/data";
import SortFloorBar from "@/components/SortFloorBar";
import OfficeLocation from "@/components/OfficeLocation";
import type { Legislator } from "@/types";

type ChamberFilter = "All" | "Senate" | "Assembly";
type PartyFilter = "All" | "D" | "R";

export default function DirectoryPage() {
  const [search, setSearch] = useState("");
  const [chamberFilter, setChamberFilter] = useState<ChamberFilter>("All");
  const [partyFilter, setPartyFilter] = useState<PartyFilter>("All");
  const [veteranOnly, setVeteranOnly] = useState(false);
  const [floorFilter, setFloorFilter] = useState<number | "all">("all");
  const [sortMode, setSortMode] = useState<SortMode>("default");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const allLegislators = useMemo(() => getLegislators(), []);
  const availableFloors = useMemo(() => getAvailableFloors(), []);

  const filtered = useMemo(() => {
    const result = allLegislators.filter((leg) => {
      if (chamberFilter !== "All" && leg.chamber !== chamberFilter) return false;
      if (partyFilter !== "All" && leg.party !== partyFilter) return false;
      if (veteranOnly && !leg.has_veteran_legislation) return false;
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
  }, [search, chamberFilter, partyFilter, veteranOnly, floorFilter, sortMode, allLegislators]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-ca-dark">Legislator Directory</h1>
        <p className="text-sm text-ca-dark/60 mt-1">
          All 120 California legislators · Capitol rooms, phones, committees
        </p>
      </div>

      <div>
        <input
          type="text"
          placeholder="Search by name, district, or room number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-ca-dark/20 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ca-blue focus:border-ca-blue bg-white"
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["All", "Senate", "Assembly"] as ChamberFilter[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setChamberFilter(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              chamberFilter === tab
                ? "bg-ca-dark text-white"
                : "bg-white border border-ca-dark/20 text-ca-dark/70 hover:border-ca-dark/40"
            }`}
          >
            {tab}
          </button>
        ))}
        <div className="flex-1" />
        {(["All", "D", "R"] as PartyFilter[]).map((p) => (
          <button
            key={p}
            onClick={() => setPartyFilter(p)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              partyFilter === p
                ? p === "D"
                  ? "bg-dem text-white"
                  : p === "R"
                  ? "bg-rep text-white"
                  : "bg-ca-dark text-white"
                : "bg-white border border-ca-dark/20 text-ca-dark/70 hover:border-ca-dark/40"
            }`}
          >
            {p === "All" ? "All" : p === "D" ? "Dem" : "Rep"}
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

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-ca-dark/70 cursor-pointer">
          <input
            type="checkbox"
            checked={veteranOnly}
            onChange={(e) => setVeteranOnly(e.target.checked)}
            className="w-4 h-4 rounded border-ca-dark/30 text-ca-blue focus:ring-ca-blue"
          />
          Veteran champions only
        </label>
        <p className="text-sm text-ca-dark/50">
          {filtered.length} {filtered.length === 1 ? "result" : "results"}
        </p>
      </div>

      <div className="space-y-2">
        {filtered.map((leg) => (
          <LegislatorCard
            key={leg.id}
            legislator={leg}
            expanded={expandedId === leg.id}
            onToggle={() =>
              setExpandedId(expandedId === leg.id ? null : leg.id)
            }
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-ca-dark/40 bg-white rounded-xl border border-ca-dark/10">
          No legislators match your search.
        </div>
      )}
    </div>
  );
}

function LegislatorCard({
  legislator: leg,
  expanded,
  onToggle,
}: {
  legislator: Legislator;
  expanded: boolean;
  onToggle: () => void;
}) {
  const relevanceTier =
    (leg.veteran_relevance_score ?? 0) >= 8
      ? "champion"
      : (leg.veteran_relevance_score ?? 0) >= 5
      ? "supporter"
      : null;

  return (
    <div
      className={`bg-white border rounded-xl overflow-hidden transition-shadow ${
        expanded ? "shadow-card-hover border-ca-blue/40" : "border-ca-dark/10 shadow-card"
      }`}
    >
      <button
        onClick={onToggle}
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
            {relevanceTier === "champion" && (
              <span className="text-[10px] bg-ca-gold/20 text-ca-dark px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                Champion
              </span>
            )}
            {relevanceTier === "supporter" && (
              <span className="text-[10px] bg-ca-blue/10 text-ca-blue px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                Supporter
              </span>
            )}
          </div>
          <div className="text-sm text-ca-dark/60 flex items-center gap-2 flex-wrap">
            <span>{leg.chamber} District {leg.district}</span>
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
          <OfficeLocation room={leg.capitol_room} building={leg.capitol_building} />

          {leg.veteran_relevance_notes && (
            <div className="text-xs bg-ca-gold/10 border border-ca-gold/30 rounded-lg px-3 py-2 text-ca-dark/80">
              <div className="font-semibold text-ca-dark mb-0.5">Veteran relevance</div>
              {leg.veteran_relevance_notes}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {leg.capitol_phone && (
              <a
                href={`tel:${leg.capitol_phone.replace(/[^\d+]/g, "")}`}
                className="inline-flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 rounded-lg px-3 py-2 text-sm font-medium hover:bg-green-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {leg.capitol_phone}
              </a>
            )}
            {leg.capitol_email && (
              <a
                href={`mailto:${leg.capitol_email}`}
                className="inline-flex items-center gap-2 bg-ca-blue/5 text-ca-blue border border-ca-blue/20 rounded-lg px-3 py-2 text-sm font-medium hover:bg-ca-blue/10 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email
              </a>
            )}
            {leg.scheduling_portal_url && (
              <a
                href={leg.scheduling_portal_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-ca-gold/10 text-ca-dark border border-ca-gold/40 rounded-lg px-3 py-2 text-sm font-medium hover:bg-ca-gold/20 transition-colors"
              >
                Schedule meeting
              </a>
            )}
          </div>

          {leg.district_office.city && (
            <div className="text-xs text-ca-dark/60">
              <span className="font-medium text-ca-dark/80">District office:</span>{" "}
              {[leg.district_office.street, leg.district_office.city, leg.district_office.state]
                .filter(Boolean)
                .join(", ")}
              {leg.district_office.phone ? ` · ${leg.district_office.phone}` : ""}
            </div>
          )}

          {leg.committees && leg.committees.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-ca-dark/70 uppercase tracking-wide mb-1">
                Committees
              </div>
              <div className="flex flex-wrap gap-1">
                {leg.committees.map((c, i) => (
                  <span
                    key={i}
                    className={`text-xs px-2 py-1 rounded-full ${
                      c.role === "Chair"
                        ? "bg-ca-blue text-white font-semibold"
                        : c.role === "Vice Chair"
                        ? "bg-ca-blue/15 text-ca-blue font-medium"
                        : "bg-ca-dark/5 text-ca-dark/70"
                    }`}
                  >
                    {c.committee}
                    {c.role !== "Member" ? ` (${c.role})` : ""}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
