import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import MobileNav from "@/src/components/MobileNav";
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
        <MobileNav />
        <div className="vp-app-layout">
          {/* Sidebar */}
          <aside className="vp-sidebar">
            <Link href="/projects" className="vp-sidebar-brand">
              <img src="/logo-light.png" alt="ViralPilot" style={{ height: '44px', width: 'auto' }} />
            </Link>
            <ul className="vp-sidebar-nav">
              <li>
                <Link href="/projects" className="active">
                  <span className="vp-sidebar-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                  </span>
                  All
                </Link>
              </li>
              <li>
                <Link href="/projects?mode=Music">
                  <span className="vp-sidebar-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
                  </span>
                  Music
                </Link>
              </li>
              <li>
                <Link href="/projects?mode=Athlete">
                  <span className="vp-sidebar-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="3" /><path d="M6.5 8a2 2 0 0 0-1.905 1.46L2.1 18.23A2 2 0 0 0 4 21h16a2 2 0 0 0 1.9-2.77l-2.49-8.77A2 2 0 0 0 17.5 8z" /><path d="m12 10 0 4" /><path d="m9 21 3-7 3 7" /></svg>
                  </span>
                  Athletes
                </Link>
              </li>
            </ul>
          </aside>

          {/* Main area */}
          <div className="vp-main-area">
            <nav className="vp-topbar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="vp-brand-text">ViralPilot</span>
              </div>
              <div className="vp-topbar-right">
                <div className="vp-avatar" title="Settings">⚙</div>
              </div>
            </nav>
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
