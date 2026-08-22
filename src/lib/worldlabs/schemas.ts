import { z } from "zod";

const optionalUrlSchema = z.union([z.string().url(), z.literal("")]).nullish();

export const worldApiSchema = z.object({
  id: z.string().min(1),
  display_name: z.string(),
  tags: z.array(z.string()).nullable().optional(),
  world_marble_url: z.string().url(),
  assets: z.object({
    caption: z.string().nullish(),
    thumbnail_url: optionalUrlSchema,
    splats: z.object({
      spz_urls: z.object({
        "100k": optionalUrlSchema,
        "500k": optionalUrlSchema,
        full_res: optionalUrlSchema,
      }),
      semantics_metadata: z.object({
        metric_scale_factor: z.number().positive(),
        ground_plane_offset: z.number().finite(),
      }),
    }),
    mesh: z.object({
      collider_mesh_url: optionalUrlSchema,
      hq_mesh_url: optionalUrlSchema,
      full_res_mesh_url: optionalUrlSchema,
    }),
    imagery: z
      .object({
        pano_url: optionalUrlSchema,
      })
      .optional(),
  }),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
  permission: z.unknown().nullable().optional(),
  world_prompt: z
    .object({
      type: z.string(),
      text_prompt: z.string().nullish(),
    })
    .passthrough()
    .nullable()
    .optional(),
  model: z.string().nullable().optional(),
});

export type WorldApi = z.infer<typeof worldApiSchema>;

export const worldResponseSchema = z.object({
  world: worldApiSchema,
});

export const worldAssetsSchema = z.object({
  worldId: z.string().min(1),
  displayName: z.string(),
  caption: z.string(),
  marbleUrl: z.string().url(),
  thumbnailUrl: z.string().url().nullable(),
  splatUrl: z.string().url(),
  availableSplats: z.object({
    preview: z.string().url().nullable(),
    interactive: z.string().url(),
    full: z.string().url().nullable(),
  }),
  colliderGlbUrl: z.string().url(),
  metricScaleFactor: z.number().positive(),
  groundPlaneOffset: z.number().finite(),
  prompt: z.string(),
  model: z.string(),
});

export type WorldAssets = z.infer<typeof worldAssetsSchema>;

export const operationApiSchema = z.object({
  operation_id: z.string().min(1),
  created_at: z.string(),
  updated_at: z.string(),
  expires_at: z.string(),
  done: z.boolean(),
  error: z.unknown().nullable(),
  metadata: z
    .object({
      progress: z.object({
        status: z.string().min(1),
        description: z.string(),
      }),
      world_id: z.string().min(1),
    })
    .nullable(),
  response: worldApiSchema.nullable(),
});

export const worldOperationSchema = z.object({
  operationId: z.string().min(1),
  done: z.boolean(),
  status: z.string().min(1),
  description: z.string(),
  worldId: z.string().nullable(),
  error: z.string().nullable(),
  world: worldAssetsSchema.nullable(),
});

export type WorldOperation = z.infer<typeof worldOperationSchema>;
