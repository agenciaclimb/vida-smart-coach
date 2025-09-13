// Shared CORS helper for Supabase Edge Functions (Deno)
export const ORIGINS = [
  "https://www.appvidasmart.com",
  "https://appvidasmart.com",
  "http://localhost:5173",
];

export function cors(originHeader: string | null) {
  const origin = originHeader ?? "";
  const allowOrigin = ORIGINS.includes(origin)
    ? origin
    : "https://www.appvidasmart.com";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods":
      "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    // Ensure caches differentiate by Origin
    Vary: "Origin",
  } as Record<string, string>;
}
