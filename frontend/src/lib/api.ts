export function getBaseUrl() {
  if (typeof window !== "undefined") {
    const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    if (isLocal) {
      return "http://localhost:5000";
    }
  }
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:5000";
  }
  const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  return rawBaseUrl.replace(/\/$/, "");
}

export const BASE_URL = getBaseUrl();

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${endpoint}`;

  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include", // Allow session cookies to be sent across origins
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Request failed with status ${response.status}`);
  }

  // Handle empty or text responses
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
}
