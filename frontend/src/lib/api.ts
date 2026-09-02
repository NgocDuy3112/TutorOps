export const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

/** Stripped base URL — used internally by the interceptor. */
const BASE_URL = API.replace(/\/+$/, "");

/** Routes that should never trigger the 401 → /login redirect. */
const AUTH_BYPASS_PATTERNS = [
  "/public/",
  "/auth/login",
  "/auth/register",
  "/auth/google",
];

let redirecting = false;

function shouldRedirectToLogin(url: string, status: number): boolean {
  if (status !== 401 || redirecting) return false;
  return !AUTH_BYPASS_PATTERNS.some((pattern) => url.includes(pattern));
}

const originalFetch = window.fetch;

window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
  let url = typeof input === "string" ? input : input.toString();

  // Only prepend base URL for relative paths. Skip if the URL already
  // starts with the base (e.g. "/api/auth/google" from `${API}/auth/google`).
  if (
    url.startsWith("/") &&
    !url.startsWith("//") &&
    !url.startsWith(BASE_URL)
  ) {
    url = `${BASE_URL}${url}`;
  }

  const mergedInit: RequestInit = {
    ...init,
    credentials: "include",
  };

  return originalFetch.call(window, url, mergedInit).then((response) => {
    if (shouldRedirectToLogin(url, response.status)) {
      redirecting = true;
      window.location.href = "/login";
    }
    return response;
  });
};

export async function api(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  return window.fetch(path, init);
}
