import {
  convexCreateJob,
  convexCreateTask,
  convexIngestMemory,
  convexListActivity,
  convexListJobs,
  convexListTasks,
  convexRunJobNow,
  convexSearchMemory,
  convexSetJobEnabled,
  convexTransitionTask,
} from "./convexGateway";
import {
  createJob,
  createTask,
  ingestMemory,
  listActivity,
  listJobs,
  listTasks,
  runJobNow,
  searchMemory,
  setJobEnabled,
  transitionTask,
} from "./mockStore";
import type {
  ActivityItem,
  ActorContext,
  Job,
  JobRun,
  MemoryDoc,
  MemorySearchResult,
  Task,
  TaskStatus,
} from "./types";

export type DataMode = "convex" | "mock";

function fallbackActor(actor?: ActorContext): ActorContext {
  if (actor) return actor;
  return {
    actorType: "user",
    actorId: "local_operator",
    authSource: "internal_system",
  };
}

async function withFallback<T>(
  convexCall: () => Promise<T | null>,
  fallback: () => Promise<T>,
): Promise<{ mode: DataMode; data: T }> {
  try {
    const result = await convexCall();
    if (result !== null) {
      return { mode: "convex", data: result };
    }
  } catch {
    // Fall back to mock mode when Convex is unavailable or unauthorized.
  }
  return { mode: "mock", data: await fallback() };
}

export async function getTasks(
  authToken?: string,
): Promise<{ mode: DataMode; data: Task[] }> {
  return withFallback(() => convexListTasks(authToken), () => listTasks());
}

export async function addTask(
  input: {
    title: string;
    description?: string;
    ownerType: Task["ownerType"];
    ownerId: string;
    priority: Task["priority"];
    status?: TaskStatus;
    dueAt?: string;
  },
  actor?: ActorContext,
  authToken?: string,
): Promise<{ mode: DataMode; data: Task }> {
  return withFallback(
    () => convexCreateTask(input, authToken),
    () => createTask(fallbackActor(actor), input),
  );
}

export async function moveTask(
  input: {
    taskId: string;
    nextStatus: TaskStatus;
    reopenedReason?: string;
  },
  actor?: ActorContext,
  authToken?: string,
): Promise<{ mode: DataMode; data: Task }> {
  return withFallback(
    () => convexTransitionTask(input, authToken),
    () => transitionTask(fallbackActor(actor), input.taskId, input.nextStatus, input.reopenedReason),
  );
}

export async function getJobs(
  authToken?: string,
): Promise<{ mode: DataMode; data: Array<Job & { latestRun?: JobRun }> }> {
  return withFallback(() => convexListJobs(authToken), () => listJobs());
}

export async function addJob(
  input: {
    name: string;
    scheduleKind: Job["scheduleKind"];
    scheduleExpr: string;
    timezone: string;
    payloadKind: string;
    payloadJson: string;
  },
  actor?: ActorContext,
  authToken?: string,
): Promise<{ mode: DataMode; data: Job }> {
  return withFallback(
    () => convexCreateJob(input, authToken),
    () => createJob(fallbackActor(actor), input),
  );
}

export async function toggleJob(
  jobId: string,
  enabled: boolean,
  actor?: ActorContext,
  authToken?: string,
): Promise<{ mode: DataMode; data: Job }> {
  return withFallback(
    () => convexSetJobEnabled({ jobId, enabled }, authToken),
    () => setJobEnabled(fallbackActor(actor), jobId, enabled),
  );
}

export async function triggerJob(
  input: {
    jobId: string;
    idempotencyKey?: string;
    scheduledForIso?: string;
  },
  actor?: ActorContext,
  authToken?: string,
): Promise<{ mode: DataMode; data: JobRun }> {
  return withFallback(
    () => convexRunJobNow(input, authToken),
    () => runJobNow(fallbackActor(actor), input.jobId, {
      idempotencyKey: input.idempotencyKey,
      scheduledForIso: input.scheduledForIso,
    }),
  );
}

export async function addMemoryDoc(
  input: {
    sourcePath: string;
    sourceType: string;
    title: string;
    body: string;
  },
  actor?: ActorContext,
  authToken?: string,
): Promise<{ mode: DataMode; data: MemoryDoc }> {
  return withFallback(
    () => convexIngestMemory(input, authToken),
    () => ingestMemory(fallbackActor(actor), input),
  );
}

export async function queryMemory(
  query: string,
  authToken?: string,
): Promise<{ mode: DataMode; data: MemorySearchResult[] }> {
  return withFallback(
    () => convexSearchMemory(query, authToken),
    () => searchMemory(query),
  );
}

export async function getActivity(
  authToken?: string,
): Promise<{ mode: DataMode; data: ActivityItem[] }> {
  return withFallback(() => convexListActivity(authToken), () => listActivity());
}
