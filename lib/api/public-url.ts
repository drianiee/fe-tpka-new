// lib/api/public-url.ts
export const BACKEND_PUBLIC_URL =
  process.env.NEXT_PUBLIC_BACKEND_PUBLIC_URL ?? "http://localhost:8000";

export function storageUrl(path: string) {
  // terima: "certificates/base/xxx.png" atau "/certificates/base/xxx.png"
  const clean = path.replace(/^\/+/, "").replace(/^storage\/+/, "");
  return `${BACKEND_PUBLIC_URL}/storage/${clean}`;
}
