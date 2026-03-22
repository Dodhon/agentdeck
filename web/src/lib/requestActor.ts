import type { NextRequest } from "next/server";
import type { ActorContext } from "./types";

export function actorFromRequest(request: NextRequest): ActorContext {
  const actorId =
    request.headers.get("x-actor-id") ||
    request.headers.get("x-user-id") ||
    "local_operator";
  const actorTypeHeader = request.headers.get("x-actor-type");
  const actorType =
    actorTypeHeader === "agent" || actorTypeHeader === "system"
      ? actorTypeHeader
      : "user";

  const authHeader = request.headers.get("authorization");
  const authSource = authHeader ? "convex_user" : "internal_system";

  return {
    actorId,
    actorType,
    authSource,
  };
}

export function authTokenFromRequest(request: NextRequest): string | undefined {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return undefined;
  }
  const [scheme, token] = authHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return undefined;
  }
  return token;
}
