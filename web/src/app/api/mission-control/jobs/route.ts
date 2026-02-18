import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addJob, getJobs } from "@/lib/missionControlService";
import { actorFromRequest, authTokenFromRequest } from "@/lib/requestActor";

const createJobSchema = z.object({
  name: z.string().min(1),
  scheduleKind: z.enum(["one_shot", "recurring"]),
  scheduleExpr: z.string().min(1),
  timezone: z.string().min(1),
  payloadKind: z.string().min(1),
  payloadJson: z.string().min(1),
});

export async function GET(request: NextRequest) {
  const authToken = authTokenFromRequest(request);
  const result = await getJobs(authToken);
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const parsed = createJobSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const authToken = authTokenFromRequest(request);
  const actor = actorFromRequest(request);

  const result = await addJob(parsed.data, actor, authToken);
  return NextResponse.json(result, { status: 201 });
}
