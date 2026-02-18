import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { triggerJob } from "@/lib/missionControlService";
import { actorFromRequest, authTokenFromRequest } from "@/lib/requestActor";

const runNowSchema = z.object({
  idempotencyKey: z.string().optional(),
  scheduledForIso: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;
  const payload = await request.json().catch(() => ({}));
  const parsed = runNowSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const authToken = authTokenFromRequest(request);
    const actor = actorFromRequest(request);
    const result = await triggerJob(
      {
        jobId,
        idempotencyKey: parsed.data.idempotencyKey,
        scheduledForIso: parsed.data.scheduledForIso,
      },
      actor,
      authToken,
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to run job" },
      { status: 400 },
    );
  }
}
