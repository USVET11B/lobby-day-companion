import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lobby Day Companion",
  description:
    "Mobile companion app for California veteran legislative advocacy lobby days. Directory, visit tracking, and organization info.",
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
  themeColor: "#1e40af",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="antialiased min-h-screen bg-white text-gray-900">
        <nav className="bg-primary-700 text-white sticky top-0 z-50 no-print">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <a href="/" className="font-bold text-lg tracking-tight">
              Lobby Day Companion
            </a>
            <div className="flex gap-4 text-sm">
              <a
                href="/directory"
                className="hover:text-primary-200 transition-colors"
              >
                Directory
              </a>
              <a
                href="/checklist"
                className="hover:text-primary-200 transition-colors"
              >
                Checklist
              </a>
              <a
                href="/qr"
                className="hover:text-primary-200 transition-colors"
              >
                QR
              </a>
            </div>
          </div>
        </nav>
        <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
