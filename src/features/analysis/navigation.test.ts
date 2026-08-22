import * as THREE from "three";
import { afterEach, describe, expect, test } from "vitest";

import {
  buildNavigationSurface,
  createNavigationConfig,
  findRoute,
  type NavigationSurface,
} from "./navigation";
import { defaultAgentProfile } from "./schemas";

const surfaces: NavigationSurface[] = [];

afterEach(() => {
  surfaces.splice(0).forEach((surface) => surface.destroy());
});

function floorMesh(
  width: number,
  depth: number,
  x = 0,
  z = 0,
): THREE.Mesh {
  const floor = new THREE.Mesh(new THREE.BoxGeometry(width, 0.2, depth));
  floor.position.set(x, -0.1, z);
  floor.updateMatrixWorld(true);
  return floor;
}

describe("navigation", () => {
  test("converts metric avatar limits into conservative voxel settings", () => {
    expect(createNavigationConfig(defaultAgentProfile)).toMatchObject({
      cs: 0.15,
      ch: 0.1,
      walkableSlopeAngle: 45,
      walkableHeight: 18,
      walkableRadius: 3,
      walkableClimb: 3,
    });
  });

  test("finds a route across real connected Three.js geometry", async () => {
    const surface = await buildNavigationSurface(
      [floorMesh(12, 5)],
      defaultAgentProfile,
    );
    surfaces.push(surface);

    const result = findRoute(
      surface,
      { x: -4, y: 0, z: 0 },
      { x: 4, y: 0, z: 0 },
    );

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }
    expect(result.path.length).toBeGreaterThanOrEqual(2);
    expect(result.path[0].x).toBeCloseTo(-4, 1);
    expect(result.path.at(-1)?.x).toBeCloseTo(4, 1);
  });

  test("classifies disconnected walkable islands as unreachable", async () => {
    const surface = await buildNavigationSurface(
      [floorMesh(4, 4, -3), floorMesh(4, 4, 3)],
      defaultAgentProfile,
    );
    surfaces.push(surface);

    const result = findRoute(
      surface,
      { x: -3, y: 0, z: 0 },
      { x: 3, y: 0, z: 0 },
    );

    expect(result).toMatchObject({
      success: false,
      failure: "unreachable",
    });
  });
});
