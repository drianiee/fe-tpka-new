// lib/types/certificate.ts

export type CertificateTextAlign = "left" | "center" | "right"

// =========================
// FE INTERNAL (discriminated union)
// =========================
export type CertificateFieldPlacementText = {
  type: "text"
  x: number
  y: number
  fontSize: number
  align: CertificateTextAlign
}

export type CertificateFieldPlacementQr = {
  type: "qr"
  x: number
  y: number
  size: number
}

export type CertificateFieldPlacement = CertificateFieldPlacementText | CertificateFieldPlacementQr

export type CertificateLayoutJson = {
  canvas: { width: number; height: number }
  /**
   * FE internal format: fields punya `type`
   */
  fields: Record<string, CertificateFieldPlacement>
}

// =========================
// API FORMAT (backend) - fields TANPA `type`
// text: {x,y,fontSize,align}
// qr: {x,y,size}
// =========================
export type CertificateFieldPlacementApiText = {
  x: number
  y: number
  fontSize: number
  align: CertificateTextAlign
}

export type CertificateFieldPlacementApiQr = {
  x: number
  y: number
  size: number
}

export type CertificateFieldPlacementApi = CertificateFieldPlacementApiText | CertificateFieldPlacementApiQr

export type CertificateLayoutJsonApi = {
  canvas: { width: number; height: number }
  fields: Record<string, CertificateFieldPlacementApi>
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
  /**
   * backend return format (tanpa type) tapi kita boleh simpan sebagai Api
   * lalu di page detail kamu normalize ke FE internal
   */
  layout_json: CertificateLayoutJsonApi | null
  is_active: boolean
  created_at: string
  updated_at: string
}

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

export type SaveCertificateLayoutApiPayload = CertificateLayoutJsonApi

export type SaveCertificateLayoutResponse = {
  message: string
  data: Certificate
}
