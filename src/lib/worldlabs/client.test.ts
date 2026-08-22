import { describe, expect, test } from "vitest";

import {
  completedOperationFixture,
  pendingOperationFixture,
  worldResponseFixture,
} from "@/test/fixtures/worldlabs";

import { createWorldLabsClient } from "./client";

type RecordedRequest = {
  url: string;
  init?: RequestInit;
};

function createRecordingFetch(body: unknown, status = 200) {
  const requests: RecordedRequest[] = [];
  const fetch = async (input: string | URL | Request, init?: RequestInit) => {
    requests.push({ url: String(input), init });
    return new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  };

  return { fetch, requests };
}

describe("createWorldLabsClient", () => {
  test("retrieves and normalizes a world with server credentials", async () => {
    const recorder = createRecordingFetch(worldResponseFixture);
    const client = createWorldLabsClient({
      apiKey: "test-api-key",
      baseUrl: "https://api.worldlabs.ai",
      fetch: recorder.fetch,
    });

    const world = await client.getWorld("world-123");

    expect(world.worldId).toBe("world-123");
    expect(recorder.requests).toHaveLength(1);
    expect(recorder.requests[0].url).toBe(
      "https://api.worldlabs.ai/marble/v1/worlds/world-123",
    );
    expect(recorder.requests[0].init).toMatchObject({
      method: "GET",
      cache: "no-store",
      headers: { "WLT-Api-Key": "test-api-key" },
    });
  });

  test("starts text generation with the documented Marble request", async () => {
    const recorder = createRecordingFetch(pendingOperationFixture);
    const client = createWorldLabsClient({
      apiKey: "test-api-key",
      baseUrl: "https://api.worldlabs.ai/",
      model: "marble-1.1",
      fetch: recorder.fetch,
    });

    const operation = await client.generateWorld({
      displayName: "Threshold Courtyard",
      prompt: "An orbital greenhouse with a narrow passage.",
    });

    expect(operation).toMatchObject({
      operationId: "operation-123",
      done: false,
      status: "IN_PROGRESS",
      worldId: "world-123",
      world: null,
    });
    expect(recorder.requests[0].url).toBe(
      "https://api.worldlabs.ai/marble/v1/worlds:generate",
    );
    expect(recorder.requests[0].init).toMatchObject({
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "WLT-Api-Key": "test-api-key",
      },
    });
    expect(JSON.parse(String(recorder.requests[0].init?.body))).toEqual({
      display_name: "Threshold Courtyard",
      model: "marble-1.1",
      world_prompt: {
        type: "text",
        text_prompt: "An orbital greenhouse with a narrow passage.",
      },
    });
  });

  test("normalizes a completed operation and its generated assets", async () => {
    const recorder = createRecordingFetch(completedOperationFixture);
    const client = createWorldLabsClient({
      apiKey: "test-api-key",
      baseUrl: "https://api.worldlabs.ai",
      fetch: recorder.fetch,
    });

    const operation = await client.getOperation("operation-123");

    expect(operation).toMatchObject({
      operationId: "operation-123",
      done: true,
      status: "SUCCEEDED",
      description: "World generation completed successfully",
      worldId: "world-123",
      world: { worldId: "world-123" },
    });
    expect(recorder.requests[0].url).toBe(
      "https://api.worldlabs.ai/marble/v1/operations/operation-123",
    );
  });

  test("maps rate limiting without leaking the upstream response", async () => {
    const recorder = createRecordingFetch(
      { error: "upstream detail that must stay private" },
      429,
    );
    const client = createWorldLabsClient({
      apiKey: "test-api-key",
      baseUrl: "https://api.worldlabs.ai",
      fetch: recorder.fetch,
    });

    const request = client.getWorld("world-123");

    await expect(request).rejects.toMatchObject({
      code: "rate-limited",
      status: 429,
    });
    await expect(request).rejects.not.toThrow(
      "upstream detail that must stay private",
    );
    await expect(request).rejects.not.toThrow("test-api-key");
  });
});
