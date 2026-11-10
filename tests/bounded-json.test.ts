import { describe, expect, test } from "bun:test";
import { parseBoundedJson, RequestBodyTooLargeError } from "../src/lib/api-auth.server";

describe("bounded JSON request parsing", () => {
  test("parses valid JSON within the 192 KiB body limit", async () => {
    const request = new Request("https://example.test/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: "hello" }] }),
    });

    await expect(parseBoundedJson(request)).resolves.toEqual({
      messages: [{ role: "user", content: "hello" }],
    });
  });

  test("rejects a declared body larger than 192 KiB before reading it", async () => {
    const request = new Request("https://example.test/api/chat", {
      method: "POST",
      headers: { "content-length": String(192 * 1024 + 1) },
      body: "{}",
    });

    await expect(parseBoundedJson(request)).rejects.toBeInstanceOf(RequestBodyTooLargeError);
  });

  test("rejects a streamed body larger than 192 KiB when content length is absent", async () => {
    const bytes = new Uint8Array(192 * 1024 + 1);
    const request = new Request("https://example.test/api/chat", {
      method: "POST",
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(bytes);
          controller.close();
        },
      }),
    });

    await expect(parseBoundedJson(request)).rejects.toBeInstanceOf(RequestBodyTooLargeError);
  });
});