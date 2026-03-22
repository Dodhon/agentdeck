import Link from "next/link";

const cards = [
  {
    href: "/tasks",
    title: "Tasks Board",
    body: "Track task ownership and real-time status for both you and OpenClaw.",
  },
  {
    href: "/content-pipeline",
    title: "Content Pipeline",
    body: "Move ideas through script, thumbnail, and filming stages.",
  },
  {
    href: "/calendar",
    title: "Calendar",
    body: "Review all scheduled tasks and cron jobs in one place.",
  },
  {
    href: "/memory",
    title: "Memory",
    body: "Search memory logs with source-cited snippets and ingest new notes.",
  },
  {
    href: "/team",
    title: "Team",
    body: "Define subagents by role, ownership, and responsibilities.",
  },
  {
    href: "/office",
    title: "Office",
    body: "View agent work status and focus in a digital office layout.",
  },
  {
    href: "/activity",
    title: "Activity Log",
    body: "Audit timeline for every mutation across tasks, jobs, and memory.",
  },
];

export default function Home() {
  return (
    <section className="screen">
      <div className="screen__header">
        <div>
          <h1>OpenClaw Mission Control</h1>
          <p>
            Next.js + Convex control center aligned to tasks, pipeline, calendar,
            memory, team, and office workflows.
          </p>
        </div>
      </div>

      <div className="grid-list">
        {cards.map((card) => (
          <Link href={card.href} key={card.href} className="card card--link">
            <h2>{card.title}</h2>
            <p>{card.body}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
