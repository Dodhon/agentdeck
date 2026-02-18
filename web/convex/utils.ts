export function randomId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function hashString(input: string): string {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash +=
      (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function hashPrefix(value: string, length: number): string {
  let output = "";
  let seed = value;
  while (output.length < length) {
    seed = `${seed}:${output.length}`;
    output += hashString(seed);
  }
  return output.slice(0, length);
}

export function contentChecksum(body: string): string {
  return hashPrefix(body, 64);
}
