export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ApiSuccessBody<T> = { success: true; data: T };
type ApiErrorBody = {
  success: false;
  error: { code: string; message: string; details?: unknown };
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api/v1${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
    ...init,
  });

  let body: ApiSuccessBody<T> | ApiErrorBody | null = null;
  try {
    body = (await response.json()) as ApiSuccessBody<T> | ApiErrorBody;
  } catch {
    body = null;
  }

  if (!response.ok || !body || !body.success) {
    const errorBody = body && !body.success ? body.error : undefined;
    throw new ApiError(
      response.status,
      errorBody?.code ?? "UNKNOWN_ERROR",
      errorBody?.message ?? "Something went wrong. Please try again.",
      errorBody?.details,
    );
  }

  return body.data;
}

export const api = {
  get: <T>(path: string): Promise<T> => request<T>(path),
  post: <T>(path: string, data?: unknown): Promise<T> =>
    request<T>(path, {
      method: "POST",
      ...(data === undefined ? {} : { body: JSON.stringify(data) }),
    }),
  patch: <T>(path: string, data?: unknown): Promise<T> =>
    request<T>(path, {
      method: "PATCH",
      ...(data === undefined ? {} : { body: JSON.stringify(data) }),
    }),
  delete: <T>(path: string): Promise<T> =>
    request<T>(path, { method: "DELETE" }),
};
