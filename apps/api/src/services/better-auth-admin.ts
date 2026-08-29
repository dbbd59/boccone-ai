import { AppError } from "../errors";

export type BetterAuthHandler = (request: Request) => Promise<Response>;

export async function callBetterAuthAdmin(
  handler: BetterAuthHandler,
  input: {
    path: string;
    method: "GET" | "POST";
    headers: Headers;
    query?: Record<string, string>;
    body?: Record<string, unknown>;
    fallbackMessage: string;
  },
): Promise<unknown> {
  const url = new URL(`http://boccone.internal/api/auth/admin/${input.path}`);
  for (const [key, value] of Object.entries(input.query ?? {})) {
    url.searchParams.set(key, value);
  }

  const headers = new Headers(input.headers);
  headers.set("accept", "application/json");
  const hasBody = input.body !== undefined;
  if (hasBody) headers.set("content-type", "application/json");

  const response = await handler(
    new Request(url.toString(), {
      method: input.method,
      headers,
      ...(hasBody ? { body: JSON.stringify(input.body) } : {}),
    }),
  );
  const payload = await readJson(response);
  if (!response.ok) {
    throw mapBetterAuthResponse(response.status, payload, input.fallbackMessage);
  }
  return payload;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function mapBetterAuthResponse(status: number, payload: unknown, fallbackMessage: string): Error {
  const record = asRecord(payload);
  const code = typeof record?.["code"] === "string" ? record["code"].toUpperCase() : "";
  if (status === 404 || code.includes("USER_NOT_FOUND")) {
    return new AppError("not_found", "User not found");
  }
  if (status === 403) return new AppError("forbidden", "Admin operation is not allowed");
  if (code.includes("ALREADY_EXISTS") || status === 409) {
    return new AppError("conflict", "A user with this email already exists");
  }
  if (status === 400 || status === 422) return new AppError("bad_request", fallbackMessage);
  return new AppError("internal_error", fallbackMessage);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}
