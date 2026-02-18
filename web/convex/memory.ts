import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import { requireConvexUserActor } from "./actors";
import { contentChecksum, hashPrefix, randomId } from "./utils";

function ingestKey(sourcePath: string, checksum: string): string {
  const sourceHash = hashPrefix(sourcePath, 12);
  const checksumHash = hashPrefix(checksum, 16);
  return `ingest:${sourceHash}:${checksumHash}`;
}

function chunkText(body: string): Array<{ chunkIndex: number; text: string; tokenCount: number }> {
  const chunkSize = 260;
  const chunks: Array<{ chunkIndex: number; text: string; tokenCount: number }> = [];
  for (let i = 0; i < body.length; i += chunkSize) {
    const text = body.slice(i, i + chunkSize);
    chunks.push({
      chunkIndex: chunks.length,
      text,
      tokenCount: text.split(/\s+/).filter(Boolean).length,
    });
  }
  return chunks;
}

export const ingestMemory = mutationGeneric({
  args: {
    sourcePath: v.string(),
    sourceType: v.string(),
    title: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const actor = await requireConvexUserActor(ctx);
    const ts = new Date().toISOString();
    const checksum = contentChecksum(args.body);
    const key = ingestKey(args.sourcePath, checksum);

    const existing = await ctx.db
      .query("memoryDocs")
      .withIndex("by_ingestKey", (q) => q.eq("ingestKey", key))
      .first();
    if (existing) {
      return existing;
    }

    const docId = randomId("doc");
    const doc = {
      docId,
      sourcePath: args.sourcePath,
      sourceType: args.sourceType,
      title: args.title,
      ingestStatus: "indexed" as const,
      checksum,
      ingestKey: key,
      body: args.body,
      createdAt: ts,
      updatedAt: ts,
    };

    await ctx.db.insert("memoryDocs", doc);

    const chunks = chunkText(args.body);
    for (const chunk of chunks) {
      await ctx.db.insert("memoryChunks", {
        docId,
        chunkIndex: chunk.chunkIndex,
        text: chunk.text,
        tokenCount: chunk.tokenCount,
        createdAt: ts,
      });
    }

    await ctx.db.insert("activityLog", {
      entityType: "memory",
      entityId: docId,
      action: "ingested",
      actorType: actor.actorType,
      actorId: actor.actorId,
      authSource: actor.authSource,
      metadataJson: JSON.stringify({
        sourcePath: args.sourcePath,
        chunkCount: chunks.length,
        ingestKey: key,
      }),
      createdAt: ts,
    });

    return doc;
  },
});

export const searchMemory = queryGeneric({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args) => {
    const normalized = args.query.trim().toLowerCase();
    const chunks = await ctx.db.query("memoryChunks").collect();
    const docs = await ctx.db.query("memoryDocs").collect();

    const scored = chunks
      .map((chunk) => {
        const text = chunk.text.toLowerCase();
        if (normalized && !text.includes(normalized)) {
          return null;
        }

        const doc = docs.find((entry) => entry.docId === chunk.docId);
        if (!doc) return null;

        const score = normalized ? text.split(normalized).length - 1 : 1;
        const start = normalized ? Math.max(0, text.indexOf(normalized) - 40) : 0;
        const end = normalized
          ? text.indexOf(normalized) + normalized.length + 140
          : 180;

        return {
          docId: doc.docId,
          sourcePath: doc.sourcePath,
          title: doc.title,
          snippet: chunk.text.slice(start, end),
          score,
        };
      })
      .filter((entry) => Boolean(entry));

    const bestByDoc = new Map<string, (typeof scored)[number]>();
    scored.forEach((entry) => {
      if (!entry) return;
      const current = bestByDoc.get(entry.docId);
      if (!current || entry.score > current.score) {
        bestByDoc.set(entry.docId, entry);
      }
    });

    return [...bestByDoc.values()]
      .filter((entry) => Boolean(entry))
      .sort((a, b) => (b?.score || 0) - (a?.score || 0))
      .slice(0, 25);
  },
});
