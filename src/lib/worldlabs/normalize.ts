import { WorldLabsError } from "./errors";
import {
  type WorldAssets,
  worldApiSchema,
  worldAssetsSchema,
} from "./schemas";

export function normalizeWorld(input: unknown): WorldAssets {
  const parsed = worldApiSchema.safeParse(input);
  if (!parsed.success) {
    throw new WorldLabsError(
      "invalid-response",
      "World Labs returned an invalid world response.",
      502,
    );
  }

  const world = parsed.data;
  const spzUrls = world.assets.splats.spz_urls;
  const colliderGlbUrl = world.assets.mesh.collider_mesh_url;

  if (!spzUrls["500k"] || !colliderGlbUrl) {
    throw new WorldLabsError(
      "incomplete-world",
      "World assets are incomplete. A 500k SPZ and collider mesh are required.",
      422,
    );
  }

  return worldAssetsSchema.parse({
    worldId: world.id,
    displayName: world.display_name,
    caption: world.assets.caption ?? "",
    marbleUrl: world.world_marble_url,
    thumbnailUrl: world.assets.thumbnail_url ?? null,
    splatUrl: spzUrls["500k"],
    availableSplats: {
      preview: spzUrls["100k"] ?? null,
      interactive: spzUrls["500k"],
      full: spzUrls.full_res ?? null,
    },
    colliderGlbUrl,
    metricScaleFactor:
      world.assets.splats.semantics_metadata.metric_scale_factor,
    groundPlaneOffset:
      world.assets.splats.semantics_metadata.ground_plane_offset,
    prompt: world.world_prompt?.text_prompt ?? "",
    model: world.model ?? "",
  });
}
