import axios, { AxiosError } from "axios";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseApiError(data: unknown): string | null {
  if (!isRecord(data)) return null;

  const message = typeof data.message === "string" ? data.message : null;
  const error = typeof data.error === "string" ? data.error : null;

  // Laravel validation errors: { errors: { field: ["msg"] } }
  const errors = data.errors;
  if (isRecord(errors)) {
    const firstKey = Object.keys(errors)[0];
    if (firstKey) {
      const fieldVal = errors[firstKey];
      if (Array.isArray(fieldVal) && typeof fieldVal[0] === "string") {
        return fieldVal[0];
      }
    }
  }

  return message ?? error;
}

export function getApiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const axErr = err as AxiosError<unknown>;
    const parsed = parseApiError(axErr.response?.data);
    return parsed ?? axErr.message ?? "Terjadi kesalahan";
  }

  if (err instanceof Error) return err.message;
  return "Terjadi kesalahan";
}

/** True jika request gagal tanpa respons server (offline, timeout, DNS), bukan error dari API. */
export function isNetworkError(err: unknown): boolean {
  return axios.isAxiosError(err) && !err.response;
}
