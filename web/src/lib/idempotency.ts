import crypto from "node:crypto";

export function hashPrefix(value: string, length: number): string {
  return crypto.createHash("sha1").update(value).digest("hex").slice(0, length);
}

export function checksumPrefix(value: string, length: number): string {
  return crypto
    .createHash("sha256")
    .update(value)
    .digest("hex")
    .slice(0, length);
}

export function schedulerRunKey(params: {
  jobId: string;
  scheduledForIso: string;
  attempt: number;
}): string {
  return `run:${params.jobId}:${params.scheduledForIso}:${params.attempt}`;
}

export function ingestKey(params: {
  sourcePath: string;
  checksum: string;
}): string {
  return `ingest:${hashPrefix(params.sourcePath, 12)}:${checksumPrefix(params.checksum, 16)}`;
}
