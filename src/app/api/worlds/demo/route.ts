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
    return Response.json(world);
  } catch (error) {
    return worldLabsRouteError(error);
  }
}
