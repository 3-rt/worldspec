import {
  createServerWorldLabsClient,
  worldLabsRouteError,
} from "@/lib/worldlabs/server";

type OperationRouteContext = {
  params: Promise<{ operationId: string }>;
};

export async function GET(
  _request: Request,
  context: OperationRouteContext,
): Promise<Response> {
  const { operationId } = await context.params;
  if (!operationId.trim()) {
    return Response.json(
      {
        error: {
          code: "invalid-request",
          message: "Choose a valid World Labs operation.",
        },
      },
      { status: 400 },
    );
  }

  try {
    const operation = await createServerWorldLabsClient().getOperation(
      operationId.trim(),
    );
    return Response.json(operation);
  } catch (error) {
    return worldLabsRouteError(error);
  }
}
