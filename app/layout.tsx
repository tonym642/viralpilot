import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ViralPilot",
  description: "AI-powered content strategy platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body>
        <nav className="vp-topbar">
          <Link href="/projects" className="vp-brand">
            <div className="vp-brand-mark">V</div>
            <span className="vp-brand-text">ViralPilot</span>
          </Link>
          <div className="vp-topbar-right">
            <div className="vp-avatar" title="Settings">⚙</div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
