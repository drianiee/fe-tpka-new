// lib/utils/download.ts
import { getToken } from "@/lib/utils/storage";

export async function openWithBearer(url: string) {
  const token = getToken();
  if (!token) throw new Error("Token tidak ditemukan. Silakan login ulang.");

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "*/*",
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Gagal mengunduh. HTTP ${res.status}`);
  }

  const blob = await res.blob();
  const objUrl = URL.createObjectURL(blob);

  window.open(objUrl, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(objUrl), 60_000);
}

function filenameFromDisposition(value: string | null): string | null {
  if (!value) return null;

  const utf8Match = value.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const simpleMatch = value.match(/filename="?([^"]+)"?/i);
  return simpleMatch?.[1] ?? null;
}

export async function downloadWithBearer(
  url: string,
  fallbackFilename: string,
) {
  const token = getToken();
  if (!token) throw new Error("Token tidak ditemukan. Silakan login ulang.");

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "*/*",
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Gagal mengunduh. HTTP ${res.status}`);
  }

  const blob = await res.blob();
  const objUrl = URL.createObjectURL(blob);
  const filename =
    filenameFromDisposition(res.headers.get("content-disposition")) ??
    fallbackFilename;

  const link = document.createElement("a");
  link.href = objUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(objUrl), 60_000);
}
