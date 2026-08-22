import { describe, expect, test } from "vitest";

import {
  createMarbleColliderTransform,
  createMarbleSplatTransform,
  fromThreePosition,
  toMetricPosition,
  toThreePosition,
} from "./world-transform";

const semantics = {
  metricScaleFactor: 1.25,
  groundPlaneOffset: 0.4,
};

describe("Marble world coordinate transforms", () => {
  test("applies metric scale and ground alignment before axis conversion", () => {
    expect(toMetricPosition({ x: 2, y: 3, z: 4 }, semantics)).toEqual({
      x: 2.5,
      y: 3.35,
      z: 5,
    });
  });

  test("composes the documented transform for a Three.js object", () => {
    expect(createMarbleSplatTransform(semantics)).toEqual({
      scale: { x: 1.25, y: 1.25, z: 1.25 },
      position: { x: 0, y: 0.4, z: 0 },
      rotation: { x: Math.PI, y: 0, z: 0 },
    });
    expect(toThreePosition({ x: 2, y: 3, z: 4 }, semantics)).toEqual({
      x: 2.5,
      y: -3.35,
      z: -5,
    });
  });

  test("converts the metric collider from OpenCV to Three axes", () => {
    expect(createMarbleColliderTransform()).toEqual({
      scale: { x: 1, y: 1, z: 1 },
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: Math.PI, y: 0, z: 0 },
    });
  });

  test("round-trips selection coordinates without measurable drift", () => {
    const raw = { x: -1.75, y: 0.82, z: 4.125 };
    const restored = fromThreePosition(toThreePosition(raw, semantics), semantics);

    expect(restored.x).toBeCloseTo(raw.x, 6);
    expect(restored.y).toBeCloseTo(raw.y, 6);
    expect(restored.z).toBeCloseTo(raw.z, 6);
  });
});
