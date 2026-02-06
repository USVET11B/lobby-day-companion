"use client";

import { useState, useMemo } from "react";
import { getLegislators } from "@/lib/data";
import type { Legislator } from "@/types";

type ChamberFilter = "All" | "Senate" | "Assembly";
type PartyFilter = "All" | "D" | "R";

export default function DirectoryPage() {
  const [search, setSearch] = useState("");
  const [chamberFilter, setChamberFilter] = useState<ChamberFilter>("All");
  const [partyFilter, setPartyFilter] = useState<PartyFilter>("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const allLegislators = useMemo(() => getLegislators(), []);

  const filtered = useMemo(() => {
    return allLegislators.filter((leg) => {
      if (chamberFilter !== "All" && leg.chamber !== chamberFilter) return false;
      if (partyFilter !== "All" && leg.party !== partyFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const matchName = leg.name.toLowerCase().includes(q);
        const matchDistrict = leg.district.toString() === q;
        if (!matchName && !matchDistrict) return false;
      }
      return true;
    });
  }, [search, chamberFilter, partyFilter, allLegislators]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Legislator Directory</h1>

      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Search by name or district number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Chamber Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(["All", "Senate", "Assembly"] as ChamberFilter[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setChamberFilter(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              chamberFilter === tab
                ? "bg-primary-700 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab}
          </button>
        ))}
        <div className="flex-1" />
        {/* Party Filter */}
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
                  : "bg-gray-700 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {p === "All" ? "All" : p === "D" ? "Dem" : "Rep"}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500">
        {filtered.length} legislator{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Legislator Cards */}
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
        <div className="text-center py-12 text-gray-400">
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
  return (
    <div
      className={`border rounded-xl overflow-hidden transition-shadow ${
        expanded ? "shadow-md border-primary-300" : "border-gray-200"
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full text-left px-4 py-3 flex items-center gap-3"
      >
        {/* Party Badge */}
        <span
          className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-bold flex-shrink-0 ${
            leg.party === "D" ? "bg-dem" : "bg-rep"
          }`}
        >
          {leg.party}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-800 truncate">
              {leg.name}
            </span>
            {leg.is_veteran && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                Veteran
              </span>
            )}
            {leg.leadership_position && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0 hidden sm:inline">
                {leg.leadership_position}
              </span>
            )}
          </div>
          <div className="text-sm text-gray-500">
            {leg.chamber} District {leg.district}
          </div>
        </div>

        <svg
          className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${
            expanded ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
          {leg.leadership_position && (
            <div className="sm:hidden">
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                {leg.leadership_position}
              </span>
            </div>
          )}

          {leg.is_veteran && leg.veteran_branch && (
            <div className="text-sm text-amber-700">
              Veteran &mdash; {leg.veteran_branch}
            </div>
          )}

          {/* Contact Actions */}
          <div className="flex flex-wrap gap-2">
            {leg.phone && (
              <a
                href={`tel:${leg.phone.replace(/[^\d+]/g, "")}`}
                className="inline-flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 rounded-lg px-3 py-2 text-sm font-medium hover:bg-green-100 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                {leg.phone}
              </a>
            )}
            {leg.email && (
              <a
                href={`mailto:${leg.email}`}
                className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg px-3 py-2 text-sm font-medium hover:bg-blue-100 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Email
              </a>
            )}
          </div>

          {/* Capitol Office */}
          {leg.capitol_office && (
            <div className="text-sm">
              <span className="font-medium text-gray-600">Capitol Office:</span>{" "}
              <span className="text-gray-800">{leg.capitol_office}</span>
            </div>
          )}

          {/* Committees */}
          {leg.committees && leg.committees.length > 0 && (
            <div>
              <div className="text-sm font-medium text-gray-600 mb-1">
                Committees:
              </div>
              <div className="flex flex-wrap gap-1">
                {leg.committees.map((c, i) => (
                  <span
                    key={i}
                    className={`text-xs px-2 py-1 rounded-full ${
                      c.role === "Chair"
                        ? "bg-primary-100 text-primary-700 font-medium"
                        : c.role === "Vice Chair"
                        ? "bg-primary-50 text-primary-600"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {c.committee_name}
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
