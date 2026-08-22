import {
  createServerWorldLabsClient,
  worldLabsRouteError,
} from "@/lib/worldlabs/server";

type WorldRouteContext = {
  params: Promise<{ worldId: string }>;
};

export async function GET(
  _request: Request,
  context: WorldRouteContext,
): Promise<Response> {
  const { worldId } = await context.params;
  if (!worldId.trim()) {
    return Response.json(
      {
        error: {
          code: "invalid-request",
          message: "Choose a valid Marble world.",
        },
      },
      { status: 400 },
    );
  }

  try {
    const world = await createServerWorldLabsClient().getWorld(worldId.trim());
    return Response.json(world);
  } catch (error) {
    return worldLabsRouteError(error);
  }
}
