export interface Envelope<T> {
  mode: "convex" | "mock";
  data: T;
}

export async function getJson<T>(url: string): Promise<Envelope<T>> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(errorBody || `Request failed: ${response.status}`);
  }
  return (await response.json()) as Envelope<T>;
}

export async function postJson<T>(
  url: string,
  payload: unknown,
): Promise<Envelope<T>> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-actor-id": "thupten",
      "x-actor-type": "user",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Request failed: ${response.status}`);
  }
  return (await response.json()) as Envelope<T>;
}
