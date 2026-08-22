export const worldResponseFixture = {
  world: {
    id: "world-123",
    display_name: "Threshold Courtyard",
    tags: null,
    world_marble_url: "https://marble.worldlabs.ai/world/world-123",
    assets: {
      caption:
        "An orbital greenhouse with connected paths and a narrow maintenance passage.",
      thumbnail_url: "https://assets.example.test/world-123-thumbnail.webp",
      splats: {
        spz_urls: {
          "100k": "https://assets.example.test/world-123-100k.spz",
          "500k": "https://assets.example.test/world-123-500k.spz",
          full_res: "https://assets.example.test/world-123-full.spz",
        },
        semantics_metadata: {
          metric_scale_factor: 1.25,
          ground_plane_offset: 0.4,
        },
      },
      mesh: {
        collider_mesh_url:
          "https://assets.example.test/world-123-collider.glb",
        hq_mesh_url: null,
        full_res_mesh_url: null,
      },
      imagery: {
        pano_url: "https://assets.example.test/world-123-pano.webp",
      },
    },
    created_at: "2026-08-21T23:00:00Z",
    updated_at: "2026-08-21T23:05:00Z",
    permission: null,
    world_prompt: {
      type: "text",
      text_prompt: "An orbital greenhouse with a narrow passage.",
    },
    model: "marble-1.1",
  },
} as const;

export const pendingOperationFixture = {
  operation_id: "operation-123",
  created_at: "2026-08-21T23:00:00Z",
  updated_at: "2026-08-21T23:01:00Z",
  expires_at: "2026-08-22T00:00:00Z",
  done: false,
  error: null,
  metadata: {
    progress: {
      status: "IN_PROGRESS",
      description: "World generation in progress",
    },
    world_id: "world-123",
  },
  response: null,
} as const;

export const completedOperationFixture = {
  ...pendingOperationFixture,
  updated_at: "2026-08-21T23:05:00Z",
  done: true,
  metadata: {
    progress: {
      status: "SUCCEEDED",
      description: "World generation completed successfully",
    },
    world_id: "world-123",
  },
  response: worldResponseFixture.world,
} as const;
