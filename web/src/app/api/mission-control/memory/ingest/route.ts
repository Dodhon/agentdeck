import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addMemoryDoc } from "@/lib/missionControlService";
import { actorFromRequest, authTokenFromRequest } from "@/lib/requestActor";

const ingestSchema = z.object({
  sourcePath: z.string().min(1),
  sourceType: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const parsed = ingestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const authToken = authTokenFromRequest(request);
  const actor = actorFromRequest(request);
  const result = await addMemoryDoc(parsed.data, actor, authToken);
  return NextResponse.json(result, { status: 201 });
}
