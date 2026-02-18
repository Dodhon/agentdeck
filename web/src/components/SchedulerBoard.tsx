"use client";

import { useCallback, useEffect, useState } from "react";
import { getJson, postJson } from "@/lib/clientApi";
import type { Job, JobRun } from "@/lib/types";
import { ModeBadge } from "./ModeBadge";

type JobWithLatestRun = Job & { latestRun?: JobRun };

export function SchedulerBoard() {
  const [jobs, setJobs] = useState<JobWithLatestRun[]>([]);
  const [mode, setMode] = useState<"convex" | "mock">("mock");
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("Daily operator digest");
  const [scheduleExpr, setScheduleExpr] = useState("0 9 * * 1-5");
  const [scheduleKind, setScheduleKind] = useState<Job["scheduleKind"]>("recurring");

  const loadJobs = useCallback(async () => {
    try {
      const response = await getJson<JobWithLatestRun[]>(
        "/api/mission-control/jobs",
      );
      setMode(response.mode);
      setJobs(response.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load jobs");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadJobs();
  }, [loadJobs]);

  const onCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const response = await postJson<Job>("/api/mission-control/jobs", {
        name,
        scheduleKind,
        scheduleExpr,
        timezone: "America/Chicago",
        payloadKind: "agentdeck.task",
        payloadJson: JSON.stringify({ command: "refresh" }),
      });
      setMode(response.mode);
      await loadJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create job");
    }
  };

  const onRunNow = async (jobId: string) => {
    try {
      const response = await postJson<JobRun>(
        `/api/mission-control/jobs/${jobId}/run-now`,
        {},
      );
      setMode(response.mode);
      await loadJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run job");
    }
  };

  const onToggle = async (job: JobWithLatestRun) => {
    try {
      const response = await postJson<Job>(
        `/api/mission-control/jobs/${job.jobId}/enabled`,
        {
          enabled: !job.enabled,
        },
      );
      setMode(response.mode);
      await loadJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle job");
    }
  };

  return (
    <section className="screen">
      <div className="screen__header">
        <div>
          <h1>Scheduler</h1>
          <p>Inspect recurring jobs, trigger runs, and track latest outcomes.</p>
        </div>
        <ModeBadge mode={mode} />
      </div>

      <form className="panel form" onSubmit={onCreate}>
        <h2>Create scheduler job</h2>
        <label>
          Job name
          <input value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label>
          Schedule kind
          <select
            value={scheduleKind}
            onChange={(event) => setScheduleKind(event.target.value as Job["scheduleKind"])}
          >
            <option value="recurring">recurring</option>
            <option value="one_shot">one_shot</option>
          </select>
        </label>
        <label>
          Schedule expression
          <input
            value={scheduleExpr}
            onChange={(event) => setScheduleExpr(event.target.value)}
          />
        </label>
        <button type="submit">Create job</button>
      </form>

      {error ? <p className="error">{error}</p> : null}

      <div className="grid-list">
        {jobs.map((job) => (
          <article key={job.jobId} className="card">
            <header>
              <h3>{job.name}</h3>
              <span className={`chip ${job.enabled ? "chip--active" : "chip--idle"}`}>
                {job.enabled ? "enabled" : "paused"}
              </span>
            </header>
            <p className="meta">
              {job.scheduleKind} | {job.scheduleExpr} | TZ: {job.timezone}
            </p>
            <p className="meta">
              Last run: {job.latestRun?.status || "none"}
              {job.latestRun ? ` (attempt ${job.latestRun.attempt})` : ""}
            </p>
            <div className="card__actions">
              <button type="button" onClick={() => void onRunNow(job.jobId)}>
                Run now
              </button>
              <button type="button" onClick={() => void onToggle(job)}>
                {job.enabled ? "Pause" : "Resume"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
