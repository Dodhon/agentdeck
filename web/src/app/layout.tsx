import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgentDeck Mission Control",
  description: "Next.js + Convex Mission Control for OpenClaw workflows.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <aside className="shell__sidebar">
            <h1>Mission Control</h1>
            <p>OpenClaw operations runtime</p>
            <nav>
              <Link href="/tasks">Tasks</Link>
              <Link href="/scheduler">Scheduler</Link>
              <Link href="/memory">Memory</Link>
              <Link href="/activity">Activity</Link>
            </nav>
            <Link className="home-link" href="/">
              Overview
            </Link>
          </aside>
          <main className="shell__content">{children}</main>
        </div>
      </body>
    </html>
  );
}
