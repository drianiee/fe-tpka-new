import axios from "axios"
import { clearToken, getToken } from "@/lib/utils/storage"

export const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000",
  withCredentials: false,
  headers: { Accept: "application/json" },
})

http.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  config.headers = config.headers ?? {}
  config.headers.Accept = "application/json"
  return config
})

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      const hadToken = Boolean(getToken())
      clearToken()
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        // Punya token tapi ditolak = sesi kedaluwarsa. Beri tahu di halaman login.
        const params = new URLSearchParams()
        if (hadToken) params.set("reason", "expired")
        params.set("next", window.location.pathname + window.location.search)
        window.location.assign(`/login?${params.toString()}`)
      }
    }
    return Promise.reject(error)
  }
)
