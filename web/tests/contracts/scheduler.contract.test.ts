import { beforeEach, describe, expect, it } from "vitest";
import {
  createJob,
  listJobs,
  resetMockStore,
  runJobNow,
} from "@/lib/mockStore";
import { schedulerRunKey } from "@/lib/idempotency";

describe("scheduler idempotency contracts", () => {
  beforeEach(() => {
    resetMockStore();
  });

  it("uses locked key format", () => {
    const key = schedulerRunKey({
      jobId: "job_123",
      scheduledForIso: "2026-02-18T10:00:00.000Z",
      attempt: 2,
    });
    expect(key).toBe("run:job_123:2026-02-18T10:00:00.000Z:2");
  });

  it("returns existing run for duplicate idempotency key", async () => {
    const actor = {
      actorType: "user" as const,
      actorId: "thupten",
      authSource: "internal_system" as const,
    };

    const job = await createJob(actor, {
      name: "Weekly check",
      scheduleKind: "recurring",
      scheduleExpr: "0 9 * * 1",
      timezone: "America/Chicago",
      payloadKind: "agentdeck.check",
      payloadJson: "{}",
    });

    const key = "run:job-custom:2026-02-18T10:00:00.000Z:1";
    const first = await runJobNow(actor, job.jobId, { idempotencyKey: key });
    const second = await runJobNow(actor, job.jobId, { idempotencyKey: key });

    expect(first.runId).toBe(second.runId);
    expect(first.idempotencyKey).toBe(second.idempotencyKey);

    const jobs = await listJobs();
    const latest = jobs.find((entry) => entry.jobId === job.jobId)?.latestRun;
    expect(latest?.runId).toBe(first.runId);
  });
});
