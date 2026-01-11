// lib/services/certificate.service.ts
import { http } from "@/lib/api/http"
import { API_ENDPOINTS } from "@/lib/api/endpoints"
import type {
  ActivateCertificateResponse,
  Certificate,
  CreateCertificatePayload,
  CreateCertificateResponse,
  SaveCertificateLayoutPayload,
  SaveCertificateLayoutResponse,
} from "@/lib/types/certificate"

type CertificateListEnvelope = { data: Certificate[] }

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null
}

function normalizeListPayload(payload: unknown): Certificate[] {
  // backend bisa: langsung array atau { data: [] }
  if (Array.isArray(payload)) return payload as Certificate[]

  if (isRecord(payload) && Array.isArray((payload as CertificateListEnvelope).data)) {
    return (payload as CertificateListEnvelope).data
  }

  return []
}

export const certificateService = {
  async list(): Promise<Certificate[]> {
    const res = await http.get(API_ENDPOINTS.ADMIN.CERTIFICATES.ROOT)
    return normalizeListPayload(res.data)
  },

  async get(id: number | string): Promise<Certificate> {
    const res = await http.get(API_ENDPOINTS.ADMIN.CERTIFICATES.DETAIL(id))
    return res.data as Certificate
  },

  async create(payload: CreateCertificatePayload): Promise<CreateCertificateResponse> {
    const fd = new FormData()
    fd.append("name", payload.name)
    fd.append("period", String(payload.period))
    fd.append("year", String(payload.year))
    fd.append("signer_name", payload.sign_name)
    fd.append("signer_nip", payload.sign_nip)
    fd.append("letter_prefix", payload.letter_prefix)
    fd.append("template", payload.template)
    if (payload.is_active !== undefined) fd.append("is_active", String(payload.is_active))

    const res = await http.post(API_ENDPOINTS.ADMIN.CERTIFICATES.ROOT, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return res.data as CreateCertificateResponse
  },

  async activate(id: number | string, is_active = true): Promise<ActivateCertificateResponse> {
    const res = await http.patch(API_ENDPOINTS.ADMIN.CERTIFICATES.ACTIVATE(id), { is_active })
    return res.data as ActivateCertificateResponse
  },

  async saveLayout(
    id: number | string,
    payload: SaveCertificateLayoutPayload
  ): Promise<SaveCertificateLayoutResponse> {
    const res = await http.put(API_ENDPOINTS.ADMIN.CERTIFICATES.LAYOUT(id), payload)
    return res.data as SaveCertificateLayoutResponse
  },
}
