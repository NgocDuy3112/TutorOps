export const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

const BASE_URL = API.replace(/\/+$/, "");

export function apiUrl(path: string) {
  return /^https?:\/\//.test(path)
    ? path
    : `${BASE_URL}/${path.replace(/^\/+/, "")}`;
}

const AUTH_BYPASS_PATTERNS = [
  "/public/",
  "/auth/login",
  "/auth/register",
  "/auth/google",
];

let redirecting = false;

const AUTH_PAGES = ["/login", "/signup"];

function shouldRedirectToLogin(url: string, status: number): boolean {
  if (status !== 401 || redirecting) return false;
  if (AUTH_PAGES.includes(window.location.pathname)) return false;
  return !AUTH_BYPASS_PATTERNS.some((pattern) => url.includes(pattern));
}

const originalFetch = window.fetch;

window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
  let url = typeof input === "string" ? input : input.toString();

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
