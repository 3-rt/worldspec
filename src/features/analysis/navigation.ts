import { threeToSoloNavMesh } from "@recast-navigation/three";
import { init, NavMeshQuery } from "recast-navigation";
import type * as THREE from "three";

import type { AgentProfile, Vec3 } from "./schemas";

const CELL_SIZE_METERS = 0.15;
const CELL_HEIGHT_METERS = 0.1;

let recastInitialization: Promise<void> | null = null;

export type NavigationFailure =
  | "invalid-start"
  | "invalid-goal"
  | "unreachable";

export type RouteResult =
  | {
      success: true;
      path: Vec3[];
      start: Vec3;
      goal: Vec3;
    }
  | {
      success: false;
      failure: NavigationFailure;
      location: Vec3;
    };

export type NavigationSurface = {
  findNearestPoint(point: Vec3, maxDistanceMeters?: number): Vec3 | null;
  computePath(start: Vec3, goal: Vec3): Vec3[] | null;
  destroy(): void;
};

export function createNavigationConfig(profile: AgentProfile) {
  return {
    cs: CELL_SIZE_METERS,
    ch: CELL_HEIGHT_METERS,
    walkableSlopeAngle: profile.maxSlopeDegrees,
    walkableHeight: Math.max(
      3,
      Math.ceil(profile.heightMeters / CELL_HEIGHT_METERS),
    ),
    walkableRadius: Math.ceil(profile.radiusMeters / CELL_SIZE_METERS),
    walkableClimb: Math.floor(
      profile.stepHeightMeters / CELL_HEIGHT_METERS + Number.EPSILON * 10,
    ),
    maxEdgeLen: 12,
    maxSimplificationError: 1.3,
    minRegionArea: 8,
    mergeRegionArea: 20,
    maxVertsPerPoly: 6,
    detailSampleDist: 6,
    detailSampleMaxError: 1,
  };
}

function ensureRecastInitialized(): Promise<void> {
  recastInitialization ??= init();
  return recastInitialization;
}

function distanceBetween(first: Vec3, second: Vec3): number {
  return Math.hypot(
    first.x - second.x,
    first.y - second.y,
    first.z - second.z,
  );
}

export async function buildNavigationSurface(
  meshes: THREE.Mesh[],
  profile: AgentProfile,
): Promise<NavigationSurface> {
  if (meshes.length === 0) {
    throw new Error("The collider does not contain any mesh geometry.");
  }

  await ensureRecastInitialized();
  meshes.forEach((mesh) => mesh.updateWorldMatrix(true, false));

  const generated = threeToSoloNavMesh(meshes, createNavigationConfig(profile));
  if (!generated.success) {
    throw new Error(`Navigation mesh generation failed: ${generated.error}`);
  }

  const { navMesh } = generated;
  const query = new NavMeshQuery(navMesh, { maxNodes: 4_096 });
  let destroyed = false;

  return {
    findNearestPoint(point, maxDistanceMeters = 0.75) {
      if (destroyed) {
        return null;
      }
      const result = query.findClosestPoint(point, {
        halfExtents: {
          x: maxDistanceMeters,
          y: maxDistanceMeters,
          z: maxDistanceMeters,
        },
      });
      if (
        !result.success ||
        distanceBetween(point, result.point) > maxDistanceMeters
      ) {
        return null;
      }
      return result.point;
    },

    computePath(start, goal) {
      if (destroyed) {
        return null;
      }
      const result = query.computePath(start, goal, {
        halfExtents: { x: 0.75, y: 0.75, z: 0.75 },
        maxPathPolys: 512,
        maxStraightPathPoints: 512,
      });
      const lastPoint = result.path.at(-1);
      const reachesGoal =
        lastPoint !== undefined &&
        distanceBetween(lastPoint, goal) <= CELL_SIZE_METERS * 2;
      return result.success && result.path.length >= 2 && reachesGoal
        ? result.path
        : null;
    },

    destroy() {
      if (destroyed) {
        return;
      }
      destroyed = true;
      query.destroy();
      navMesh.destroy();
    },
  };
}

export function findRoute(
  surface: NavigationSurface,
  requestedStart: Vec3,
  requestedGoal: Vec3,
  projectionDistanceMeters = 0.75,
): RouteResult {
  const start = surface.findNearestPoint(
    requestedStart,
    projectionDistanceMeters,
  );
  if (!start) {
    return {
      success: false,
      failure: "invalid-start",
      location: requestedStart,
    };
  }

  const goal = surface.findNearestPoint(
    requestedGoal,
    projectionDistanceMeters,
  );
  if (!goal) {
    return {
      success: false,
      failure: "invalid-goal",
      location: requestedGoal,
    };
  }

  const path = surface.computePath(start, goal);
  if (!path) {
    return {
      success: false,
      failure: "unreachable",
      location: goal,
    };
  }

  return { success: true, path, start, goal };
}
