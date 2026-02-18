export interface ConvexActor {
  actorType: "user" | "agent" | "system";
  actorId: string;
  authSource: "convex_user" | "internal_system";
}

interface AuthContextLike {
  auth: {
    getUserIdentity: () => Promise<{ subject: string } | null>;
  };
}

export async function requireConvexUserActor(
  ctx: AuthContextLike,
): Promise<ConvexActor> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized: Convex identity is required for this mutation.");
  }
  return {
    actorType: "user",
    actorId: identity.subject,
    authSource: "convex_user",
  };
}

export function systemActor(kind: "scheduler" | "ingest_worker" | "migration"): ConvexActor {
  return {
    actorType: "system",
    actorId: kind,
    authSource: "internal_system",
  };
}
