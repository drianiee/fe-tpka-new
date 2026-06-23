import { http } from "@/lib/api/http";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

// Alias sementara untuk service lama. Seluruh request memakai instance Axios yang sama.
export const api = http;
