const API_URL = process.env.NEXT_PUBLIC_API_BASEURL!;

type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type ApiFetchOptions = {
    method?: ApiMethod;
    body?: unknown;
    headers?: HeadersInit;
};

async function doRequest(path: string, options: ApiFetchOptions = {}) {
  const { method = "GET", body, headers } = options
  const isFormData = body instanceof FormData

  return fetch(`${API_URL}${path}`, {
    method,
    credentials: "include",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(method !== "GET" ? { "X-Requested-With": "fetch" } : {}),
      ...headers,
    },
    body:
      body == null
        ? undefined
        : isFormData
        ? body
        : JSON.stringify(body),
  })
}

export async function apiFetch(path: string, options: ApiFetchOptions = {}) {
    let res = await doRequest(path, options);

    if (res.status !== 401) return res;

    const refreshRes = await doRequest("/auth/refresh", {
        method: "POST",
    });

    if (!refreshRes.ok) return res;

    return doRequest(path, options);
}

export function apiGet(path: string) {
    return apiFetch(path, { method: "GET" });
}

export function apiPost(path: string, body?: unknown) {
    return apiFetch(path, { method: "POST", body });
}
export async function apiPut(path: string, body?: unknown) {
    return apiFetch(path, { method: "PUT", body });
}

export async function apiPatch(path: string, body?: unknown) {
    return apiFetch(path, { method: "PATCH", body });
}

export async function apiDelete(path: string, body?: unknown) {
    return apiFetch(path, { method: "DELETE", body });
}