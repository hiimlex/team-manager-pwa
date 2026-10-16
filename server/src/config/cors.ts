import type { CorsOptions } from "cors";

// CORS_ORIGIN accepts a comma-separated list. Entries may contain "*" as a
// wildcard (e.g. "https://*.vercel.app" for preview deployments).
// Trailing slashes are ignored, since browsers never send them in Origin.
const normalize = (o: string) => o.trim().replace(/\/+$/, "").toLowerCase();

function parseAllowedOrigins(raw: string | undefined): (string | RegExp)[] {
  return (raw ?? "")
    .split(",")
    .map(normalize)
    .filter(Boolean)
    .map((o) =>
      o.includes("*")
        ? new RegExp(
            "^" +
              o
                .split("*")
                .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
                .join("[^/]+") +
              "$",
          )
        : o,
    );
}

export function isOriginAllowed(
  origin: string | undefined,
  env: { CORS_ORIGIN?: string; NODE_ENV?: string } = process.env,
): boolean {
  // Server-to-server / curl requests have no Origin header
  if (!origin) return true;
  // In development accept all origins so mobile on local Wi-Fi works
  if (env.NODE_ENV !== "production") return true;

  const o = normalize(origin);
  return parseAllowedOrigins(env.CORS_ORIGIN).some((allowed) =>
    typeof allowed === "string" ? allowed === o : allowed.test(o),
  );
}

// Shared by Express and Socket.io so both enforce the same rules.
// Disallowed origins get a normal response without CORS headers (the browser
// blocks it) instead of a thrown error, which turned into a 500.
export const corsOptions: CorsOptions = {
  origin: (origin, cb) => {
    const allowed = isOriginAllowed(origin);
    if (!allowed) console.warn(`CORS: origin ${origin} not allowed`);
    cb(null, allowed);
  },
  credentials: true,
};
