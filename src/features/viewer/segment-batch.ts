import * as THREE from "three";

import type { Vec3 } from "@/features/analysis/schemas";

export type StraightSegment = {
  start: Vec3;
  end: Vec3;
};

type SegmentBatchOptions = {
  color: number;
  opacity?: number;
  radius: number;
  renderOrder: number;
};

const Y_AXIS = new THREE.Vector3(0, 1, 0);

export function segmentsBetween(points: Vec3[]): StraightSegment[] {
  return points.slice(1).map((end, index) => ({
    start: points[index],
    end,
  }));
}

export function createSegmentBatch(
  segments: StraightSegment[],
  options: SegmentBatchOptions,
): THREE.InstancedMesh | null {
  const renderableSegments = segments.filter(
    ({ start, end }) =>
      start.x !== end.x || start.y !== end.y || start.z !== end.z,
  );
  if (renderableSegments.length === 0) {
    return null;
  }

  const geometry = new THREE.CylinderGeometry(
    options.radius,
    options.radius,
    1,
    6,
    1,
    false,
  );
  const material = new THREE.MeshBasicMaterial({
    color: options.color,
    depthTest: false,
    depthWrite: false,
    transparent: true,
    opacity: options.opacity ?? 1,
  });
  const batch = new THREE.InstancedMesh(
    geometry,
    material,
    renderableSegments.length,
  );
  const start = new THREE.Vector3();
  const end = new THREE.Vector3();
  const direction = new THREE.Vector3();
  const midpoint = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const matrix = new THREE.Matrix4();

  renderableSegments.forEach((segment, index) => {
    start.set(segment.start.x, segment.start.y, segment.start.z);
    end.set(segment.end.x, segment.end.y, segment.end.z);
    direction.subVectors(end, start);
    const length = direction.length();
    quaternion.setFromUnitVectors(Y_AXIS, direction.normalize());
    midpoint.addVectors(start, end).multiplyScalar(0.5);
    scale.set(1, length, 1);
    matrix.compose(midpoint, quaternion, scale);
    batch.setMatrixAt(index, matrix);
  });
  batch.instanceMatrix.needsUpdate = true;
  batch.renderOrder = options.renderOrder;
  return batch;
}
