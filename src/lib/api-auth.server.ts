/** Small request guards for public demo support-chat endpoints. */
export class RequestBodyTooLargeError extends Error {}
export async function parseBoundedJson(request: Request): Promise<unknown> {
  const maxBytes = 64 * 1024;
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > maxBytes) throw new RequestBodyTooLargeError();
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes) throw new RequestBodyTooLargeError();
  try { return JSON.parse(text); } catch { throw new Error("Invalid JSON"); }
}
export function chatPayloadOk(messages: unknown[]): boolean {
  if (messages.length < 1 || messages.length > 30) return false;
  return messages.every((message) => {
    if (!message || typeof message !== "object") return false;
    const item = message as { role?: unknown; parts?: unknown };
    if (item.role !== "user" && item.role !== "assistant") return false;
    if (!Array.isArray(item.parts) || item.parts.length > 30) return false;
    return item.parts.every((part) => {
      if (!part || typeof part !== "object") return false;
      const p = part as { type?: unknown; text?: unknown };
      return p.type === "text" && typeof p.text === "string" && p.text.length <= 4000;
    });
  });
}
