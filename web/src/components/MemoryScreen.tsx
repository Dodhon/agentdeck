"use client";

import { useCallback, useEffect, useState } from "react";
import { getJson, postJson } from "@/lib/clientApi";
import type { MemoryDoc, MemorySearchResult } from "@/lib/types";
import { ModeBadge } from "./ModeBadge";

export function MemoryScreen() {
  const [mode, setMode] = useState<"convex" | "mock">("mock");
  const [query, setQuery] = useState("Mission Control");
  const [results, setResults] = useState<MemorySearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("Sprint memory note");
  const [sourcePath, setSourcePath] = useState("memory_notes/daily_memory/2026-02-18.md");
  const [body, setBody] = useState(
    "Mission Control should expose source-cited memory search and deterministic run logs.",
  );

  const loadSearch = useCallback(async () => {
    try {
      const url = `/api/mission-control/memory/search?q=${encodeURIComponent(query)}`;
      const response = await getJson<MemorySearchResult[]>(url);
      setMode(response.mode);
      setResults(response.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to search memory");
    }
  }, [query]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadSearch();
  }, [loadSearch]);

  const onIngest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const response = await postJson<MemoryDoc>(
        "/api/mission-control/memory/ingest",
        {
          title,
          sourcePath,
          sourceType: "markdown",
          body,
        },
      );
      setMode(response.mode);
      await loadSearch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to ingest memory");
    }
  };

  return (
    <section className="screen">
      <div className="screen__header">
        <div>
          <h1>Memory</h1>
          <p>Search memory with source citations and ingest new documents.</p>
        </div>
        <ModeBadge mode={mode} />
      </div>

      <form className="panel form" onSubmit={onIngest}>
        <h2>Ingest memory document</h2>
        <label>
          Title
          <input value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label>
          Source path
          <input
            value={sourcePath}
            onChange={(event) => setSourcePath(event.target.value)}
          />
        </label>
        <label>
          Body
          <textarea
            rows={4}
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
        </label>
        <button type="submit">Ingest</button>
      </form>

      <div className="panel form">
        <h2>Search</h2>
        <label>
          Query
          <input value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <button type="button" onClick={() => void loadSearch()}>
          Run search
        </button>
      </div>

      {error ? <p className="error">{error}</p> : null}

      <div className="grid-list">
        {results.map((result) => (
          <article key={`${result.docId}:${result.sourcePath}`} className="card">
            <header>
              <h3>{result.title}</h3>
              <span className="chip">score {result.score}</span>
            </header>
            <p className="meta">{result.sourcePath}</p>
            <p>{result.snippet}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
