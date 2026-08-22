import type * as THREE from "three";

import {
  buildNavigationSurface,
  findRoute,
  type NavigationFailure,
  type NavigationSurface,
} from "./navigation";
import type {
  AnalysisFailure,
  AnalysisReport,
  Vec3,
  WorldContract,
} from "./schemas";

export type NavigationSurfaceFactory = (
  meshes: THREE.Mesh[],
  profile: WorldContract["agent"],
) => Promise<NavigationSurface>;

export type AnalyzeWorldInput = {
  meshes: THREE.Mesh[];
  contract: WorldContract;
  createSurface?: NavigationSurfaceFactory;
  now?: () => number;
};

function routeLength(path: Vec3[]): number {
  let total = 0;
  for (let index = 1; index < path.length; index += 1) {
    const previous = path[index - 1];
    const current = path[index];
    total += Math.hypot(
      current.x - previous.x,
      current.y - previous.y,
      current.z - previous.z,
    );
  }
  return total;
}

function failureForNavigation(
  failure: NavigationFailure,
  location: Vec3,
): AnalysisFailure {
  const messages: Record<NavigationFailure, string> = {
    "invalid-start": "The entrance is not on a walkable surface.",
    "invalid-goal": "The destination is not on a walkable surface.",
    unreachable: "No connected walkable route reaches the destination.",
  };
  return { kind: failure, message: messages[failure], location };
}

function failedReport(
  failure: AnalysisFailure,
  elapsedMs: number,
): AnalysisReport {
  return {
    status: "fail",
    path: [],
    routeLengthMeters: 0,
    failures: [failure],
    elapsedMs,
  };
}

export async function analyzeWorld({
  meshes,
  contract,
  createSurface = buildNavigationSurface,
  now = () => performance.now(),
}: AnalyzeWorldInput): Promise<AnalysisReport> {
  const startedAt = now();

  if (!contract.start) {
    return failedReport(
      {
        kind: "invalid-start",
        message: "Place an entrance on the world before running the test.",
      },
      now() - startedAt,
    );
  }

  if (!contract.goal) {
    return failedReport(
      {
        kind: "invalid-goal",
        message: "Place a destination on the world before running the test.",
      },
      now() - startedAt,
    );
  }

  const surface = await createSurface(meshes, contract.agent);
  try {
    const route = findRoute(surface, contract.start, contract.goal);
    if (!route.success) {
      return failedReport(
        failureForNavigation(route.failure, route.location),
        now() - startedAt,
      );
    }

    return {
      status: "pass",
      path: route.path,
      routeLengthMeters: routeLength(route.path),
      failures: [],
      elapsedMs: now() - startedAt,
    };
  } finally {
    surface.destroy();
  }
}
