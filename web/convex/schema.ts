import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const taskStatus = v.union(
  v.literal("backlog"),
  v.literal("ready"),
  v.literal("in_progress"),
  v.literal("blocked"),
  v.literal("done"),
  v.literal("archived"),
);

const jobRunStatus = v.union(
  v.literal("queued"),
  v.literal("running"),
  v.literal("success"),
  v.literal("failed"),
  v.literal("timeout"),
  v.literal("canceled"),
);

const ingestStatus = v.union(
  v.literal("discovered"),
  v.literal("indexing"),
  v.literal("indexed"),
  v.literal("ingest_failed"),
);

export default defineSchema({
  tasks: defineTable({
    taskId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    ownerType: v.union(v.literal("user"), v.literal("agent"), v.literal("system")),
    ownerId: v.string(),
    status: taskStatus,
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    dueAt: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
    archivedAt: v.optional(v.string()),
  })
    .index("by_taskId", ["taskId"])
    .index("by_status_updatedAt", ["status", "updatedAt"]),

  taskEvents: defineTable({
    taskId: v.string(),
    eventType: v.string(),
    actorType: v.union(v.literal("user"), v.literal("agent"), v.literal("system")),
    actorId: v.string(),
    authSource: v.union(v.literal("convex_user"), v.literal("internal_system")),
    beforeJson: v.optional(v.string()),
    afterJson: v.optional(v.string()),
    createdAt: v.string(),
  }).index("by_taskId_createdAt", ["taskId", "createdAt"]),

  jobs: defineTable({
    jobId: v.string(),
    name: v.string(),
    scheduleKind: v.union(v.literal("one_shot"), v.literal("recurring")),
    scheduleExpr: v.string(),
    timezone: v.string(),
    payloadKind: v.string(),
    payloadJson: v.string(),
    enabled: v.boolean(),
    nextRunAt: v.optional(v.string()),
    lastRunAt: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_jobId", ["jobId"])
    .index("by_enabled_nextRunAt", ["enabled", "nextRunAt"]),

  jobRuns: defineTable({
    jobId: v.string(),
    attempt: v.number(),
    idempotencyKey: v.string(),
    startedAt: v.string(),
    endedAt: v.optional(v.string()),
    status: jobRunStatus,
    summary: v.optional(v.string()),
    error: v.optional(v.string()),
    createdAt: v.string(),
  })
    .index("by_jobId_attempt", ["jobId", "attempt"])
    .index("by_idempotencyKey", ["idempotencyKey"]),

  memoryDocs: defineTable({
    docId: v.string(),
    sourcePath: v.string(),
    sourceType: v.string(),
    title: v.string(),
    ingestStatus,
    checksum: v.string(),
    ingestKey: v.string(),
    body: v.string(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_docId", ["docId"])
    .index("by_ingestKey", ["ingestKey"]),

  memoryChunks: defineTable({
    docId: v.string(),
    chunkIndex: v.number(),
    text: v.string(),
    tokenCount: v.number(),
    createdAt: v.string(),
  }).index("by_docId_chunkIndex", ["docId", "chunkIndex"]),

  activityLog: defineTable({
    entityType: v.string(),
    entityId: v.string(),
    action: v.string(),
    actorType: v.union(v.literal("user"), v.literal("agent"), v.literal("system")),
    actorId: v.string(),
    authSource: v.union(v.literal("convex_user"), v.literal("internal_system")),
    metadataJson: v.optional(v.string()),
    createdAt: v.string(),
  }).index("by_createdAt", ["createdAt"]),
});
