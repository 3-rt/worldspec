import { WorldLabsError, worldLabsErrorFromStatus } from "./errors";
import { normalizeWorld } from "./normalize";
import {
  operationApiSchema,
  type WorldAssets,
  type WorldOperation,
  worldOperationSchema,
  worldResponseSchema,
} from "./schemas";

type FetchLike = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

type ClientOptions = {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  fetch?: FetchLike;
};

type GenerateWorldInput = {
  displayName: string;
  prompt: string;
};

export type WorldLabsClient = {
  getWorld(worldId: string): Promise<WorldAssets>;
  generateWorld(input: GenerateWorldInput): Promise<WorldOperation>;
  getOperation(operationId: string): Promise<WorldOperation>;
};

function normalizeOperation(input: unknown): WorldOperation {
  const parsed = operationApiSchema.safeParse(input);
  if (!parsed.success) {
    throw new WorldLabsError(
      "invalid-response",
      "World Labs returned an invalid operation response.",
      502,
    );
  }

  const operation = parsed.data;
  return worldOperationSchema.parse({
    operationId: operation.operation_id,
    done: operation.done,
    status: operation.metadata?.progress.status ?? "PENDING",
    description: operation.metadata?.progress.description ?? "Queued",
    worldId: operation.metadata?.world_id ?? null,
    error: operation.error ? "World generation failed." : null,
    world: operation.response ? normalizeWorld(operation.response) : null,
  });
}

export function createWorldLabsClient({
  apiKey,
  baseUrl = "https://api.worldlabs.ai",
  model = "marble-1.1",
  fetch: fetchImplementation = globalThis.fetch,
}: ClientOptions): WorldLabsClient {
  const normalizedApiKey = apiKey.trim();
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");

  if (!normalizedApiKey) {
    throw new WorldLabsError(
      "configuration",
      "WORLDLABS_API_KEY is not configured.",
      500,
    );
  }

  async function request(path: string, init: RequestInit): Promise<unknown> {
    let response: Response;
    try {
      response = await fetchImplementation(`${normalizedBaseUrl}${path}`, {
        ...init,
        cache: "no-store",
        headers: {
          "WLT-Api-Key": normalizedApiKey,
          ...(init.body ? { "Content-Type": "application/json" } : {}),
          ...init.headers,
        },
      });
    } catch {
      throw new WorldLabsError(
        "network",
        "World Labs could not be reached.",
        502,
      );
    }

    if (!response.ok) {
      throw worldLabsErrorFromStatus(response.status);
    }

    try {
      return await response.json();
    } catch {
      throw new WorldLabsError(
        "invalid-response",
        "World Labs returned unreadable data.",
        502,
      );
    }
  }

  return {
    async getWorld(worldId) {
      const payload = await request(
        `/marble/v1/worlds/${encodeURIComponent(worldId)}`,
        { method: "GET" },
      );
      const parsed = worldResponseSchema.safeParse(payload);
      if (!parsed.success) {
        throw new WorldLabsError(
          "invalid-response",
          "World Labs returned an invalid world response.",
          502,
        );
      }
      return normalizeWorld(parsed.data);
    },

    async generateWorld({ displayName, prompt }) {
      const payload = await request("/marble/v1/worlds:generate", {
        method: "POST",
        body: JSON.stringify({
          display_name: displayName,
          model,
          world_prompt: {
            type: "text",
            text_prompt: prompt,
          },
        }),
      });
      return normalizeOperation(payload);
    },

    async getOperation(operationId) {
      const payload = await request(
        `/marble/v1/operations/${encodeURIComponent(operationId)}`,
        { method: "GET" },
      );
      return normalizeOperation(payload);
    },
  };
}
