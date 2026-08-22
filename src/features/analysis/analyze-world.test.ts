import * as THREE from "three";
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

  test("retains the route and marks the first measured clearance violation", async () => {
    const routeThroughPassage = [
      { x: 0, y: 0, z: -2 },
      { x: 0, y: 0, z: 2 },
    ];
    const factory = surfaceFactory({
      nearestPoints: routeThroughPassage,
      path: routeThroughPassage,
    });
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3, 5));
    leftWall.position.set(-0.4, 1.5, 0);
    leftWall.updateMatrixWorld(true);
    const rightWall = leftWall.clone();
    rightWall.position.x = 0.4;
    rightWall.updateMatrixWorld(true);

    const report = await analyzeWorld({
      meshes: [leftWall, rightWall],
      contract: contract({
        start: routeThroughPassage[0],
        goal: routeThroughPassage[1],
      }),
      createSurface: factory.create,
    });

    expect(report).toMatchObject({
      status: "fail",
      path: routeThroughPassage,
      routeLengthMeters: 4,
      minimumClearanceMeters: 0.6,
      failures: [
        {
          kind: "clearance",
          message: "The route narrows below the required width.",
          measuredValue: 0.6,
          requiredValue: 0.7,
        },
      ],
    });
    expect(report.failures[0].location?.z).toBeCloseTo(-2, 1);
  });
});
