import { http } from "@/lib/api/http"
import { API_ENDPOINTS } from "@/lib/api/endpoints"
import type { PaymentsListResponse, PaymentDetailResponse } from "@/lib/types/admin-payments"

export type ListPaymentsParams = {
  q?: string
  status?: string
  from?: string
  to?: string
  per_page?: number
  page?: number
}

export const adminPaymentsService = {
  list(params?: ListPaymentsParams): Promise<PaymentsListResponse> {
    return http.get(API_ENDPOINTS.PAYMENTS_ADMIN.BASE, { params }).then((r) => r.data)
  },

  detail(id: number | string): Promise<PaymentDetailResponse> {
    return http.get(API_ENDPOINTS.PAYMENTS_ADMIN.DETAIL(id)).then((r) => r.data)
  },
}
