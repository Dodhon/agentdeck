import crypto from "node:crypto";
import {
  ingestKey,
  schedulerRunKey,
} from "./idempotency";
import { requireTaskTransition } from "./stateContracts";
import type {
  ActivityItem,
  ActorContext,
  Job,
  JobRun,
  MemoryChunk,
  MemoryDoc,
  MemorySearchResult,
  Task,
  TaskEvent,
  TaskStatus,
} from "./types";

interface StoreState {
  tasks: Task[];
  taskEvents: TaskEvent[];
  jobs: Job[];
  jobRuns: JobRun[];
  memoryDocs: MemoryDoc[];
  memoryChunks: MemoryChunk[];
  activity: ActivityItem[];
}

function nowIso(): string {
  return new Date().toISOString();
}

function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

function buildInitialState(): StoreState {
  const ts = nowIso();

  const tasks: Task[] = [
    {
      taskId: "task_seed_1",
      title: "Finalize Mission Control v1 scope",
      description: "Lock Tasks, Scheduler, Memory, and Activity for phase 1.",
      ownerType: "user",
      ownerId: "thupten",
      status: "in_progress",
      priority: "high",
      createdAt: ts,
      updatedAt: ts,
    },
    {
      taskId: "task_seed_2",
      title: "Wire UI verification gates",
      description: "Ensure Playwright and browser smoke are mandatory for UI changes.",
      ownerType: "agent",
      ownerId: "clawd",
      status: "ready",
      priority: "medium",
      createdAt: ts,
      updatedAt: ts,
    },
  ];

  const jobs: Job[] = [
    {
      jobId: "job_seed_1",
      name: "Daily memory refresh",
      scheduleKind: "recurring",
      scheduleExpr: "0 9 * * 1-5",
      timezone: "America/Chicago",
      payloadKind: "memory.sync",
      payloadJson: JSON.stringify({ target: "daily_memory" }),
      enabled: true,
      nextRunAt: ts,
      createdAt: ts,
      updatedAt: ts,
    },
  ];

  const body =
    "Mission Control centralizes tasks, scheduling, and memory retrieval. " +
    "Every memory result should include a source citation for trust.";
  const checksum = crypto.createHash("sha256").update(body).digest("hex");
  const docId = "doc_seed_1";

  const memoryDocs: MemoryDoc[] = [
    {
      docId,
      sourcePath: "memory_notes/MEMORY.md",
      sourceType: "markdown",
      title: "Mission Control notes",
      ingestStatus: "indexed",
      checksum,
      ingestKey: ingestKey({ sourcePath: "memory_notes/MEMORY.md", checksum }),
      body,
      createdAt: ts,
      updatedAt: ts,
    },
  ];

  const memoryChunks: MemoryChunk[] = [
    {
      chunkId: "chunk_seed_1",
      docId,
      chunkIndex: 0,
      text: body,
      tokenCount: body.split(/\s+/).length,
      createdAt: ts,
    },
  ];

  return {
    tasks,
    taskEvents: [],
    jobs,
    jobRuns: [],
    memoryDocs,
    memoryChunks,
    activity: [],
  };
}

let store: StoreState = buildInitialState();

export function resetMockStore(): void {
  store = buildInitialState();
}

function recordActivity(
  entityType: string,
  entityId: string,
  action: string,
  actor: ActorContext,
  metadata?: unknown,
): void {
  store.activity.push({
    activityId: newId("activity"),
    entityType,
    entityId,
    action,
    actorType: actor.actorType,
    actorId: actor.actorId,
    authSource: actor.authSource,
    metadataJson: metadata ? JSON.stringify(metadata) : undefined,
    createdAt: nowIso(),
  });
}

function recordTaskEvent(
  taskId: string,
  eventType: string,
  actor: ActorContext,
  beforeState?: unknown,
  afterState?: unknown,
): void {
  store.taskEvents.push({
    taskId,
    eventType,
    actorType: actor.actorType,
    actorId: actor.actorId,
    authSource: actor.authSource,
    beforeJson: beforeState ? JSON.stringify(beforeState) : undefined,
    afterJson: afterState ? JSON.stringify(afterState) : undefined,
    createdAt: nowIso(),
  });
}

export async function listTasks(): Promise<Task[]> {
  return [...store.tasks].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function createTask(
  actor: ActorContext,
  input: {
    title: string;
    description?: string;
    ownerType: Task["ownerType"];
    ownerId: string;
    priority: Task["priority"];
    status?: TaskStatus;
    dueAt?: string;
  },
): Promise<Task> {
  const ts = nowIso();
  const task: Task = {
    taskId: newId("task"),
    title: input.title,
    description: input.description,
    ownerType: input.ownerType,
    ownerId: input.ownerId,
    status: input.status || "backlog",
    priority: input.priority,
    dueAt: input.dueAt,
    createdAt: ts,
    updatedAt: ts,
  };

  store.tasks.push(task);
  recordTaskEvent(task.taskId, "task.created", actor, undefined, task);
  recordActivity("task", task.taskId, "created", actor, { title: task.title });
  return task;
}

export async function transitionTask(
  actor: ActorContext,
  taskId: string,
  nextStatus: TaskStatus,
  reopenedReason?: string,
): Promise<Task> {
  const task = store.tasks.find((entry) => entry.taskId === taskId);
  if (!task) {
    throw new Error(`Task not found: ${taskId}`);
  }

  requireTaskTransition(task.status, nextStatus, reopenedReason);

  const before = { ...task };
  task.status = nextStatus;
  task.updatedAt = nowIso();
  task.archivedAt = nextStatus === "archived" ? task.updatedAt : undefined;

  recordTaskEvent(task.taskId, "task.transitioned", actor, before, task);
  recordActivity("task", task.taskId, "transitioned", actor, {
    from: before.status,
    to: task.status,
    reopenedReason,
  });

  return task;
}

export async function listJobs(): Promise<Array<Job & { latestRun?: JobRun }>> {
  return [...store.jobs]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((job) => {
      const latestRun = [...store.jobRuns]
        .filter((run) => run.jobId === job.jobId)
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
      return {
        ...job,
        latestRun,
      };
    });
}

export async function createJob(
  actor: ActorContext,
  input: {
    name: string;
    scheduleKind: Job["scheduleKind"];
    scheduleExpr: string;
    timezone: string;
    payloadKind: string;
    payloadJson: string;
  },
): Promise<Job> {
  const ts = nowIso();
  const job: Job = {
    jobId: newId("job"),
    name: input.name,
    scheduleKind: input.scheduleKind,
    scheduleExpr: input.scheduleExpr,
    timezone: input.timezone,
    payloadKind: input.payloadKind,
    payloadJson: input.payloadJson,
    enabled: true,
    nextRunAt: ts,
    createdAt: ts,
    updatedAt: ts,
  };

  store.jobs.push(job);
  recordActivity("job", job.jobId, "created", actor, {
    name: job.name,
    scheduleExpr: job.scheduleExpr,
  });
  return job;
}

export async function setJobEnabled(
  actor: ActorContext,
  jobId: string,
  enabled: boolean,
): Promise<Job> {
  const job = store.jobs.find((entry) => entry.jobId === jobId);
  if (!job) {
    throw new Error(`Job not found: ${jobId}`);
  }
  job.enabled = enabled;
  job.updatedAt = nowIso();
  recordActivity("job", job.jobId, enabled ? "enabled" : "disabled", actor, {
    enabled,
  });
  return job;
}

export async function runJobNow(
  actor: ActorContext,
  jobId: string,
  options?: { idempotencyKey?: string; scheduledForIso?: string },
): Promise<JobRun> {
  const job = store.jobs.find((entry) => entry.jobId === jobId);
  if (!job) {
    throw new Error(`Job not found: ${jobId}`);
  }

  const priorRuns = store.jobRuns
    .filter((run) => run.jobId === jobId)
    .sort((a, b) => b.attempt - a.attempt);
  const attempt = (priorRuns[0]?.attempt || 0) + 1;
  const scheduledForIso = options?.scheduledForIso || nowIso();
  const runKey =
    options?.idempotencyKey ||
    schedulerRunKey({
      jobId,
      scheduledForIso,
      attempt,
    });

  const existing = store.jobRuns.find((run) => run.idempotencyKey === runKey);
  if (existing) {
    return existing;
  }

  const startedAt = nowIso();
  const finishedAt = nowIso();
  const run: JobRun = {
    runId: newId("run"),
    jobId,
    attempt,
    idempotencyKey: runKey,
    startedAt,
    endedAt: finishedAt,
    status: "success",
    summary: "Job executed in mock store.",
    createdAt: startedAt,
  };

  store.jobRuns.push(run);
  job.lastRunAt = finishedAt;
  job.nextRunAt = nowIso();
  job.updatedAt = finishedAt;

  recordActivity("job", job.jobId, "run_now", actor, {
    runId: run.runId,
    idempotencyKey: run.idempotencyKey,
    attempt,
  });

  return run;
}

function buildChunks(docId: string, body: string): MemoryChunk[] {
  const chunkSize = 260;
  const chunks: MemoryChunk[] = [];
  for (let i = 0; i < body.length; i += chunkSize) {
    const text = body.slice(i, i + chunkSize);
    chunks.push({
      chunkId: newId("chunk"),
      docId,
      chunkIndex: chunks.length,
      text,
      tokenCount: text.split(/\s+/).filter(Boolean).length,
      createdAt: nowIso(),
    });
  }
  return chunks;
}

export async function ingestMemory(
  actor: ActorContext,
  input: {
    sourcePath: string;
    sourceType: string;
    title: string;
    body: string;
  },
): Promise<MemoryDoc> {
  const checksum = crypto.createHash("sha256").update(input.body).digest("hex");
  const key = ingestKey({ sourcePath: input.sourcePath, checksum });

  const existing = store.memoryDocs.find((doc) => doc.ingestKey === key);
  if (existing) {
    return existing;
  }

  const ts = nowIso();
  const docId = newId("doc");
  const doc: MemoryDoc = {
    docId,
    sourcePath: input.sourcePath,
    sourceType: input.sourceType,
    title: input.title,
    ingestStatus: "indexed",
    checksum,
    ingestKey: key,
    body: input.body,
    createdAt: ts,
    updatedAt: ts,
  };

  const chunks = buildChunks(doc.docId, input.body);

  store.memoryDocs.push(doc);
  store.memoryChunks.push(...chunks);

  recordActivity("memory", doc.docId, "ingested", actor, {
    sourcePath: doc.sourcePath,
    chunkCount: chunks.length,
    ingestKey: doc.ingestKey,
  });

  return doc;
}

export async function searchMemory(query: string): Promise<MemorySearchResult[]> {
  const normalized = query.trim().toLowerCase();
  const chunks = store.memoryChunks;

  const scored = chunks
    .map((chunk) => {
      const textLower = chunk.text.toLowerCase();
      const hasMatch = normalized.length === 0 || textLower.includes(normalized);
      if (!hasMatch) {
        return null;
      }
      const doc = store.memoryDocs.find((entry) => entry.docId === chunk.docId);
      if (!doc) {
        return null;
      }
      const hitCount = normalized
        ? textLower.split(normalized).length - 1
        : 1;
      const snippet =
        normalized.length === 0
          ? chunk.text.slice(0, 180)
          : chunk.text.slice(
              Math.max(0, textLower.indexOf(normalized) - 40),
              textLower.indexOf(normalized) + normalized.length + 140,
            );
      return {
        docId: doc.docId,
        sourcePath: doc.sourcePath,
        title: doc.title,
        snippet,
        score: hitCount,
      } satisfies MemorySearchResult;
    })
    .filter((entry): entry is MemorySearchResult => Boolean(entry));

  const bestByDoc = new Map<string, MemorySearchResult>();
  scored.forEach((entry) => {
    const current = bestByDoc.get(entry.docId);
    if (!current || entry.score > current.score) {
      bestByDoc.set(entry.docId, entry);
    }
  });

  return [...bestByDoc.values()].sort((a, b) => b.score - a.score).slice(0, 25);
}

export async function listActivity(): Promise<ActivityItem[]> {
  return [...store.activity].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getStoreForTests(): StoreState {
  return store;
}
