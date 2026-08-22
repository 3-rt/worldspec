import { createWorldLabsClient } from "./client";
import { WorldLabsError } from "./errors";

export function createServerWorldLabsClient() {
  return createWorldLabsClient({
    apiKey: process.env.WORLDLABS_API_KEY ?? "",
    baseUrl:
      process.env.WORLDLABS_API_BASE_URL ?? "https://api.worldlabs.ai",
    model: process.env.WORLDLABS_MODEL ?? "marble-1.1",
  });
}

export function worldLabsRouteError(error: unknown): Response {
  if (error instanceof WorldLabsError) {
    return Response.json(
      { error: { code: error.code, message: error.message } },
      { status: error.status },
    );
  }

  return Response.json(
    {
      error: {
        code: "internal",
        message: "WorldSpec could not complete the request.",
      },
    },
    { status: 500 },
  );
}
