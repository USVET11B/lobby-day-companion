import { getLegislatorCount, getClientOrgs } from "@/lib/data";
import Link from "next/link";

export default function Home() {
  const counts = getLegislatorCount();
  const orgs = getClientOrgs();

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center py-8">
        <h1 className="text-3xl font-bold text-primary-700 mb-2">
          Lobby Day Companion
        </h1>
        <p className="text-gray-600 text-lg">
          California Veteran Legislative Advocacy
        </p>
        <div className="mt-4 flex justify-center gap-6 text-sm">
          <div className="bg-primary-50 rounded-lg px-4 py-2">
            <div className="text-2xl font-bold text-primary-700">
              {counts.total}
            </div>
            <div className="text-gray-500">Legislators</div>
          </div>
          <div className="bg-primary-50 rounded-lg px-4 py-2">
            <div className="text-2xl font-bold text-primary-700">
              {counts.senate}
            </div>
            <div className="text-gray-500">Senators</div>
          </div>
          <div className="bg-primary-50 rounded-lg px-4 py-2">
            <div className="text-2xl font-bold text-primary-700">
              {counts.assembly}
            </div>
            <div className="text-gray-500">Assembly</div>
          </div>
        </div>
      </div>

      {/* Org Selector */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
          Select Your Organization
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {orgs.map((org) => (
            <Link
              key={org.key}
              href={`/checklist?org=${org.key}`}
              className="block bg-white border-2 border-primary-200 rounded-xl p-4 text-center hover:border-primary-500 hover:bg-primary-50 transition-all shadow-sm"
            >
              <div className="font-bold text-primary-700 text-lg">
                {org.key}
              </div>
              <div className="text-xs text-gray-500 mt-1 leading-tight">
                {org.display_name.split(" - ")[0]}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/directory"
          className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
        >
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center text-primary-700 font-bold text-xl">
            D
          </div>
          <div>
            <div className="font-semibold text-gray-800">Directory</div>
            <div className="text-sm text-gray-500">Search legislators</div>
          </div>
        </Link>
        <Link
          href="/checklist"
          className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
        >
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-700 font-bold text-xl">
            C
          </div>
          <div>
            <div className="font-semibold text-gray-800">Checklist</div>
            <div className="text-sm text-gray-500">Track your visits</div>
          </div>
        </Link>
        <Link
          href="/org"
          className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
        >
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center text-amber-700 font-bold text-xl">
            O
          </div>
          <div>
            <div className="font-semibold text-gray-800">Org Info</div>
            <div className="text-sm text-gray-500">Talking points</div>
          </div>
        </Link>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-400 py-4 border-t border-gray-100">
        DownRange Relations
      </div>
    </div>
  );
}
