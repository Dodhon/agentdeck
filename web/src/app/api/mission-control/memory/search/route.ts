import { NextRequest, NextResponse } from "next/server";
import { queryMemory } from "@/lib/missionControlService";
import { authTokenFromRequest } from "@/lib/requestActor";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q") || "";
  const authToken = authTokenFromRequest(request);
  const result = await queryMemory(query, authToken);
  return NextResponse.json(result);
}
