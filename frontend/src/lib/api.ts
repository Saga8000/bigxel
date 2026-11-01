export class ApiError extends Error {
  status: number;
  fieldErrors: Record<string, string>;

  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

type Json = Record<string, unknown> | unknown[];

async function request<T>(method: string, path: string, body?: Json | FormData): Promise<T> {
  const headers: Record<string, string> = { "X-Requested-With": "XMLHttpRequest", Accept: "application/json" };
  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  let res: Response;
  try {
    res = await fetch(path, { method, headers, body: payload, credentials: "same-origin" });
  } catch {
    throw new ApiError(0, "Can't reach the server. Check your connection and try again.");
  }
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }
  if (!res.ok) {
    const d = (data ?? {}) as { detail?: unknown; errors?: { field: string; message: string }[] };
    const fields: Record<string, string> = {};
    d.errors?.forEach((e) => {
      if (e.field && !fields[e.field]) fields[e.field] = e.message;
    });
    const message =
      typeof d.detail === "string"
        ? d.detail
        : res.status >= 500
          ? "Something went wrong on our side. Please try again."
          : "Request failed";
    throw new ApiError(res.status, message, fields);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: Json) => request<T>("POST", path, body ?? {}),
  put: <T>(path: string, body: Json) => request<T>("PUT", path, body),
  patch: <T>(path: string, body: Json) => request<T>("PATCH", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
  upload: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return request<{ url: string; kind: "image" | "video" }>("POST", "/api/uploads", fd);
  },
};

export function qs(params: Record<string, string | number | undefined | null>): string {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
}
