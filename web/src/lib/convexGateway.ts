import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";
import type {
  ActivityItem,
  Job,
  JobRun,
  MemoryDoc,
  MemorySearchResult,
  Task,
  TaskStatus,
} from "./types";

const api = anyApi;

function convexUrl(): string | null {
  return process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL || null;
}

function getClient(authToken?: string): ConvexHttpClient | null {
  const url = convexUrl();
  if (!url) {
    return null;
  }
  const client = new ConvexHttpClient(url);
  if (authToken) {
    client.setAuth(authToken);
  }
  return client;
}

export async function convexListTasks(
  authToken?: string,
): Promise<Task[] | null> {
  const client = getClient(authToken);
  if (!client) return null;
  return (await client.query(api.tasks.listTasks, {})) as Task[];
}

export async function convexCreateTask(
  input: {
    title: string;
    description?: string;
    ownerType: Task["ownerType"];
    ownerId: string;
    priority: Task["priority"];
    status?: TaskStatus;
    dueAt?: string;
  },
  authToken?: string,
): Promise<Task | null> {
  const client = getClient(authToken);
  if (!client) return null;
  return (await client.mutation(api.tasks.createTask, input)) as Task;
}

export async function convexTransitionTask(
  input: {
    taskId: string;
    nextStatus: TaskStatus;
    reopenedReason?: string;
  },
  authToken?: string,
): Promise<Task | null> {
  const client = getClient(authToken);
  if (!client) return null;
  return (await client.mutation(api.tasks.transitionTask, input)) as Task;
}

export async function convexListJobs(
  authToken?: string,
): Promise<Array<Job & { latestRun?: JobRun }> | null> {
  const client = getClient(authToken);
  if (!client) return null;
  return (await client.query(api.scheduler.listJobs, {})) as Array<
    Job & { latestRun?: JobRun }
  >;
}

export async function convexCreateJob(
  input: {
    name: string;
    scheduleKind: Job["scheduleKind"];
    scheduleExpr: string;
    timezone: string;
    payloadKind: string;
    payloadJson: string;
  },
  authToken?: string,
): Promise<Job | null> {
  const client = getClient(authToken);
  if (!client) return null;
  return (await client.mutation(api.scheduler.createJob, input)) as Job;
}

export async function convexSetJobEnabled(
  input: {
    jobId: string;
    enabled: boolean;
  },
  authToken?: string,
): Promise<Job | null> {
  const client = getClient(authToken);
  if (!client) return null;
  return (await client.mutation(api.scheduler.setJobEnabled, input)) as Job;
}

export async function convexRunJobNow(
  input: {
    jobId: string;
    idempotencyKey?: string;
    scheduledForIso?: string;
  },
  authToken?: string,
): Promise<JobRun | null> {
  const client = getClient(authToken);
  if (!client) return null;
  return (await client.mutation(api.scheduler.runJobNow, input)) as JobRun;
}

export async function convexIngestMemory(
  input: {
    sourcePath: string;
    sourceType: string;
    title: string;
    body: string;
  },
  authToken?: string,
): Promise<MemoryDoc | null> {
  const client = getClient(authToken);
  if (!client) return null;
  return (await client.mutation(api.memory.ingestMemory, input)) as MemoryDoc;
}

export async function convexSearchMemory(
  query: string,
  authToken?: string,
): Promise<MemorySearchResult[] | null> {
  const client = getClient(authToken);
  if (!client) return null;
  return (await client.query(api.memory.searchMemory, { query })) as MemorySearchResult[];
}

export async function convexListActivity(
  authToken?: string,
): Promise<ActivityItem[] | null> {
  const client = getClient(authToken);
  if (!client) return null;
  return (await client.query(api.activity.listActivity, {})) as ActivityItem[];
}

export function isConvexConfigured(): boolean {
  return Boolean(convexUrl());
}
