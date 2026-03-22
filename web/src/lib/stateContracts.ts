import type { TaskStatus } from "./types";

const ALLOWED_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  backlog: ["ready", "in_progress", "archived"],
  ready: ["in_progress", "blocked", "archived"],
  in_progress: ["blocked", "done", "archived"],
  blocked: ["ready", "in_progress", "archived"],
  done: ["in_progress"],
  archived: [],
};

export function canTransitionTask(
  from: TaskStatus,
  to: TaskStatus,
  reopenedReason?: string,
): boolean {
  if (from === to) {
    return true;
  }
  if (from === "done" && to === "in_progress") {
    return Boolean(reopenedReason && reopenedReason.trim());
  }
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function requireTaskTransition(
  from: TaskStatus,
  to: TaskStatus,
  reopenedReason?: string,
): void {
  if (!canTransitionTask(from, to, reopenedReason)) {
    throw new Error(`Invalid task transition: ${from} -> ${to}`);
  }
}

export function taskIsTerminal(status: TaskStatus): boolean {
  return status === "done" || status === "archived";
}

export const TASK_STATUSES: TaskStatus[] = [
  "backlog",
  "ready",
  "in_progress",
  "blocked",
  "done",
  "archived",
];
