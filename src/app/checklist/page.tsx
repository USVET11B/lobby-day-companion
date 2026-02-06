"use client";

import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getLegislators, getClientOrgByKey, getClientOrgs } from "@/lib/data";
import type { Legislator, VisitChecklist } from "@/types";
import Link from "next/link";

function ChecklistContent() {
  const searchParams = useSearchParams();
  const orgKey = searchParams.get("org") || "";
  const org = orgKey ? getClientOrgByKey(orgKey) : null;
  const orgs = getClientOrgs();
  const allLegislators = useMemo(() => getLegislators(), []);

  const storageKey = orgKey
    ? `lobby-visits-${orgKey}`
    : "lobby-visits-default";

  const [visits, setVisits] = useState<Record<string, VisitChecklist>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setVisits(JSON.parse(stored));
      } else {
        setVisits({});
      }
    } catch {
      // ignore parse errors
    }
    setLoaded(true);
  }, [storageKey]);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem(storageKey, JSON.stringify(visits));
    }
  }, [visits, storageKey, loaded]);

  const updateVisit = useCallback(
    (
      legId: string,
      field: keyof VisitChecklist,
      value: boolean | string
    ) => {
      setVisits((prev) => {
        const existing = prev[legId] || {
          legislator_id: legId,
          visited: false,
          spoke_with_staff: false,
          left_materials: false,
          notes: "",
        };
        return {
          ...prev,
          [legId]: {
            ...existing,
            [field]: value,
          },
        };
      });
    },
    []
  );

  const clearAll = useCallback(() => {
    if (
      window.confirm(
        "Clear all visit data for this organization? This cannot be undone."
      )
    ) {
      setVisits({});
    }
  }, []);

  const visitedCount = useMemo(
    () => Object.values(visits).filter((v) => v.visited).length,
    [visits]
  );

  const totalCount = allLegislators.length;
  const progressPercent =
    totalCount > 0 ? Math.round((visitedCount / totalCount) * 100) : 0;

  if (!orgKey) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Visit Checklist</h1>
        <p className="text-gray-600">
          Select an organization to track visits:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {orgs.map((o) => (
            <Link
              key={o.key}
              href={`/checklist?org=${o.key}`}
              className="block bg-white border-2 border-primary-200 rounded-xl p-4 text-center hover:border-primary-500 hover:bg-primary-50 transition-all shadow-sm"
            >
              <div className="font-bold text-primary-700 text-lg">
                {o.key}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {o.display_name.split(" - ")[0]}
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Visit Checklist</h1>
          {org && (
            <p className="text-sm text-gray-500">
              Visits for{" "}
              <Link
                href={`/org?org=${orgKey}`}
                className="text-primary-600 hover:underline font-medium"
              >
                {org.display_name}
              </Link>
            </p>
          )}
        </div>
        <button
          onClick={clearAll}
          className="text-sm text-red-500 hover:text-red-700 transition-colors"
        >
          Clear All
        </button>
      </div>

      {/* Progress Bar */}
      <div className="bg-gray-100 rounded-full overflow-hidden h-4">
        <div
          className="bg-green-500 h-full rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <p className="text-sm text-gray-500 text-center">
        {visitedCount} of {totalCount} offices visited ({progressPercent}%)
      </p>

      {/* Legislator checklist items */}
      <div className="space-y-2">
        {allLegislators.map((leg) => (
          <ChecklistItem
            key={leg.id}
            legislator={leg}
            visit={visits[leg.id]}
            onUpdate={updateVisit}
          />
        ))}
      </div>
    </div>
  );
}

function ChecklistItem({
  legislator: leg,
  visit,
  onUpdate,
}: {
  legislator: Legislator;
  visit?: VisitChecklist;
  onUpdate: (
    id: string,
    field: keyof VisitChecklist,
    value: boolean | string
  ) => void;
}) {
  const [showNotes, setShowNotes] = useState(false);
  const isVisited = visit?.visited || false;

  return (
    <div
      className={`border rounded-xl p-3 transition-colors ${
        isVisited ? "bg-green-50 border-green-200" : "border-gray-200"
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-white text-xs font-bold flex-shrink-0 ${
            leg.party === "D" ? "bg-dem" : "bg-rep"
          }`}
        >
          {leg.party}
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-800 text-sm truncate">
            {leg.name}
          </div>
          <div className="text-xs text-gray-500">
            {leg.chamber} D-{leg.district}
          </div>
        </div>
        <button
          onClick={() => setShowNotes(!showNotes)}
          className="text-xs text-gray-400 hover:text-gray-600 flex-shrink-0"
        >
          {showNotes ? "Hide" : "Notes"}
        </button>
      </div>

      {/* Checkboxes */}
      <div className="flex gap-4 mt-2 ml-10 flex-wrap">
        <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={visit?.visited || false}
            onChange={(e) =>
              onUpdate(leg.id, "visited", e.target.checked)
            }
            className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          Visited
        </label>
        <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={visit?.spoke_with_staff || false}
            onChange={(e) =>
              onUpdate(leg.id, "spoke_with_staff", e.target.checked)
            }
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Spoke w/ Staff
        </label>
        <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={visit?.left_materials || false}
            onChange={(e) =>
              onUpdate(leg.id, "left_materials", e.target.checked)
            }
            className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
          />
          Left Materials
        </label>
      </div>

      {/* Notes */}
      {showNotes && (
        <div className="mt-2 ml-10">
          <textarea
            placeholder="Add notes about this visit..."
            value={visit?.notes || ""}
            onChange={(e) => onUpdate(leg.id, "notes", e.target.value)}
            rows={2}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
        </div>
      )}
    </div>
  );
}

export default function ChecklistPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-12 text-gray-400">
          Loading checklist...
        </div>
      }
    >
      <ChecklistContent />
    </Suspense>
  );
}
