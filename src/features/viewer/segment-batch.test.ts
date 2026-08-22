import * as THREE from "three";
import { describe, expect, test } from "vitest";

import { createSegmentBatch } from "./segment-batch";

describe("createSegmentBatch", () => {
  test("renders every straight segment in one instanced draw call", () => {
    const batch = createSegmentBatch(
      [
        {
          start: { x: 0, y: 0, z: 0 },
          end: { x: 0, y: 0, z: 1 },
        },
        {
          start: { x: 0, y: 0, z: 1 },
          end: { x: 1, y: 0, z: 1 },
        },
      ],
      { color: 0xffffff, radius: 0.01, renderOrder: 1 },
    );

    expect(batch).toBeInstanceOf(THREE.InstancedMesh);
    expect(batch?.count).toBe(2);
  });
});
