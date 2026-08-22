import { describe, expect, test } from "vitest";

import { analyzeWorld } from "./analyze-world";
import type { NavigationSurface } from "./navigation";
import {
  defaultAgentProfile,
  type Vec3,
  type WorldContract,
} from "./schemas";

const start = { x: 0, y: 0, z: 0 };
const goal = { x: 3, y: 0, z: 4 };

function contract(overrides: Partial<WorldContract> = {}): WorldContract {
  return {
    sourceText: "The player must reach the platform.",
    start,
    goal,
    requirePath: true,
    minimumClearanceMeters: 0.7,
    agent: defaultAgentProfile,
    ...overrides,
  };
}

function surfaceFactory(options?: {
  nearestPoints?: Array<Vec3 | null>;
  path?: Vec3[] | null;
}) {
  let nearestIndex = 0;
  let destroyCalls = 0;
  const surface: NavigationSurface = {
    findNearestPoint(point) {
      return options?.nearestPoints
        ? (options.nearestPoints[nearestIndex++] ?? null)
        : point;
    },
    computePath() {
      return options?.path === undefined ? [start, goal] : options.path;
    },
    destroy() {
      destroyCalls += 1;
    },
  };

  return {
    create: async () => surface,
    get destroyCalls() {
      return destroyCalls;
    },
  };
}

describe("analyzeWorld", () => {
  test("rejects a missing entrance without building navigation", async () => {
    let factoryCalls = 0;
    const report = await analyzeWorld({
      meshes: [],
      contract: contract({ start: null }),
      createSurface: async () => {
        factoryCalls += 1;
        throw new Error("must not build");
      },
    });

    expect(report).toMatchObject({
      status: "fail",
      path: [],
      failures: [
        {
          kind: "invalid-start",
          message: "Place an entrance on the world before running the test.",
        },
      ],
    });
    expect(factoryCalls).toBe(0);
  });

  test("reports a goal that cannot project onto walkable space", async () => {
    const factory = surfaceFactory({ nearestPoints: [start, null] });
    const report = await analyzeWorld({
      meshes: [],
      contract: contract(),
      createSurface: factory.create,
    });

    expect(report).toMatchObject({
      status: "fail",
      failures: [
        {
          kind: "invalid-goal",
          message: "The destination is not on a walkable surface.",
          location: goal,
        },
      ],
    });
    expect(factory.destroyCalls).toBe(1);
  });

  test("reports disconnected walkable regions", async () => {
    const factory = surfaceFactory({ nearestPoints: [start, goal], path: null });
    const report = await analyzeWorld({
      meshes: [],
      contract: contract(),
      createSurface: factory.create,
    });

    expect(report).toMatchObject({
      status: "fail",
      failures: [
        {
          kind: "unreachable",
          message: "No connected walkable route reaches the destination.",
          location: goal,
        },
      ],
    });
  });

  test("returns measured route evidence and releases navigation resources", async () => {
    const route = [
      start,
      { x: 0, y: 0, z: 4 },
      goal,
    ];
    const factory = surfaceFactory({ nearestPoints: [start, goal], path: route });
    const times = [100, 112];
    const report = await analyzeWorld({
      meshes: [],
      contract: contract(),
      createSurface: factory.create,
      now: () => times.shift() ?? 112,
    });

    expect(report).toEqual({
      status: "pass",
      path: route,
      routeLengthMeters: 7,
      failures: [],
      elapsedMs: 12,
    });
    expect(factory.destroyCalls).toBe(1);
  });
});
