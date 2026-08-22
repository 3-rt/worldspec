import { afterEach, describe, expect, test, vi } from "vitest";

import {
  pendingOperationFixture,
  worldResponseFixture,
} from "@/test/fixtures/worldlabs";

import { GET as getOperation } from "./operations/[operationId]/route";
import { GET as getWorld } from "./worlds/[worldId]/route";
import { GET as getDemoWorld } from "./worlds/demo/route";
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
  test("disables generation in production unless explicitly enabled", async () => {
    configureServer();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("WORLDLABS_GENERATION_ENABLED", "");
    let upstreamCalls = 0;
    vi.stubGlobal("fetch", async () => {
      upstreamCalls += 1;
      return new Response();
    });

    const response = await generateWorld(
      new Request("http://localhost/api/worlds/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: "Threshold Courtyard",
          prompt: "An orbital greenhouse.",
        }),
      }),
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: {
        code: "generation-disabled",
        message: "New Marble world generation is disabled on this deployment.",
      },
    });
    expect(upstreamCalls).toBe(0);
  });

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

  test("preserves generation in local development", async () => {
    configureServer();
    vi.stubEnv("NODE_ENV", "development");
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

  test("allows production generation when explicitly enabled", async () => {
    configureServer();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("WORLDLABS_GENERATION_ENABLED", "true");
    vi.stubGlobal("fetch", async () => Response.json(pendingOperationFixture));

    const response = await generateWorld(
      new Request("http://localhost/api/worlds/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: "Threshold Courtyard",
          prompt: "An orbital greenhouse.",
        }),
      }),
    );

    expect(response.status).toBe(202);
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

  test("returns a bounded error when the prepared demo is not configured", async () => {
    configureServer();
    vi.stubEnv("DEMO_WORLD_ID", "");

    const response = await getDemoWorld();

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: {
        code: "demo-not-configured",
        message: "The prepared Marble world is not configured yet.",
      },
    });
  });

  test("resolves the prepared demo through its stable world ID", async () => {
    configureServer();
    vi.stubEnv("DEMO_WORLD_ID", "world-123");
    vi.stubGlobal(
      "fetch",
      async () => Response.json(worldResponseFixture.world),
    );

    const response = await getDemoWorld();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=15, s-maxage=60, stale-while-revalidate=300",
    );
    expect(await response.json()).toMatchObject({
      worldId: "world-123",
      displayName: "Threshold Courtyard",
    });
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
