import { resolveDemoWorld } from "@/lib/worldlabs/demo-world";
import {
  createServerWorldLabsClient,
  worldLabsRouteError,
} from "@/lib/worldlabs/server";

export async function GET(): Promise<Response> {
  try {
    const world = await resolveDemoWorld(
      process.env.DEMO_WORLD_ID ?? "",
      createServerWorldLabsClient(),
    );
    return Response.json(world, {
      headers: {
        "Cache-Control":
          "public, max-age=15, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    return worldLabsRouteError(error);
  }
}
