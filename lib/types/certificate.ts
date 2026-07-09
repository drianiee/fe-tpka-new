// lib/types/certificate.ts

export type CertificateTextAlign = "left" | "center" | "right"
export type CertificateFontWeight = "normal" | "medium" | "semibold" | "bold"

// =========================
// FE INTERNAL (discriminated union)
// =========================
export type CertificateFieldPlacementText = {
  type: "text"
  x: number
  y: number
  fontSize: number
  align: CertificateTextAlign
  color?: string
  fontFamily?: string
  fontWeight?: CertificateFontWeight
  width?: number
}

export type CertificateFieldPlacementQr = {
  type: "qr"
  x: number
  y: number
  size: number
}

export type CertificateFieldPlacementImage = {
  type: "image"
  x: number
  y: number
  width: number
  height: number
}

export type CertificateFieldPlacement =
  | CertificateFieldPlacementText
  | CertificateFieldPlacementQr
  | CertificateFieldPlacementImage

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
  color?: string
  fontFamily?: string
  fontWeight?: CertificateFontWeight
  width?: number
}

export type CertificateFieldPlacementApiQr = {
  x: number
  y: number
  size: number
}

export type CertificateFieldPlacementApiImage = {
  x: number
  y: number
  width: number
  height: number
}

export type CertificateFieldPlacementApi =
  | CertificateFieldPlacementApiText
  | CertificateFieldPlacementApiQr
  | CertificateFieldPlacementApiImage

export type CertificateLayoutJsonApi = {
  canvas: { width: number; height: number }
  fields: Record<string, CertificateFieldPlacementApi>
}

export type Certificate = {
  id: number
  name: string
  period?: string | null
  year: number
  sign_name?: string | null
  sign_nip?: string | null
  letter_prefix: string
  template_file?: string
  template_path: string
  template_url?: string
  sign_file?: string | null
  sign_url?: string | null
  stamp_file?: string | null
  stamp_url?: string | null
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
  year: number | string
  sign_name?: string
  sign_nip?: string
  letter_prefix: string
  template: File
  sign_file?: File | null
  stamp_file?: File | null
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
