import * as THREE from "three";

import type { Vec3 } from "./schemas";

export type MeasureRouteClearanceInput = {
  path: Vec3[];
  colliderMeshes: THREE.Object3D[];
  avatarHeightMeters: number;
  requiredWidthMeters: number;
  sampleSpacingMeters?: number;
  maximumProbeMeters?: number;
};

export type ClearanceResult = {
  passes: boolean;
  minimumClearanceMeters: number;
  failureLocation?: Vec3;
  sampleCount: number;
};

function sampleRoute(path: Vec3[], spacing: number): Vec3[] {
  if (path.length === 0) {
    return [];
  }

  const samples: Vec3[] = [path[0]];
  for (let index = 1; index < path.length; index += 1) {
    const start = path[index - 1];
    const end = path[index];
    const length = Math.hypot(
      end.x - start.x,
      end.y - start.y,
      end.z - start.z,
    );
    const divisions = Math.max(1, Math.ceil(length / spacing));
    for (let division = 1; division <= divisions; division += 1) {
      const progress = division / divisions;
      samples.push({
        x: THREE.MathUtils.lerp(start.x, end.x, progress),
        y: THREE.MathUtils.lerp(start.y, end.y, progress),
        z: THREE.MathUtils.lerp(start.z, end.z, progress),
      });
    }
  }
  return samples;
}

export function measureRouteClearance({
  path,
  colliderMeshes,
  avatarHeightMeters,
  requiredWidthMeters,
  sampleSpacingMeters = 0.2,
  maximumProbeMeters = 5,
}: MeasureRouteClearanceInput): ClearanceResult {
  colliderMeshes.forEach((mesh) => mesh.updateWorldMatrix(true, false));
  const routeSamples = sampleRoute(path, sampleSpacingMeters);
  const raycaster = new THREE.Raycaster();
  raycaster.near = 0.001;
  raycaster.far = maximumProbeMeters;

  let minimumClearanceMeters = Number.POSITIVE_INFINITY;
  let failureLocation: Vec3 | undefined;

  function nearestHit(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
  ): number | null {
    raycaster.set(origin, direction);
    const hit = raycaster.intersectObjects(colliderMeshes, true)[0];
    return hit?.distance ?? null;
  }

  for (const sample of routeSamples) {
    const origin = new THREE.Vector3(
      sample.x,
      sample.y + avatarHeightMeters / 2,
      sample.z,
    );
    let clearanceAtSample = Number.POSITIVE_INFINITY;

    for (let directionIndex = 0; directionIndex < 8; directionIndex += 1) {
      const angle = (directionIndex * Math.PI) / 8;
      const direction = new THREE.Vector3(
        Math.cos(angle),
        0,
        Math.sin(angle),
      );
      const opposite = direction.clone().multiplyScalar(-1);
      const forwardDistance = nearestHit(origin, direction);
      const backwardDistance = nearestHit(origin, opposite);

      if (forwardDistance !== null && backwardDistance !== null) {
        clearanceAtSample = Math.min(
          clearanceAtSample,
          forwardDistance + backwardDistance,
        );
      }
    }

    minimumClearanceMeters = Math.min(
      minimumClearanceMeters,
      clearanceAtSample,
    );
    if (
      !failureLocation &&
      clearanceAtSample < requiredWidthMeters
    ) {
      failureLocation = sample;
    }
  }

  return {
    passes: failureLocation === undefined,
    minimumClearanceMeters,
    ...(failureLocation ? { failureLocation } : {}),
    sampleCount: routeSamples.length,
  };
}
