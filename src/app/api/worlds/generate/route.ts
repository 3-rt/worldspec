import { z } from "zod";

import {
  createServerWorldLabsClient,
  isWorldGenerationEnabled,
  worldLabsRouteError,
} from "@/lib/worldlabs/server";

const generationRequestSchema = z.object({
  displayName: z.string().trim().min(1).max(100),
  prompt: z.string().trim().min(1).max(1_500),
});

export async function POST(request: Request): Promise<Response> {
  if (!isWorldGenerationEnabled()) {
    return Response.json(
      {
        error: {
          code: "generation-disabled",
          message: "New Marble world generation is disabled on this deployment.",
        },
      },
      { status: 403 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json(
      {
        error: {
          code: "invalid-request",
          message: "Send a valid JSON generation request.",
        },
      },
      { status: 400 },
    );
  }

  const parsed = generationRequestSchema.safeParse(payload);
  if (!parsed.success) {
    const prompt =
      typeof payload === "object" && payload !== null && "prompt" in payload
        ? String(payload.prompt).trim()
        : "";
    const message = !prompt
      ? "Enter a world prompt before generating."
      : prompt.length > 1_500
        ? "World prompts must be 1,500 characters or fewer."
        : "Enter a concise display name before generating.";

    return Response.json(
      { error: { code: "invalid-request", message } },
      { status: 400 },
    );
  }

  try {
    const operation = await createServerWorldLabsClient().generateWorld(
      parsed.data,
    );
    return Response.json(operation, { status: 202 });
  } catch (error) {
    return worldLabsRouteError(error);
  }
}
