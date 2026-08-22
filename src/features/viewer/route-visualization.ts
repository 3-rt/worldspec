import type { Vec3 } from "@/features/analysis/schemas";

export type ClearanceStation = {
  center: Vec3;
  left: Vec3;
  right: Vec3;
  distanceMeters: number;
};

export type ClearanceCorridor = {
  centerline: Vec3[];
  leftRail: Vec3[];
  rightRail: Vec3[];
  gates: ClearanceStation[];
  stations: ClearanceStation[];
  lengthMeters: number;
};

const STATION_SPACING_METERS = 0.35;
const ROUTE_ELEVATION_METERS = 0.08;

function distanceBetween(start: Vec3, end: Vec3): number {
  return Math.hypot(end.x - start.x, end.y - start.y, end.z - start.z);
}

function pointAtDistance(
  path: Vec3[],
  cumulativeDistances: number[],
  distanceMeters: number,
): Vec3 {
  const lastIndex = path.length - 1;
  if (distanceMeters >= cumulativeDistances[lastIndex]) {
    return { ...path[lastIndex] };
  }

  let segmentIndex = 1;
  while (cumulativeDistances[segmentIndex] < distanceMeters) {
    segmentIndex += 1;
  }
  const segmentStart = path[segmentIndex - 1];
  const segmentEnd = path[segmentIndex];
  const segmentDistance =
    cumulativeDistances[segmentIndex] - cumulativeDistances[segmentIndex - 1];
  const progress =
    segmentDistance === 0
      ? 0
      : (distanceMeters - cumulativeDistances[segmentIndex - 1]) /
        segmentDistance;

  return {
    x: segmentStart.x + (segmentEnd.x - segmentStart.x) * progress,
    y: segmentStart.y + (segmentEnd.y - segmentStart.y) * progress,
    z: segmentStart.z + (segmentEnd.z - segmentStart.z) * progress,
  };
}

export function buildClearanceCorridor(
  path: Vec3[],
  clearanceWidthMeters: number,
): ClearanceCorridor {
  if (path.length < 2) {
    return {
      centerline: [],
      leftRail: [],
      rightRail: [],
      gates: [],
      stations: [],
      lengthMeters: 0,
    };
  }

  const cumulativeDistances = [0];
  for (let index = 1; index < path.length; index += 1) {
    cumulativeDistances.push(
      cumulativeDistances[index - 1] +
        distanceBetween(path[index - 1], path[index]),
    );
  }
  const lengthMeters = cumulativeDistances.at(-1) ?? 0;
  if (lengthMeters <= Number.EPSILON) {
    return {
      centerline: [],
      leftRail: [],
      rightRail: [],
      gates: [],
      stations: [],
      lengthMeters: 0,
    };
  }
  const stationDistances: number[] = [];
  for (
    let distance = 0;
    distance < lengthMeters;
    distance += STATION_SPACING_METERS
  ) {
    stationDistances.push(distance);
  }
  stationDistances.push(lengthMeters);

  const centers = stationDistances.map((distance) => {
    const point = pointAtDistance(path, cumulativeDistances, distance);
    return { ...point, y: point.y + ROUTE_ELEVATION_METERS };
  });
  const halfWidth = clearanceWidthMeters / 2;
  const stations = centers.map((center, index): ClearanceStation => {
    const previous = centers[Math.max(0, index - 1)];
    const next = centers[Math.min(centers.length - 1, index + 1)];
    const tangentX = next.x - previous.x;
    const tangentZ = next.z - previous.z;
    const tangentLength = Math.hypot(tangentX, tangentZ) || 1;
    const normalX = -tangentZ / tangentLength;
    const normalZ = tangentX / tangentLength;

    return {
      center,
      left: {
        x: center.x + normalX * halfWidth,
        y: center.y,
        z: center.z + normalZ * halfWidth,
      },
      right: {
        x: center.x - normalX * halfWidth,
        y: center.y,
        z: center.z - normalZ * halfWidth,
      },
      distanceMeters: stationDistances[index],
    };
  });

  return {
    centerline: stations.map((station) => station.center),
    leftRail: stations.map((station) => station.left),
    rightRail: stations.map((station) => station.right),
    gates: stations.filter(
      (_station, index) => index % 2 === 0 || index === stations.length - 1,
    ),
    stations,
    lengthMeters,
  };
}
