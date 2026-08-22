import * as THREE from "three";
import { describe, expect, test } from "vitest";

import { measureRouteClearance } from "./clearance";
import type { Vec3 } from "./schemas";

const route: Vec3[] = [
  { x: 0, y: 0, z: -4 },
  { x: 0, y: 0, z: 0 },
  { x: 0, y: 0, z: 4 },
];

function wall(
  centerX: number,
  centerZ = 0,
  depth = 10,
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3, depth));
  mesh.position.set(centerX, 1.5, centerZ);
  mesh.updateMatrixWorld(true);
  return mesh;
}

describe("measureRouteClearance", () => {
  test("measures the hand-derived inner width of a straight corridor", () => {
    const result = measureRouteClearance({
      path: route,
      colliderMeshes: [wall(-1.1), wall(1.1)],
      avatarHeightMeters: 1.8,
      requiredWidthMeters: 0.7,
    });

    expect(result.passes).toBe(true);
    expect(result.minimumClearanceMeters).toBeCloseTo(2, 1);
    expect(result.failureLocation).toBeUndefined();
  });

  test("locates the first section that narrows below the contract", () => {
    const result = measureRouteClearance({
      path: route,
      colliderMeshes: [
        wall(-1.1, -2.5, 3),
        wall(1.1, -2.5, 3),
        wall(-0.4, 2.5, 3),
        wall(0.4, 2.5, 3),
      ],
      avatarHeightMeters: 1.8,
      requiredWidthMeters: 0.7,
    });

    expect(result.passes).toBe(false);
    expect(result.minimumClearanceMeters).toBeCloseTo(0.6, 1);
    expect(result.failureLocation?.z).toBeGreaterThanOrEqual(1);
    expect(result.failureLocation?.z).toBeLessThanOrEqual(4);
  });

  test("treats open space without paired obstacles as unbounded", () => {
    const result = measureRouteClearance({
      path: route,
      colliderMeshes: [],
      avatarHeightMeters: 1.8,
      requiredWidthMeters: 0.7,
    });

    expect(result).toMatchObject({
      passes: true,
      minimumClearanceMeters: Number.POSITIVE_INFINITY,
    });
  });
});
