"use client";

import { useCallback, useEffect, useState } from "react";
import { getJson } from "@/lib/clientApi";
import type { ActivityItem } from "@/lib/types";
import { ModeBadge } from "./ModeBadge";

export function ActivityFeed() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [mode, setMode] = useState<"convex" | "mock">("mock");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await getJson<ActivityItem[]>(
        "/api/mission-control/activity",
      );
      setMode(response.mode);
      setItems(response.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load activity");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  return (
    <section className="screen">
      <div className="screen__header">
        <div>
          <h1>Activity Log</h1>
          <p>Immutable timeline of task, job, and memory mutations.</p>
        </div>
        <ModeBadge mode={mode} />
      </div>

      {error ? <p className="error">{error}</p> : null}

      <div className="grid-list">
        {items.map((item) => (
          <article key={item.activityId} className="card">
            <header>
              <h3>{item.entityType}</h3>
              <span className="chip">{item.action}</span>
            </header>
            <p className="meta">Entity ID: {item.entityId}</p>
            <p className="meta">
              Actor: {item.actorType} / {item.actorId} ({item.authSource})
            </p>
            <p className="meta">At: {new Date(item.createdAt).toLocaleString()}</p>
            {item.metadataJson ? <pre>{item.metadataJson}</pre> : null}
          </article>
        ))}
      </div>
    </section>
  );
}
