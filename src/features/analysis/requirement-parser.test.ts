import { describe, expect, test } from "vitest";

import { compileRequirement } from "./requirement-parser";
import { defaultAgentProfile } from "./schemas";

describe("compileRequirement", () => {
  test("keeps normal step tolerance when jumping is prohibited", () => {
    const result = compileRequirement(
      "A player who is 1.8 m tall and 0.7 m wide must reach the platform without jumping.",
      defaultAgentProfile,
    );

    expect(result).toMatchObject({
      sourceText:
        "A player who is 1.8 m tall and 0.7 m wide must reach the platform without jumping.",
      agent: {
        heightMeters: 1.8,
        radiusMeters: 0.35,
        stepHeightMeters: 0.3,
      },
      minimumClearanceMeters: 0.7,
      requirePath: true,
      start: null,
      goal: null,
    });
  });

  test("uses the supplied profile when the sentence omits measurements", () => {
    const result = compileRequirement(
      "Reach the observation platform.",
      defaultAgentProfile,
    );

    expect(result).toMatchObject({
      sourceText: "Reach the observation platform.",
      agent: defaultAgentProfile,
      minimumClearanceMeters: 0.7,
      requirePath: true,
    });
  });

  test("understands metre spelling variants without matching unrelated numbers", () => {
    const result = compileRequirement(
      "Route 2 must support an avatar with a height of 1.65 metres and a width of 60 centimeters.",
      defaultAgentProfile,
    );

    expect(result.agent).toMatchObject({
      heightMeters: 1.65,
      radiusMeters: 0.3,
    });
    expect(result.minimumClearanceMeters).toBe(0.6);
  });
});
