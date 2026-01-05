import { http } from "@/lib/api/http"
import { API_ENDPOINTS } from "@/lib/api/endpoints"
import type {
  PartnerListItem,
  CreatePartnerRequest,
  CreatePartnerResponse,
  PartnerDetailResponse,
} from "@/lib/types/partners"
import type { PaginatedResponse } from "@/lib/types/pagination"

export type ListPartnersParams = {
  q?: string
  per_page?: number
  page?: number
}

export type PartnerDetailParams = {
  page?: number
  per_page?: number
}

export const partnersService = {
  async list(params?: ListPartnersParams): Promise<PaginatedResponse<PartnerListItem>> {
    const { data } = await http.get<PaginatedResponse<PartnerListItem>>(API_ENDPOINTS.PARTNERS.BASE, { params })
    return data
  },

  async create(payload: CreatePartnerRequest): Promise<CreatePartnerResponse> {
    const { data } = await http.post<CreatePartnerResponse>(API_ENDPOINTS.PARTNERS.BASE, payload)
    return data
  },

  async detail(id: number | string, params?: PartnerDetailParams): Promise<PartnerDetailResponse> {
    const { data } = await http.get<PartnerDetailResponse>(API_ENDPOINTS.PARTNERS.DETAIL(id), { params })
    return data
  },
}
