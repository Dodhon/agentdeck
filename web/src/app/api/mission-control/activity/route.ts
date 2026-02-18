import { NextRequest, NextResponse } from "next/server";
import { getActivity } from "@/lib/missionControlService";
import { authTokenFromRequest } from "@/lib/requestActor";

export async function GET(request: NextRequest) {
  const authToken = authTokenFromRequest(request);
  const result = await getActivity(authToken);
  return NextResponse.json(result);
}
