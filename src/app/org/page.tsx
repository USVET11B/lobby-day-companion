"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getClientOrgByKey, getClientOrgs } from "@/lib/data";
import Link from "next/link";

function OrgContent() {
  const searchParams = useSearchParams();
  const orgKey = searchParams.get("org") || "";
  const org = orgKey ? getClientOrgByKey(orgKey) : null;
  const orgs = getClientOrgs();

  if (!orgKey || !org) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Organization Info
        </h1>
        <p className="text-gray-600">
          Select an organization to view details:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {orgs.map((o) => (
            <Link
              key={o.key}
              href={`/org?org=${o.key}`}
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/org" className="hover:text-primary-600">
            Organizations
          </Link>
          <span>/</span>
          <span className="text-gray-700">{org.key}</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800">
          {org.display_name}
        </h1>
      </div>

      {/* Description */}
      <div className="bg-primary-50 rounded-xl p-4">
        <p className="text-gray-700 leading-relaxed">{org.description}</p>
      </div>

      {/* Talking Points */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Key Talking Points
        </h2>
        <ul className="space-y-2">
          {org.talking_points.map((point, i) => (
            <li key={i} className="flex gap-3">
              <span className="inline-flex items-center justify-center w-6 h-6 bg-primary-100 text-primary-700 rounded-full text-xs font-bold flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span className="text-gray-700 leading-relaxed">{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Key Bills */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Key Bills Being Lobbied
        </h2>
        <div className="space-y-2">
          {org.key_bills.map((bill, i) => (
            <div
              key={i}
              className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center gap-3"
            >
              <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0" />
              <span className="text-gray-700 font-medium">{bill}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Link
          href={`/checklist?org=${org.key}`}
          className="flex-1 text-center bg-primary-700 text-white rounded-xl py-3 font-medium hover:bg-primary-800 transition-colors"
        >
          Start Visit Checklist
        </Link>
        <button
          onClick={() => window.print()}
          className="px-4 bg-gray-100 text-gray-700 rounded-xl py-3 font-medium hover:bg-gray-200 transition-colors no-print"
        >
          Print
        </button>
      </div>
    </div>
  );
}

export default function OrgPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-12 text-gray-400">Loading...</div>
      }
    >
      <OrgContent />
    </Suspense>
  );
}
