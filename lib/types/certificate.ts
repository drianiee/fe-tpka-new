// lib/types/certificate.ts
export type CertificateTextAlign = "left" | "center" | "right"

export type CertificateFieldPlacement = {
  x: number
  y: number
  fontSize: number
  align: CertificateTextAlign
}

export type CertificateLayoutJson = {
  canvas: { width: number; height: number }
  fields: Record<string, CertificateFieldPlacement>
}

export type Certificate = {
  id: number
  name: string
  period: string
  year: number
  sign_name: string
  sign_nip: string
  letter_prefix: string
  template_path: string
  template_url?: string
  layout_json: CertificateLayoutJson | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type CertificateListResponse = {
  data: Certificate[] | Certificate[] // backend kamu kadang langsung array, kadang {data:[]}
}

export type CertificateDetailResponse = Certificate

export type CreateCertificatePayload = {
  name: string
  period: string
  year: number | string
  sign_name: string
  sign_nip: string
  letter_prefix: string
  template: File
  is_active?: boolean | number | string
}

export type CreateCertificateResponse = {
  message: string
  data: Certificate
}

export type ActivateCertificateResponse = {
  message: string
  data: Certificate
}

export type SaveCertificateLayoutPayload = CertificateLayoutJson

export type SaveCertificateLayoutResponse = {
  message: string
  data: Certificate
}
