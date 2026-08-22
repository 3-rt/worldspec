import { describe, expect, test, vi } from "vitest";

import {
  completedOperationFixture,
  pendingOperationFixture,
  worldResponseFixture,
} from "@/test/fixtures/worldlabs";

import { normalizeWorld } from "./normalize";
import {
  fetchPreparedWorld,
  generateAndPollWorld,
} from "./browser";

const normalizedWorld = normalizeWorld(worldResponseFixture.world);

describe("World Labs browser client", () => {
  test("resolves and validates the prepared demo", async () => {
    const fetchImplementation = vi.fn(async () =>
      Response.json(normalizedWorld),
    );

    await expect(
      fetchPreparedWorld({ fetch: fetchImplementation }),
    ).resolves.toEqual(normalizedWorld);
    expect(fetchImplementation).toHaveBeenCalledWith("/api/worlds/demo", {
      cache: "no-store",
      signal: undefined,
    });
  });

  test("starts generation and polls until complete", async () => {
    const responses = [
      Response.json({
        operationId: "operation-123",
        done: false,
        status: "PENDING",
        description: "Queued",
        worldId: null,
        error: null,
        world: null,
      }),
      Response.json({
        operationId: pendingOperationFixture.operation_id,
        done: false,
        status: "IN_PROGRESS",
        description: "World generation in progress",
        worldId: "world-123",
        error: null,
        world: null,
      }),
      Response.json({
        operationId: completedOperationFixture.operation_id,
        done: true,
        status: "SUCCEEDED",
        description: "World generation completed successfully",
        worldId: "world-123",
        error: null,
        world: normalizedWorld,
      }),
      Response.json(normalizedWorld),
    ];
    const fetchImplementation = vi.fn(async () => responses.shift()!);
    const wait = vi.fn(async () => undefined);

    const operation = await generateAndPollWorld(
      { displayName: "Threshold", prompt: "A spatial test world." },
      { fetch: fetchImplementation, wait, intervalMs: 5, maxAttempts: 3 },
    );

    expect(operation.done).toBe(true);
    expect(operation.world).toEqual(normalizedWorld);
    expect(fetchImplementation).toHaveBeenCalledTimes(4);
    expect(fetchImplementation).toHaveBeenLastCalledWith(
      "/api/worlds/world-123",
      { cache: "no-store", signal: undefined },
    );
    expect(wait).toHaveBeenCalledTimes(2);
  });

  test("stops polling at the configured boundary", async () => {
    const fetchImplementation = vi.fn(async () =>
      Response.json({
        operationId: "operation-123",
        done: false,
        status: "IN_PROGRESS",
        description: "Working",
        worldId: "world-123",
        error: null,
        world: null,
      }),
    );

    await expect(
      generateAndPollWorld(
        { displayName: "Threshold", prompt: "A spatial test world." },
        {
          fetch: fetchImplementation,
          wait: async () => undefined,
          intervalMs: 5,
          maxAttempts: 2,
        },
      ),
    ).rejects.toThrow("World generation is taking longer than expected");
    expect(fetchImplementation).toHaveBeenCalledTimes(3);
  });
});
