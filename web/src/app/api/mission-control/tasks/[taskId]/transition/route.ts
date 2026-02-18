import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { moveTask } from "@/lib/missionControlService";
import { actorFromRequest, authTokenFromRequest } from "@/lib/requestActor";

const transitionSchema = z.object({
  nextStatus: z.enum([
    "backlog",
    "ready",
    "in_progress",
    "blocked",
    "done",
    "archived",
  ]),
  reopenedReason: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const { taskId } = await params;
  const payload = await request.json();
  const parsed = transitionSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const authToken = authTokenFromRequest(request);
    const actor = actorFromRequest(request);
    const result = await moveTask(
      {
        taskId,
        nextStatus: parsed.data.nextStatus,
        reopenedReason: parsed.data.reopenedReason,
      },
      actor,
      authToken,
    );

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to transition task" },
      { status: 400 },
    );
  }
}
