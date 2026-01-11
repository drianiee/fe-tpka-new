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
