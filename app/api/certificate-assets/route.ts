import { NextRequest } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

function isAllowedAssetUrl(raw: string) {
  try {
    const parsed = new URL(raw);
    const apiBase = new URL(API_BASE);

    return (
      parsed.protocol === "http:" || parsed.protocol === "https:"
    ) && parsed.host === apiBase.host && parsed.pathname.startsWith("/storage/");
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const src = request.nextUrl.searchParams.get("src");

  if (!src || !isAllowedAssetUrl(src)) {
    return new Response("Asset tidak valid.", { status: 400 });
  }

  const upstream = await fetch(src, { cache: "no-store" });

  if (!upstream.ok || !upstream.body) {
    return new Response("Asset tidak ditemukan.", { status: upstream.status || 404 });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/octet-stream",
      "Cache-Control": "no-store",
    },
  });
}
