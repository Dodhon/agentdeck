export type TaskStatus =
  | "backlog"
  | "ready"
  | "in_progress"
  | "blocked"
  | "done"
  | "archived";

export type JobRunStatus =
  | "queued"
  | "running"
  | "success"
  | "failed"
  | "timeout"
  | "canceled";

export type OwnerType = "user" | "agent" | "system";

export interface ActorContext {
  actorType: OwnerType;
  actorId: string;
  authSource: "convex_user" | "internal_system";
}

export interface Task {
  taskId: string;
  title: string;
  description?: string;
  ownerType: OwnerType;
  ownerId: string;
  status: TaskStatus;
  priority: "low" | "medium" | "high";
  dueAt?: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

export interface TaskEvent {
  taskId: string;
  eventType: string;
  actorType: OwnerType;
  actorId: string;
  authSource: "convex_user" | "internal_system";
  beforeJson?: string;
  afterJson?: string;
  createdAt: string;
}

export interface Job {
  jobId: string;
  name: string;
  scheduleKind: "one_shot" | "recurring";
  scheduleExpr: string;
  timezone: string;
  payloadKind: string;
  payloadJson: string;
  enabled: boolean;
  nextRunAt?: string;
  lastRunAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobRun {
  runId: string;
  jobId: string;
  attempt: number;
  idempotencyKey: string;
  startedAt: string;
  endedAt?: string;
  status: JobRunStatus;
  summary?: string;
  error?: string;
  createdAt: string;
}

export interface MemoryDoc {
  docId: string;
  sourcePath: string;
  sourceType: string;
  title: string;
  ingestStatus: "discovered" | "indexing" | "indexed" | "ingest_failed";
  checksum: string;
  ingestKey: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface MemoryChunk {
  chunkId: string;
  docId: string;
  chunkIndex: number;
  text: string;
  tokenCount: number;
  createdAt: string;
}

export interface MemorySearchResult {
  docId: string;
  sourcePath: string;
  title: string;
  snippet: string;
  score: number;
}

export interface ActivityItem {
  activityId: string;
  entityType: string;
  entityId: string;
  action: string;
  actorType: OwnerType;
  actorId: string;
  authSource: "convex_user" | "internal_system";
  metadataJson?: string;
  createdAt: string;
}

export type ContentStage =
  | "idea"
  | "script"
  | "thumbnail"
  | "filming"
  | "published";

export interface ContentItem {
  contentId: string;
  title: string;
  notes: string;
  imageUrl?: string;
  stage: ContentStage;
  createdAt: string;
  updatedAt: string;
}

export type TeamStatus = "planning" | "working" | "idle";

export interface TeamMember {
  memberId: string;
  name: string;
  role: string;
  responsibilities: string;
  currentFocus: string;
  status: TeamStatus;
}
