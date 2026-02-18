"use client";

import { useCallback, useEffect, useState } from "react";
import { getJson, postJson } from "@/lib/clientApi";
import type { Task, TaskStatus } from "@/lib/types";
import { ModeBadge } from "./ModeBadge";

const TASK_STATUSES: TaskStatus[] = [
  "backlog",
  "ready",
  "in_progress",
  "blocked",
  "done",
  "archived",
];

export function TasksBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [mode, setMode] = useState<"convex" | "mock">("mock");
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [ownerId, setOwnerId] = useState("thupten");
  const [priority, setPriority] = useState<Task["priority"]>("medium");

  const loadTasks = useCallback(async () => {
    try {
      const response = await getJson<Task[]>("/api/mission-control/tasks");
      setMode(response.mode);
      setTasks(response.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadTasks();
  }, [loadTasks]);

  const onCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) return;

    try {
      const response = await postJson<Task>("/api/mission-control/tasks", {
        title: title.trim(),
        ownerType: "user",
        ownerId: ownerId.trim() || "thupten",
        priority,
      });
      setMode(response.mode);
      setTitle("");
      await loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    }
  };

  const onTransition = async (taskId: string, nextStatus: TaskStatus) => {
    try {
      const response = await postJson<Task>(
        `/api/mission-control/tasks/${taskId}/transition`,
        {
          nextStatus,
          reopenedReason:
            nextStatus === "in_progress" ? "Resuming execution" : undefined,
        },
      );
      setMode(response.mode);
      await loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to transition task");
    }
  };

  return (
    <section className="screen">
      <div className="screen__header">
        <div>
          <h1>Tasks</h1>
          <p>Track task ownership and state transitions in real time.</p>
        </div>
        <ModeBadge mode={mode} />
      </div>

      <form className="panel form" onSubmit={onCreate}>
        <h2>Create task</h2>
        <label>
          Title
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Add task title"
          />
        </label>
        <label>
          Owner ID
          <input
            value={ownerId}
            onChange={(event) => setOwnerId(event.target.value)}
            placeholder="thupten"
          />
        </label>
        <label>
          Priority
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value as Task["priority"])}
          >
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
          </select>
        </label>
        <button type="submit">Create task</button>
      </form>

      {error ? <p className="error">{error}</p> : null}

      <div className="grid-list">
        {tasks.map((task) => (
          <article key={task.taskId} className="card">
            <header>
              <h3>{task.title}</h3>
              <span className="chip">{task.status}</span>
            </header>
            <p>{task.description || "No description"}</p>
            <p className="meta">
              Owner: {task.ownerType} / {task.ownerId} | Priority: {task.priority}
            </p>
            <div className="card__actions">
              {TASK_STATUSES.map((status) => (
                <button
                  key={status}
                  type="button"
                  disabled={status === task.status}
                  onClick={() => void onTransition(task.taskId, status)}
                >
                  {status}
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
