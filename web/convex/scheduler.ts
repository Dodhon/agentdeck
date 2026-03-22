import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import { requireConvexUserActor } from "./actors";
import { randomId } from "./utils";

function schedulerRunKey(params: {
  jobId: string;
  scheduledForIso: string;
  attempt: number;
}): string {
  return `run:${params.jobId}:${params.scheduledForIso}:${params.attempt}`;
}

export const listJobs = queryGeneric({
  args: {},
  handler: async (ctx) => {
    const jobs = await ctx.db
      .query("jobs")
      .withIndex("by_enabled_nextRunAt")
      .order("desc")
      .collect();

    const runs = await ctx.db.query("jobRuns").collect();

    return jobs.map((job) => {
      const latestRun = runs
        .filter((run) => run.jobId === job.jobId)
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
      return {
        ...job,
        latestRun,
      };
    });
  },
});

export const createJob = mutationGeneric({
  args: {
    name: v.string(),
    scheduleKind: v.union(v.literal("one_shot"), v.literal("recurring")),
    scheduleExpr: v.string(),
    timezone: v.string(),
    payloadKind: v.string(),
    payloadJson: v.string(),
  },
  handler: async (ctx, args) => {
    const actor = await requireConvexUserActor(ctx);
    const ts = new Date().toISOString();
    const jobId = randomId("job");

    const doc = {
      jobId,
      name: args.name,
      scheduleKind: args.scheduleKind,
      scheduleExpr: args.scheduleExpr,
      timezone: args.timezone,
      payloadKind: args.payloadKind,
      payloadJson: args.payloadJson,
      enabled: true,
      nextRunAt: ts,
      lastRunAt: undefined,
      createdAt: ts,
      updatedAt: ts,
    };

    await ctx.db.insert("jobs", doc);
    await ctx.db.insert("activityLog", {
      entityType: "job",
      entityId: jobId,
      action: "created",
      actorType: actor.actorType,
      actorId: actor.actorId,
      authSource: actor.authSource,
      metadataJson: JSON.stringify({
        scheduleKind: args.scheduleKind,
        scheduleExpr: args.scheduleExpr,
      }),
      createdAt: ts,
    });

    return doc;
  },
});

export const setJobEnabled = mutationGeneric({
  args: {
    jobId: v.string(),
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const actor = await requireConvexUserActor(ctx);
    const existing = await ctx.db
      .query("jobs")
      .withIndex("by_jobId", (q) => q.eq("jobId", args.jobId))
      .first();
    if (!existing) {
      throw new Error(`Job not found: ${args.jobId}`);
    }

    const updatedAt = new Date().toISOString();
    await ctx.db.patch(existing._id, {
      enabled: args.enabled,
      updatedAt,
    });

    await ctx.db.insert("activityLog", {
      entityType: "job",
      entityId: args.jobId,
      action: args.enabled ? "enabled" : "disabled",
      actorType: actor.actorType,
      actorId: actor.actorId,
      authSource: actor.authSource,
      metadataJson: JSON.stringify({ enabled: args.enabled }),
      createdAt: updatedAt,
    });

    return {
      ...existing,
      enabled: args.enabled,
      updatedAt,
    };
  },
});

export const runJobNow = mutationGeneric({
  args: {
    jobId: v.string(),
    idempotencyKey: v.optional(v.string()),
    scheduledForIso: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const actor = await requireConvexUserActor(ctx);
    const existing = await ctx.db
      .query("jobs")
      .withIndex("by_jobId", (q) => q.eq("jobId", args.jobId))
      .first();

    if (!existing) {
      throw new Error(`Job not found: ${args.jobId}`);
    }

    const runs = await ctx.db
      .query("jobRuns")
      .withIndex("by_jobId_attempt", (q) => q.eq("jobId", args.jobId))
      .collect();

    const maxAttempt = runs.reduce((max, run) => Math.max(max, run.attempt), 0);
    const attempt = maxAttempt + 1;
    const scheduledForIso = args.scheduledForIso ?? new Date().toISOString();
    const idempotencyKey =
      args.idempotencyKey ??
      schedulerRunKey({
        jobId: args.jobId,
        scheduledForIso,
        attempt,
      });

    const duplicate = await ctx.db
      .query("jobRuns")
      .withIndex("by_idempotencyKey", (q) => q.eq("idempotencyKey", idempotencyKey))
      .first();
    if (duplicate) {
      return {
        ...duplicate,
        runId: String(duplicate._id),
      };
    }

    const startedAt = new Date().toISOString();
    const endedAt = new Date().toISOString();
    const runDoc = {
      jobId: args.jobId,
      attempt,
      idempotencyKey,
      startedAt,
      endedAt,
      status: "success" as const,
      summary: "Run completed via run-now.",
      error: undefined,
      createdAt: startedAt,
    };

    const runId = await ctx.db.insert("jobRuns", runDoc);

    await ctx.db.patch(existing._id, {
      lastRunAt: endedAt,
      nextRunAt: new Date().toISOString(),
      updatedAt: endedAt,
    });

    await ctx.db.insert("activityLog", {
      entityType: "job",
      entityId: args.jobId,
      action: "run_now",
      actorType: actor.actorType,
      actorId: actor.actorId,
      authSource: actor.authSource,
      metadataJson: JSON.stringify({ attempt, idempotencyKey, runId: String(runId) }),
      createdAt: endedAt,
    });

    return {
      runId: String(runId),
      ...runDoc,
    };
  },
});
