/**
 * Strictly validate a base URL.
 * By default accepts only: https://example.com (optionally with trailing /)
 * Rejects: http, relative URLs, credentials, query, fragment, etc.
 */
export function validateBaseUrl(input: string, {
  allowPath = true,       // allow https://example.com/some/path
  allowQuery = false,      // allow ?a=b
  allowFragment = false,   // allow #section
  allowPort = false,       // allow :8443
  allowLocalhost = false,  // allow localhost / 127.0.0.1 / ::1
} = {}) {
  if (typeof input !== "string") return { ok: false, reason: "Not a string" };

  const s = input.trim();
  let url;
  try {
    url = new URL(s);
  } catch {
    return { ok: false, reason: "Invalid URL syntax" };
  }

  // Must be https
  if (url.protocol !== "https:") return { ok: false, reason: "Must use https" };

  // Must be absolute with a host
  if (!url.hostname) return { ok: false, reason: "Missing hostname" };

  // Disallow embedded credentials: https://user:pass@example.com
  if (url.username || url.password) {
    return { ok: false, reason: "Credentials in URL not allowed - stop this" };
  }

  // Optional restrictions
  if (!allowPort && url.port) return { ok: false, reason: "Port specification are not allowed - stop this" };
  if (!allowQuery && url.search) return { ok: false, reason: "Query parameters are not allowed" };
  if (!allowFragment && url.hash) return { ok: false, reason: "URL fragments are not allowed" };

  // If you want only "https://domain.tld" (and maybe trailing slash)
  if (!allowPath) {
    if (url.pathname !== "/" && url.pathname !== "") {
      return { ok: false, reason: "Path not allowed (must be root)" };
    }
  }

  // Optional: block localhost/private-ish targets for safety
  // (good idea if users can submit arbitrary URLs and you don't want SSRF)
  if (!allowLocalhost) {
    const h = url.hostname.toLowerCase();
    if (h === "localhost" || h === "127.0.0.1" || h === "::1") {
      return { ok: false, reason: "Localhost not allowed - stop this" };
    }
  }

  // Normalize output (handy for deduping)
  // Ensures consistent trailing slash handling etc.
  url.hash = "";
  if (!allowQuery) url.search = "";
  if (!allowPath) url.pathname = "/";

  return { ok: true, url: url.toString() };
}