"use client";

import { useMemo, useState } from "react";
import {
  CONTENT_PIPELINE_SEED,
  CONTENT_STAGES,
  CONTENT_STAGE_LABELS,
} from "@/lib/articleSeeds";
import type { ContentItem, ContentStage } from "@/lib/types";
import { usePersistentState } from "@/lib/usePersistentState";

const STORAGE_KEY = "mission-control-content-pipeline-v1";

function nowIso(): string {
  return new Date().toISOString();
}

function nextStage(current: ContentStage): ContentStage {
  const index = CONTENT_STAGES.indexOf(current);
  if (index < 0 || index >= CONTENT_STAGES.length - 1) {
    return current;
  }
  return CONTENT_STAGES[index + 1];
}

export function ContentPipelineBoard() {
  const [items, setItems] = usePersistentState<ContentItem[]>(
    STORAGE_KEY,
    CONTENT_PIPELINE_SEED,
  );
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");

  const grouped = useMemo(() => {
    return CONTENT_STAGES.map((stage) => ({
      stage,
      items: items
        .filter((item) => item.stage === stage)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    }));
  }, [items]);

  const onCreate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) return;
    const ts = nowIso();
    const next: ContentItem = {
      contentId: `content_${crypto.randomUUID()}`,
      title: title.trim(),
      notes: notes.trim(),
      stage: "idea",
      createdAt: ts,
      updatedAt: ts,
    };
    setItems((current) => [next, ...current]);
    setTitle("");
    setNotes("");
  };

  const onMove = (contentId: string, stage: ContentStage) => {
    setItems((current) =>
      current.map((item) =>
        item.contentId === contentId ? { ...item, stage, updatedAt: nowIso() } : item,
      ),
    );
  };

  const onPatch = (contentId: string, patch: Partial<ContentItem>) => {
    setItems((current) =>
      current.map((item) =>
        item.contentId === contentId
          ? { ...item, ...patch, updatedAt: nowIso() }
          : item,
      ),
    );
  };

  return (
    <section className="screen">
      <div className="screen__header">
        <div>
          <h1>Content Pipeline</h1>
          <p>
            Keep ideas, scripts, thumbnail notes, and filming queue in one stage
            board.
          </p>
        </div>
      </div>

      <form className="panel form" onSubmit={onCreate}>
        <h2>Add content item</h2>
        <label>
          Content title
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="New video idea"
          />
        </label>
        <label>
          Notes or draft script
          <textarea
            rows={3}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Outline, hook, or full script draft"
          />
        </label>
        <button type="submit">Add to pipeline</button>
      </form>

      <div className="kanban-grid">
        {grouped.map((column) => (
          <section key={column.stage} className="panel kanban-column">
            <header className="kanban-column__header">
              <h2>{CONTENT_STAGE_LABELS[column.stage]}</h2>
              <span className="chip">{column.items.length}</span>
            </header>
            <div className="kanban-column__body">
              {column.items.map((item) => (
                <article key={item.contentId} className="card">
                  <h3>{item.title}</h3>
                  <label>
                    Notes
                    <textarea
                      rows={3}
                      value={item.notes}
                      onChange={(event) =>
                        onPatch(item.contentId, { notes: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    Image URL (optional)
                    <input
                      value={item.imageUrl || ""}
                      onChange={(event) =>
                        onPatch(item.contentId, {
                          imageUrl: event.target.value.trim() || undefined,
                        })
                      }
                      placeholder="https://..."
                    />
                  </label>
                  {item.imageUrl ? (
                    <a href={item.imageUrl} target="_blank" rel="noreferrer">
                      Open attached image
                    </a>
                  ) : null}
                  <div className="card__actions">
                    <button
                      type="button"
                      onClick={() => onMove(item.contentId, nextStage(item.stage))}
                      disabled={item.stage === "published"}
                    >
                      Move to next stage
                    </button>
                    <select
                      value={item.stage}
                      onChange={(event) =>
                        onMove(item.contentId, event.target.value as ContentStage)
                      }
                    >
                      {CONTENT_STAGES.map((stage) => (
                        <option key={stage} value={stage}>
                          {CONTENT_STAGE_LABELS[stage]}
                        </option>
                      ))}
                    </select>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
