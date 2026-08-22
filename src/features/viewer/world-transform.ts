import type { Vec3 } from "@/features/analysis/schemas";

export type WorldSemantics = {
  metricScaleFactor: number;
  groundPlaneOffset: number;
};

export type ObjectTransform = {
  scale: Vec3;
  position: Vec3;
  rotation: Vec3;
};

export function toMetricPosition(
  rawPosition: Vec3,
  semantics: WorldSemantics,
): Vec3 {
  return {
    x: rawPosition.x * semantics.metricScaleFactor,
    y:
      rawPosition.y * semantics.metricScaleFactor -
      semantics.groundPlaneOffset,
    z: rawPosition.z * semantics.metricScaleFactor,
  };
}

export function toThreePosition(
  rawPosition: Vec3,
  semantics: WorldSemantics,
): Vec3 {
  const metricPosition = toMetricPosition(rawPosition, semantics);
  return {
    x: metricPosition.x,
    y: -metricPosition.y,
    z: -metricPosition.z,
  };
}

export function fromThreePosition(
  position: Vec3,
  semantics: WorldSemantics,
): Vec3 {
  return {
    x: position.x / semantics.metricScaleFactor,
    y:
      (-position.y + semantics.groundPlaneOffset) /
      semantics.metricScaleFactor,
    z: -position.z / semantics.metricScaleFactor,
  };
}

export function createMarbleSplatTransform(
  semantics: WorldSemantics,
): ObjectTransform {
  const scale = semantics.metricScaleFactor;
  return {
    scale: { x: scale, y: scale, z: scale },
    position: { x: 0, y: semantics.groundPlaneOffset, z: 0 },
    rotation: { x: Math.PI, y: 0, z: 0 },
  };
}

export function createMarbleColliderTransform(): ObjectTransform {
  return {
    scale: { x: 1, y: 1, z: 1 },
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: Math.PI, y: 0, z: 0 },
  };
}
