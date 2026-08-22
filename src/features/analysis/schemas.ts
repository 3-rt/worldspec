import { z } from "zod";

export const vec3Schema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
  z: z.number().finite(),
});

export type Vec3 = z.infer<typeof vec3Schema>;

export const agentProfileSchema = z.object({
  radiusMeters: z.number().positive().max(10),
  heightMeters: z.number().positive().max(20),
  maxSlopeDegrees: z.number().min(0).max(89),
  stepHeightMeters: z.number().nonnegative().max(5),
});

export type AgentProfile = z.infer<typeof agentProfileSchema>;

export const defaultAgentProfile: AgentProfile = {
  radiusMeters: 0.35,
  heightMeters: 1.8,
  maxSlopeDegrees: 45,
  stepHeightMeters: 0.3,
};

export const worldContractSchema = z.object({
  sourceText: z.string().trim().min(1).max(1_500),
  start: vec3Schema.nullable(),
  goal: vec3Schema.nullable(),
  requirePath: z.boolean(),
  minimumClearanceMeters: z.number().positive().max(20),
  agent: agentProfileSchema,
});

export type WorldContract = z.infer<typeof worldContractSchema>;

export const analysisFailureSchema = z.object({
  kind: z.enum([
    "invalid-start",
    "invalid-goal",
    "unreachable",
    "clearance",
    "alignment",
  ]),
  message: z.string().min(1),
  location: vec3Schema.optional(),
  measuredValue: z.number().optional(),
  requiredValue: z.number().optional(),
});

export type AnalysisFailure = z.infer<typeof analysisFailureSchema>;

export const analysisReportSchema = z.object({
  status: z.enum(["pass", "fail"]),
  path: z.array(vec3Schema),
  routeLengthMeters: z.number().nonnegative(),
  minimumClearanceMeters: z.number().nonnegative().optional(),
  failures: z.array(analysisFailureSchema),
  elapsedMs: z.number().nonnegative(),
});

export type AnalysisReport = z.infer<typeof analysisReportSchema>;
