import { getLegislatorCount } from "@/lib/data";
import Link from "next/link";

export default function Home() {
  const counts = getLegislatorCount();

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="bg-gradient-to-br from-ca-dark to-ca-blue rounded-2xl p-6 sm:p-8 text-white shadow-soft">
        <div className="text-xs tracking-[0.2em] uppercase text-ca-gold font-semibold">
          California State Capitol
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold mt-1">Lobby Day Companion</h1>
        <p className="text-sm text-white/80 mt-2 max-w-md">
          Everything you need on the capitol floor: legislator directory, visit
          checklist, and live notes that flow back to Government Relations.
        </p>
        <div className="mt-5 flex gap-4 text-sm">
          <div className="bg-white/10 backdrop-blur rounded-lg px-4 py-2">
            <div className="text-2xl font-bold text-ca-gold">{counts.total}</div>
            <div className="text-white/70 text-xs">Legislators</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg px-4 py-2">
            <div className="text-2xl font-bold">{counts.senate}</div>
            <div className="text-white/70 text-xs">Senators</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg px-4 py-2">
            <div className="text-2xl font-bold">{counts.assembly}</div>
            <div className="text-white/70 text-xs">Assembly</div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/checklist"
          className="group bg-white border border-ca-dark/10 rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-shadow"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-ca-blue/10 text-ca-blue flex items-center justify-center flex-shrink-0 group-hover:bg-ca-blue group-hover:text-white transition-colors">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="font-bold text-ca-dark text-lg">Visit Checklist</div>
              <div className="text-sm text-ca-dark/60 mt-0.5">
                Track visits and take notes — auto-saves as you type
              </div>
            </div>
          </div>
        </Link>

        <Link
          href="/directory"
          className="group bg-white border border-ca-dark/10 rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-shadow"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-ca-gold/20 text-ca-dark flex items-center justify-center flex-shrink-0 group-hover:bg-ca-gold transition-colors">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="font-bold text-ca-dark text-lg">Legislator Directory</div>
              <div className="text-sm text-ca-dark/60 mt-0.5">
                Search all 120 legislators — capitol rooms, phones, committees
              </div>
            </div>
          </div>
        </Link>
      </div>

      <div className="bg-white border border-ca-dark/10 rounded-2xl p-5 shadow-card">
        <h2 className="font-semibold text-ca-dark mb-2">How this works</h2>
        <ol className="space-y-2 text-sm text-ca-dark/70">
          <li className="flex gap-3">
            <span className="w-5 h-5 rounded-full bg-ca-blue/10 text-ca-blue text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
            <span>Head to the <strong>Checklist</strong> to see every legislator. Tap a name to see their capitol room, phone, and committees.</span>
          </li>
          <li className="flex gap-3">
            <span className="w-5 h-5 rounded-full bg-ca-blue/10 text-ca-blue text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
            <span>After each visit, check the boxes and jot notes. Use your phone&apos;s voice-to-text if easier — anything you type or dictate saves automatically.</span>
          </li>
          <li className="flex gap-3">
            <span className="w-5 h-5 rounded-full bg-ca-blue/10 text-ca-blue text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
            <span>No send button. When you&apos;re done, just close the app. Government Relations will pick up everything you captured.</span>
          </li>
        </ol>
      </div>
    </div>
  );
}
