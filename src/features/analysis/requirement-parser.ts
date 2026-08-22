import {
  type AgentProfile,
  type WorldContract,
  worldContractSchema,
} from "./schemas";

const NUMBER = String.raw`(\d+(?:\.\d+)?)`;
const UNIT = String.raw`(centimeters?|centimetres?|cm|meters?|metres?|m)\b`;

function toMeters(value: string, unit: string): number {
  const parsedValue = Number.parseFloat(value);
  return unit.toLowerCase().startsWith("c")
    ? parsedValue / 100
    : parsedValue;
}

function findMeasurement(
  sourceText: string,
  keywords: readonly string[],
): number | null {
  const keywordGroup = keywords.join("|");
  const valueBeforeKeyword = new RegExp(
    `${NUMBER}\\s*${UNIT}\\s*(?:in\\s+)?(?:${keywordGroup})`,
    "i",
  );
  const keywordBeforeValue = new RegExp(
    `(?:${keywordGroup})(?:\\s+of|\\s+is|\\s*:)?\\s*${NUMBER}\\s*${UNIT}`,
    "i",
  );

  const beforeMatch = sourceText.match(valueBeforeKeyword);
  if (beforeMatch) {
    return toMeters(beforeMatch[1], beforeMatch[2]);
  }

  const afterMatch = sourceText.match(keywordBeforeValue);
  if (afterMatch) {
    return toMeters(afterMatch[1], afterMatch[2]);
  }

  return null;
}

export function compileRequirement(
  sourceText: string,
  baseAgent: AgentProfile,
): WorldContract {
  const normalizedSource = sourceText.trim();
  const heightMeters = findMeasurement(normalizedSource, ["height", "tall"]);
  const widthMeters = findMeasurement(normalizedSource, ["width", "wide"]);

  return worldContractSchema.parse({
    sourceText: normalizedSource,
    start: null,
    goal: null,
    requirePath: true,
    minimumClearanceMeters: widthMeters ?? baseAgent.radiusMeters * 2,
    agent: {
      ...baseAgent,
      heightMeters: heightMeters ?? baseAgent.heightMeters,
      radiusMeters: widthMeters ? widthMeters / 2 : baseAgent.radiusMeters,
      stepHeightMeters: baseAgent.stepHeightMeters,
    },
  });
}
