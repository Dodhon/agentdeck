import crypto from "node:crypto";
import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import { requireConvexUserActor } from "./actors";

type TaskStatus =
  | "backlog"
  | "ready"
  | "in_progress"
  | "blocked"
  | "done"
  | "archived";

const transitions: Record<TaskStatus, TaskStatus[]> = {
  backlog: ["ready", "in_progress", "archived"],
  ready: ["in_progress", "blocked", "archived"],
  in_progress: ["blocked", "done", "archived"],
  blocked: ["ready", "in_progress", "archived"],
  done: ["in_progress"],
  archived: [],
};

function ensureTaskTransition(
  from: TaskStatus,
  to: TaskStatus,
  reopenedReason?: string,
): void {
  if (from === to) return;
  if (from === "done" && to === "in_progress") {
    if (!reopenedReason || !reopenedReason.trim()) {
      throw new Error("reopenedReason is required for done -> in_progress");
    }
    return;
  }
  if (!transitions[from].includes(to)) {
    throw new Error(`Invalid task transition: ${from} -> ${to}`);
  }
}

export const listTasks = queryGeneric({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_status_updatedAt")
      .order("desc")
      .collect();
  },
});

export const createTask = mutationGeneric({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    ownerType: v.union(v.literal("user"), v.literal("agent"), v.literal("system")),
    ownerId: v.string(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    status: v.optional(
      v.union(
        v.literal("backlog"),
        v.literal("ready"),
        v.literal("in_progress"),
        v.literal("blocked"),
        v.literal("done"),
        v.literal("archived"),
      ),
    ),
    dueAt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const actor = await requireConvexUserActor(ctx);
    const createdAt = new Date().toISOString();
    const taskId = `task_${crypto.randomUUID()}`;

    const taskDoc = {
      taskId,
      title: args.title,
      description: args.description,
      ownerType: args.ownerType,
      ownerId: args.ownerId,
      status: args.status ?? "backlog",
      priority: args.priority,
      dueAt: args.dueAt,
      createdAt,
      updatedAt: createdAt,
      archivedAt: undefined,
    };

    await ctx.db.insert("tasks", taskDoc);
    await ctx.db.insert("taskEvents", {
      taskId,
      eventType: "task.created",
      actorType: actor.actorType,
      actorId: actor.actorId,
      authSource: actor.authSource,
      afterJson: JSON.stringify(taskDoc),
      createdAt,
    });
    await ctx.db.insert("activityLog", {
      entityType: "task",
      entityId: taskId,
      action: "created",
      actorType: actor.actorType,
      actorId: actor.actorId,
      authSource: actor.authSource,
      metadataJson: JSON.stringify({ title: args.title }),
      createdAt,
    });

    return taskDoc;
  },
});

export const transitionTask = mutationGeneric({
  args: {
    taskId: v.string(),
    nextStatus: v.union(
      v.literal("backlog"),
      v.literal("ready"),
      v.literal("in_progress"),
      v.literal("blocked"),
      v.literal("done"),
      v.literal("archived"),
    ),
    reopenedReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const actor = await requireConvexUserActor(ctx);
    const existing = await ctx.db
      .query("tasks")
      .withIndex("by_taskId", (q) => q.eq("taskId", args.taskId))
      .first();

    if (!existing) {
      throw new Error(`Task not found: ${args.taskId}`);
    }

    ensureTaskTransition(
      existing.status as TaskStatus,
      args.nextStatus as TaskStatus,
      args.reopenedReason,
    );

    const updatedAt = new Date().toISOString();
    const nextDoc = {
      ...existing,
      status: args.nextStatus,
      updatedAt,
      archivedAt: args.nextStatus === "archived" ? updatedAt : undefined,
    };

    await ctx.db.patch(existing._id, {
      status: nextDoc.status,
      updatedAt: nextDoc.updatedAt,
      archivedAt: nextDoc.archivedAt,
    });

    await ctx.db.insert("taskEvents", {
      taskId: args.taskId,
      eventType: "task.transitioned",
      actorType: actor.actorType,
      actorId: actor.actorId,
      authSource: actor.authSource,
      beforeJson: JSON.stringify(existing),
      afterJson: JSON.stringify(nextDoc),
      createdAt: updatedAt,
    });

    await ctx.db.insert("activityLog", {
      entityType: "task",
      entityId: args.taskId,
      action: "transitioned",
      actorType: actor.actorType,
      actorId: actor.actorId,
      authSource: actor.authSource,
      metadataJson: JSON.stringify({
        from: existing.status,
        to: args.nextStatus,
        reopenedReason: args.reopenedReason,
      }),
      createdAt: updatedAt,
    });

    return nextDoc;
  },
});
