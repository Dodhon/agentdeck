import Link from "next/link";

const cards = [
  {
    href: "/tasks",
    title: "Tasks Board",
    body: "Track ownership, priorities, and deterministic task transitions.",
  },
  {
    href: "/scheduler",
    title: "Scheduler",
    body: "Review recurring jobs, run history, and run-now execution.",
  },
  {
    href: "/memory",
    title: "Memory",
    body: "Ingest and search memory with source-cited snippets.",
  },
  {
    href: "/activity",
    title: "Activity",
    body: "Audit timeline for every mutation across entities.",
  },
];

export default function Home() {
  return (
    <section className="screen">
      <div className="screen__header">
        <div>
          <h1>AgentDeck Mission Control v1</h1>
          <p>
            Next.js + Convex implementation lane with deterministic contracts and
            test gates.
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
