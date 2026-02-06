"use client";

import { getClientOrgs } from "@/lib/data";
import { QRCodeSVG } from "qrcode.react";

const BASE_URL = "https://lobby.downrangerelations.com";

export default function QRPage() {
  const orgs = getClientOrgs();

  return (
    <div className="space-y-6">
      <div className="no-print">
        <h1 className="text-2xl font-bold text-gray-800">QR Codes</h1>
        <p className="text-gray-500 text-sm mt-1">
          Print these QR codes for each organization. Scanning opens the Lobby
          Day Companion pre-set for that org.
        </p>
        <button
          onClick={() => window.print()}
          className="mt-3 bg-primary-700 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary-800 transition-colors"
        >
          Print All QR Codes
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {orgs.map((org) => {
          const url = `${BASE_URL}/?org=${org.key}`;
          return (
            <div
              key={org.key}
              className="border border-gray-200 rounded-xl p-6 text-center print-break"
            >
              <h2 className="text-xl font-bold text-primary-700 mb-1">
                {org.key}
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                {org.display_name}
              </p>
              <div className="flex justify-center mb-4">
                <QRCodeSVG
                  value={url}
                  size={200}
                  level="M"
                  includeMargin
                  bgColor="#ffffff"
                  fgColor="#1e40af"
                />
              </div>
              <p className="text-xs text-gray-400 break-all">{url}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
