import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import SessionGate from "@/components/SessionGate";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Lobby Day Companion | Bear Flag Veterans",
  description:
    "California Capitol companion for veteran advocacy lobby days. Directory, visit tracking, and real-time notes.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Lobby Day",
  },
  formatDetection: {
    telephone: true,
    email: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#15294a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-ca-cream text-ca-dark">
        <nav className="bg-ca-dark text-white sticky top-0 z-50 no-print shadow-lg">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
              <div className="w-7 h-7 rounded bg-ca-gold text-ca-dark flex items-center justify-center text-xs font-black">
                BFV
              </div>
              <span className="hidden sm:inline">Lobby Day Companion</span>
              <span className="sm:hidden">Lobby Day</span>
            </Link>
            <div className="flex gap-1 text-sm">
              <Link
                href="/directory"
                className="px-2 sm:px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                Directory
              </Link>
              <Link
                href="/checklist"
                className="px-2 sm:px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                Checklist
              </Link>
            </div>
          </div>
        </nav>
        <main className="max-w-4xl mx-auto px-4 py-6">
          <Suspense fallback={null}>
            <SessionGate>{children}</SessionGate>
          </Suspense>
        </main>
        <footer className="max-w-4xl mx-auto px-4 pb-6 text-center text-xs text-ca-dark/40">
          Bear Flag Veterans · California Veteran Legislative Advocacy
        </footer>
      </body>
    </html>
  );
}
