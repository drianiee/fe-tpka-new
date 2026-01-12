import { http } from "@/lib/api/http"
import { API_ENDPOINTS } from "@/lib/api/endpoints"
import type { PartnerOnboardingResponse } from "@/lib/types/partner-onboarding"

export type PartnerOnboardingPayload = {
  token: string
  password: string
  password_confirmation: string
  id_type: "ktp" | "sim" | "passport" | string
  id_image: File
  phone: string
  birth_date: string // YYYY-MM-DD
}

export const partnerOnboardingService = {
  async submit(payload: PartnerOnboardingPayload): Promise<PartnerOnboardingResponse> {
    const fd = new FormData()
    fd.append("token", payload.token)
    fd.append("password", payload.password)
    fd.append("password_confirmation", payload.password_confirmation)
    fd.append("id_type", payload.id_type)
    fd.append("id_image", payload.id_image)
    fd.append("phone", payload.phone)
    fd.append("birth_date", payload.birth_date)

    const res = await http.post(API_ENDPOINTS.PARTNER.ONBOARDING, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    })

    return res.data as PartnerOnboardingResponse
  },
}
