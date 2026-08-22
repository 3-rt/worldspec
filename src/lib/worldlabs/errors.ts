export type WorldLabsErrorCode =
  | "configuration"
  | "invalid-response"
  | "incomplete-world"
  | "unauthorized"
  | "payment-required"
  | "rate-limited"
  | "upstream"
  | "network";

export class WorldLabsError extends Error {
  readonly code: WorldLabsErrorCode;
  readonly status: number;

  constructor(code: WorldLabsErrorCode, message: string, status = 500) {
    super(message);
    this.name = "WorldLabsError";
    this.code = code;
    this.status = status;
  }
}

export function worldLabsErrorFromStatus(status: number): WorldLabsError {
  if (status === 401 || status === 403) {
    return new WorldLabsError(
      "unauthorized",
      "World Labs rejected the configured API credentials.",
      status,
    );
  }

  if (status === 402) {
    return new WorldLabsError(
      "payment-required",
      "World Labs requires additional generation credits.",
      status,
    );
  }

  if (status === 429) {
    return new WorldLabsError(
      "rate-limited",
      "World Labs is rate limiting requests. Try again shortly.",
      status,
    );
  }

  return new WorldLabsError(
    "upstream",
    "World Labs could not complete the request.",
    status >= 400 && status <= 599 ? status : 502,
  );
}
