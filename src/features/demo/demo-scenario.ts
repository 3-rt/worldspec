import type { Vec3 } from "@/features/analysis/schemas";

export type DemoProfile = {
  label: string;
  widthMeters: number;
  expected: "pass" | "fail";
};

export type DemoScenario = {
  worldId: string;
  route: {
    start: Vec3;
    goal: Vec3;
    expectedLengthMeters: number;
  };
  profiles: [DemoProfile, DemoProfile];
};

const preparedScenario: DemoScenario = {
  worldId: "90307e9c-afa8-47f9-9182-68ff5846378f",
  route: {
    start: {
      x: -3.0457801818847656,
      y: -0.35237205028533936,
      z: 0.09084892272949219,
    },
    goal: {
      x: 3.2542200088500977,
      y: -0.45237207412719727,
      z: 0.09084892272949219,
    },
    expectedLengthMeters: 6.3,
  },
  profiles: [
    { label: "Explorer", widthMeters: 0.7, expected: "pass" },
    { label: "Rescue bot", widthMeters: 1.4, expected: "fail" },
  ],
};

export function getDemoScenario(worldId: string): DemoScenario | null {
  return worldId === preparedScenario.worldId ? preparedScenario : null;
}
