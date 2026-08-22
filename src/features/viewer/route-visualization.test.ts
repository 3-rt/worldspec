import { describe, expect, test } from "vitest";

import {
  buildClearanceCorridor,
  pointAtCorridorProgress,
} from "./route-visualization";

describe("buildClearanceCorridor", () => {
  test("turns a route into a measured corridor with full-width rails", () => {
    const corridor = buildClearanceCorridor(
      [
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 2.1 },
      ],
      0.7,
    );

    expect(corridor.centerline[0]).toEqual({ x: 0, y: 0.08, z: 0 });
    expect(corridor.centerline.at(-1)).toEqual({ x: 0, y: 0.08, z: 2.1 });
    expect(corridor.lengthMeters).toBeCloseTo(2.1, 6);
    expect(corridor.gates.length).toBeGreaterThanOrEqual(4);

    corridor.stations.forEach((station) => {
      const railWidth = Math.hypot(
        station.right.x - station.left.x,
        station.right.z - station.left.z,
      );
      expect(railWidth).toBeCloseTo(0.7, 6);
    });
  });

  test("keeps the route endpoint and stable rail spacing around a corner", () => {
    const corridor = buildClearanceCorridor(
      [
        { x: 0, y: 0.2, z: 0 },
        { x: 0, y: 0.2, z: 1 },
        { x: 1, y: 0.2, z: 1 },
      ],
      1,
    );

    expect(corridor.centerline.at(-1)).toEqual({ x: 1, y: 0.28, z: 1 });
    expect(corridor.centerline).toContainEqual({ x: 0, y: 0.28, z: 1 });
    expect(corridor.stations.at(-1)?.distanceMeters).toBeCloseTo(2, 6);
    expect(corridor.stations.at(-1)?.left.z).toBeCloseTo(1.5, 6);
    expect(corridor.stations.at(-1)?.right.z).toBeCloseTo(0.5, 6);
  });

  test("moves the scan marker piecewise-linearly through route vertices", () => {
    const corridor = buildClearanceCorridor(
      [
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 1 },
        { x: 1, y: 0, z: 1 },
      ],
      0.7,
    );

    expect(pointAtCorridorProgress(corridor, 0.5)).toEqual({
      x: 0,
      y: 0.08,
      z: 1,
    });
    expect(pointAtCorridorProgress(corridor, 0.75)).toEqual({
      x: 0.5,
      y: 0.08,
      z: 1,
    });
  });

  test("does not construct renderable geometry for a zero-length route", () => {
    const corridor = buildClearanceCorridor(
      [
        { x: 1, y: 2, z: 3 },
        { x: 1, y: 2, z: 3 },
      ],
      0.7,
    );

    expect(corridor).toEqual({
      centerline: [],
      leftRail: [],
      rightRail: [],
      gates: [],
      stations: [],
      lengthMeters: 0,
    });
  });
});
