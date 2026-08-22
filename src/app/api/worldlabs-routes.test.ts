import { afterEach, describe, expect, test, vi } from "vitest";

import {
  pendingOperationFixture,
  worldResponseFixture,
} from "@/test/fixtures/worldlabs";

import { GET as getOperation } from "./operations/[operationId]/route";
import { GET as getWorld } from "./worlds/[worldId]/route";
import { POST as generateWorld } from "./worlds/generate/route";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function configureServer() {
  vi.stubEnv("WORLDLABS_API_KEY", "server-only-test-key");
  vi.stubEnv("WORLDLABS_API_BASE_URL", "https://api.worldlabs.ai");
  vi.stubEnv("WORLDLABS_MODEL", "marble-1.1");
}

describe("World Labs route boundary", () => {
  test("rejects an empty generation prompt before calling upstream", async () => {
    configureServer();
    let upstreamCalls = 0;
    vi.stubGlobal("fetch", async () => {
      upstreamCalls += 1;
      return new Response();
    });

    const response = await generateWorld(
      new Request("http://localhost/api/worlds/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: "Test", prompt: "   " }),
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: {
        code: "invalid-request",
        message: "Enter a world prompt before generating.",
      },
    });
    expect(upstreamCalls).toBe(0);
  });

  test("trims valid generation input and returns operation progress", async () => {
    configureServer();
    let upstreamBody = "";
    vi.stubGlobal(
      "fetch",
      async (_input: string | URL | Request, init?: RequestInit) => {
        upstreamBody = String(init?.body);
        return Response.json(pendingOperationFixture);
      },
    );

    const response = await generateWorld(
      new Request("http://localhost/api/worlds/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: "  Threshold Courtyard  ",
          prompt: "  An orbital greenhouse.  ",
        }),
      }),
    );

    expect(response.status).toBe(202);
    expect(await response.json()).toMatchObject({
      operationId: "operation-123",
      status: "IN_PROGRESS",
    });
    expect(JSON.parse(upstreamBody)).toMatchObject({
      display_name: "Threshold Courtyard",
      world_prompt: { text_prompt: "An orbital greenhouse." },
    });
  });

  test("rejects a generation prompt above the upstream boundary", async () => {
    configureServer();
    const response = await generateWorld(
      new Request("http://localhost/api/worlds/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: "Threshold Courtyard",
          prompt: "x".repeat(1_501),
        }),
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: {
        code: "invalid-request",
        message: "World prompts must be 1,500 characters or fewer.",
      },
    });
  });

  test("returns normalized world assets without credentials", async () => {
    configureServer();
    vi.stubGlobal("fetch", async () => Response.json(worldResponseFixture));

    const response = await getWorld(
      new Request("http://localhost/api/worlds/world-123"),
      { params: Promise.resolve({ worldId: "world-123" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      worldId: "world-123",
      splatUrl: "https://assets.example.test/world-123-500k.spz",
      colliderGlbUrl: "https://assets.example.test/world-123-collider.glb",
    });
    expect(JSON.stringify(body)).not.toContain("server-only-test-key");
  });

  test("returns normalized operation data", async () => {
    configureServer();
    vi.stubGlobal(
      "fetch",
      async () => Response.json(pendingOperationFixture),
    );

    const response = await getOperation(
      new Request("http://localhost/api/operations/operation-123"),
      { params: Promise.resolve({ operationId: "operation-123" }) },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      operationId: "operation-123",
      done: false,
      status: "IN_PROGRESS",
    });
  });
});
