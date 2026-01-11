// lib/api/fetcher.ts
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"

/**
 * Kalau input berupa path relatif (contoh: "/api/..."),
 * otomatis akan diprefix ke API_BASE (Laravel).
 */
function toAbsoluteApiUrl(input: RequestInfo | URL): RequestInfo | URL {
  if (typeof input === "string") {
    // relatif: "/api/..."
    if (input.startsWith("/")) return `${API_BASE}${input}`
    // sudah absolute: "http://..."
    return input
  }

  // URL object
  if (input instanceof URL) {
    // kalau URL relative tidak umum, tapi aman
    return input
  }

  return input
}

export async function safeFetchJSON<T>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const finalInput = toAbsoluteApiUrl(input)

  const res = await fetch(finalInput, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(text || `Request failed: ${res.status}`)
  }

  return (await res.json()) as T
}
