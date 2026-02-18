import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { toggleJob } from "@/lib/missionControlService";
import { actorFromRequest, authTokenFromRequest } from "@/lib/requestActor";

const enabledSchema = z.object({
  enabled: z.boolean(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;
  const payload = await request.json();
  const parsed = enabledSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const authToken = authTokenFromRequest(request);
    const actor = actorFromRequest(request);
    const result = await toggleJob(jobId, parsed.data.enabled, actor, authToken);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update job state",
      },
      { status: 400 },
    );
  }
}
