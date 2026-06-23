const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export function apiAssetUrl(value?: string | null) {
  if (!value) return null;
  if (value.startsWith("/storage/")) return `${API_BASE}${value}`;
  if (value.startsWith("http://localhost/storage/")) return value.replace("http://localhost", API_BASE);
  if (value.startsWith("http://127.0.0.1/storage/")) return value.replace("http://127.0.0.1", API_BASE);
  return value;
}
