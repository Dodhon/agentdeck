import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addTask, getTasks } from "@/lib/missionControlService";
import { actorFromRequest, authTokenFromRequest } from "@/lib/requestActor";

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  ownerType: z.enum(["user", "agent", "system"]),
  ownerId: z.string().min(1),
  priority: z.enum(["low", "medium", "high"]),
  status: z
    .enum(["backlog", "ready", "in_progress", "blocked", "done", "archived"])
    .optional(),
  dueAt: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const authToken = authTokenFromRequest(request);
  const result = await getTasks(authToken);
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const parsed = createTaskSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const authToken = authTokenFromRequest(request);
  const actor = actorFromRequest(request);

  const result = await addTask(parsed.data, actor, authToken);
  return NextResponse.json(result, { status: 201 });
}
