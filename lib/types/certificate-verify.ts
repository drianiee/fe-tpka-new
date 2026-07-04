// lib/types/certificate-verify.ts

export type CertificateVerifyData = {
  certificate_no: string
  participant_name: string | null
  participant_email: string | null
  schedule_id: number | null
  exam_date: string | null
  certificate_name: string | null
  period: string | null
  year: number | null
  status?: "valid" | "revoked" | string
  issued_at?: string | null
  pdf_available?: boolean
}

export type CertificateVerifyResponse = {
  message: string
  data: CertificateVerifyData
}
