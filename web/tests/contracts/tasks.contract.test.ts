import { beforeEach, describe, expect, it } from "vitest";
import { canTransitionTask, requireTaskTransition } from "@/lib/stateContracts";
import {
  createTask,
  listActivity,
  resetMockStore,
  transitionTask,
} from "@/lib/mockStore";

describe("task transition contracts", () => {
  beforeEach(() => {
    resetMockStore();
  });

  it("allows declared transitions", () => {
    expect(canTransitionTask("backlog", "ready")).toBe(true);
    expect(canTransitionTask("blocked", "in_progress")).toBe(true);
  });

  it("rejects invalid transitions", () => {
    expect(canTransitionTask("ready", "done")).toBe(false);
    expect(() => requireTaskTransition("ready", "done")).toThrowError(
      "Invalid task transition",
    );
  });

  it("requires reopenedReason for done -> in_progress", () => {
    expect(canTransitionTask("done", "in_progress")).toBe(false);
    expect(
      canTransitionTask("done", "in_progress", "Need follow-up work"),
    ).toBe(true);
  });

  it("records activity when transitioning task", async () => {
    const actor = {
      actorType: "user" as const,
      actorId: "thupten",
      authSource: "internal_system" as const,
    };

    const task = await createTask(actor, {
      title: "Contract test task",
      ownerType: "user",
      ownerId: "thupten",
      priority: "high",
      status: "backlog",
    });

    await transitionTask(actor, task.taskId, "ready");
    const activity = await listActivity();

    const transitionEvent = activity.find(
      (item) => item.entityId === task.taskId && item.action === "transitioned",
    );
    expect(transitionEvent).toBeTruthy();
  });
});
