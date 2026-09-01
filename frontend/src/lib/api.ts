const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

let redirecting = false;

const originalFetch = window.fetch;

window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
  let url = typeof input === "string" ? input : input.toString();

  // Only prepend base URL for relative paths
  if (url.startsWith("/") && !url.startsWith("//")) {
    url = `${BASE}${url}`;
  }

  const mergedInit: RequestInit = {
    ...init,
    credentials: "include",
  };

  return originalFetch.call(window, url, mergedInit).then((response) => {
    if (
      response.status === 401 &&
      !url.includes("/public/") &&
      !url.includes("/auth/login") &&
      !url.includes("/auth/register") &&
      !redirecting
    ) {
      redirecting = true;
      window.location.href = "/login";
    }
    return response;
  });
};

/**
 * Convenience wrapper for new code. Uses the intercepted fetch.
 */
export async function api(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  return window.fetch(path, init);
}
