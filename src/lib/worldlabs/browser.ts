import { z, type ZodType } from "zod";

import {
  type WorldAssets,
  type WorldOperation,
  worldAssetsSchema,
  worldOperationSchema,
} from "./schemas";

type FetchLike = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

type Wait = (milliseconds: number, signal?: AbortSignal) => Promise<void>;

type BrowserClientOptions = {
  fetch?: FetchLike;
  signal?: AbortSignal;
};

type PollOptions = BrowserClientOptions & {
  wait?: Wait;
  intervalMs?: number;
  maxAttempts?: number;
  onProgress?: (operation: WorldOperation) => void;
};

type GenerationInput = {
  displayName: string;
  prompt: string;
};

const apiErrorSchema = z.object({
  error: z.object({
    message: z.string(),
  }),
});

async function readJson<T extends ZodType>(
  response: Response,
  schema: T,
): Promise<z.infer<T>> {
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = apiErrorSchema.safeParse(payload);
    throw new Error(
      error.success ? error.data.error.message : "World Labs request failed.",
    );
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new Error("World Labs returned data WorldSpec could not read.");
  }
  return parsed.data;
}

const defaultWait: Wait = (milliseconds, signal) =>
  new Promise((resolve, reject) => {
    const timer = window.setTimeout(resolve, milliseconds);
    signal?.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timer);
        reject(new DOMException("The operation was aborted.", "AbortError"));
      },
      { once: true },
    );
  });

export async function fetchPreparedWorld({
  fetch: fetchImplementation = globalThis.fetch,
  signal,
}: BrowserClientOptions = {}): Promise<WorldAssets> {
  const response = await fetchImplementation("/api/worlds/demo", {
    cache: "no-store",
    signal,
  });
  return readJson(response, worldAssetsSchema);
}

export async function generateAndPollWorld(
  input: GenerationInput,
  {
    fetch: fetchImplementation = globalThis.fetch,
    signal,
    wait = defaultWait,
    intervalMs = 5_000,
    maxAttempts = 120,
    onProgress,
  }: PollOptions = {},
): Promise<WorldOperation> {
  const generationResponse = await fetchImplementation("/api/worlds/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal,
  });
  let operation = await readJson(generationResponse, worldOperationSchema);
  onProgress?.(operation);

  for (let attempt = 0; !operation.done && attempt < maxAttempts; attempt += 1) {
    await wait(intervalMs, signal);
    const response = await fetchImplementation(
      `/api/operations/${encodeURIComponent(operation.operationId)}`,
      { cache: "no-store", signal },
    );
    operation = await readJson(response, worldOperationSchema);
    onProgress?.(operation);
  }

  if (!operation.done) {
    throw new Error(
      "World generation is taking longer than expected. The prepared demo remains available.",
    );
  }
  if (operation.error) {
    throw new Error(operation.error);
  }
  if (operation.worldId) {
    const response = await fetchImplementation(
      `/api/worlds/${encodeURIComponent(operation.worldId)}`,
      { cache: "no-store", signal },
    );
    const world = await readJson(response, worldAssetsSchema);
    return { ...operation, world };
  }
  if (!operation.world) {
    throw new Error("World generation did not return a world.");
  }

  return operation;
}
