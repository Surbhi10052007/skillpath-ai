/**
 * Thin fetch wrapper used by every service.
 * Point NEXT_PUBLIC_API_BASE_URL at a FastAPI deployment to swap backends —
 * the route shapes are identical (/auth/login, /dashboard, /chat, ...).
 */
export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api").replace(/\/$/, "");

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

/** Broadcast so the auth provider can handle expired sessions in one place. */
export const UNAUTHORIZED_EVENT = "skillpath:unauthorized";

function broadcastUnauthorized(path: string) {
  if (typeof window === "undefined") return;
  // /auth/* probes legitimately return 401 for signed-out visitors.
  if (path.startsWith("/auth/")) return;
  window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options;
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...rest,
      credentials: "include",
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(headers ?? {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("You appear to be offline. Check your connection and try again.", 0);
  }

  const text = await response.text();
  const data = text ? safeJson(text) : null;

  if (!response.ok) {
    const record = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
    const message =
      typeof record.error === "string"
        ? record.error
        : response.status >= 500
          ? "The server had a problem handling that. Please try again in a moment."
          : `Request failed (${response.status})`;
    const code = typeof record.code === "string" ? record.code : undefined;
    if (response.status === 401) broadcastUnauthorized(path);
    throw new ApiError(message, response.status, code);
  }
  return data as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
