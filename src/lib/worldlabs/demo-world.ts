import type { WorldLabsClient } from "./client";
import { WorldLabsError } from "./errors";

type DemoWorldClient = Pick<WorldLabsClient, "getWorld">;

export async function resolveDemoWorld(
  worldId: string,
  client: DemoWorldClient,
) {
  const normalizedWorldId = worldId.trim();
  if (!normalizedWorldId) {
    throw new WorldLabsError(
      "demo-not-configured",
      "The prepared Marble world is not configured yet.",
      503,
    );
  }

  return client.getWorld(normalizedWorldId);
}
