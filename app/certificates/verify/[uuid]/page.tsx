"use client"

import * as React from "react"
import { useParams, useSearchParams } from "next/navigation"
import {
  ExternalLink,
  Loader2,
  ShieldCheck,
  Mail,
  Hash,
  Calendar,
  Award,
  FileText,
} from "lucide-react"
import axios, { AxiosError } from "axios"

import { http } from "@/lib/api/http"
import { API_BASE_URL } from "@/lib/api/client"
import { API_ENDPOINTS } from "@/lib/api/endpoints"
import type {
  CertificateVerifyResponse,
  CertificateVerifyData,
} from "@/lib/types/certificate-verify"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

function formatDateId(v?: string | null) {
  if (!v) return "-"
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return v
  return d.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  })
}

function FieldRow(props: {
  icon: React.ReactNode
  label: string
  value?: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border bg-white p-3">
      <div className="mt-0.5 text-muted-foreground">{props.icon}</div>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{props.label}</div>
        <div className="text-sm font-medium wrap-break-word">
          {props.value ?? "-"}
        </div>
      </div>
    </div>
  )
}

function buildPdfUrl(uuid: string, h: string) {
  const base = (API_BASE_URL ?? "http://localhost:8000").replace(/\/$/, "")
  const path = API_ENDPOINTS.CERTIFICATES.VERIFY_PDF(uuid)
  return `${base}${path}?h=${encodeURIComponent(h)}`
}

export default function CertificateVerifyPage() {
  const params = useParams<{ uuid: string }>()
  const search = useSearchParams()

  const uuid = params?.uuid ?? ""
  const h = search.get("h") ?? ""

  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [data, setData] = React.useState<CertificateVerifyData | null>(null)

  const [openPdf, setOpenPdf] = React.useState(false)

  React.useEffect(() => {
    if (!uuid) return

    let alive = true
    setLoading(true)
    setError(null)

    ;(async () => {
      try {
        if (!h) throw new Error("Signature (h) tidak ditemukan di URL")

        const res = await http.get<CertificateVerifyResponse>(
          API_ENDPOINTS.CERTIFICATES.VERIFY_DATA(uuid),
          { params: { h } }
        )

        if (!alive) return
        setData(res.data.data)
      } catch (err: unknown) {
        if (!alive) return

        let message = "Gagal memuat data sertifikat"

        if (axios.isAxiosError(err)) {
          const axErr = err as AxiosError<{ message?: string }>
          message = axErr.response?.data?.message ?? axErr.message
        } else if (err instanceof Error) {
          message = err.message
        }

        setError(message)
        setData(null)
      } finally {
        if (!alive) return
        setLoading(false)
      }
    })()

    return () => {
      alive = false
    }
  }, [uuid, h])

  const pdfUrl = React.useMemo(() => {
    if (!uuid || !h) return ""
    return buildPdfUrl(uuid, h)
  }, [uuid, h])

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto w-full max-w-5xl px-4 py-10 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            <h1 className="text-xl font-semibold">Verifikasi Sertifikat</h1>
            {uuid && <Badge variant="outline">{uuid}</Badge>}
            {h && <Badge variant="success">SIGNED</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">
            Sertifikat ditampilkan langsung dari sistem resmi.
          </p>
        </div>

        {/* Preview */}
        <Card className="rounded-2xl overflow-hidden">
          <div className="p-4 sm:p-6 flex justify-between flex-wrap gap-3">
            <div>
              <div className="font-medium">{data?.certificate_name ?? "Sertifikat"}</div>
              <div className="text-sm text-muted-foreground">
                {data?.participant_name ?? "—"}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => window.open(pdfUrl, "_blank")}
                disabled={!pdfUrl}
              >
                <ExternalLink className="h-4 w-4" />
                Buka PDF
              </Button>

              <Button disabled={!pdfUrl} onClick={() => setOpenPdf(true)}>
                Lihat Sertifikat
              </Button>
            </div>
          </div>

          <Separator />

          <div className="p-4 sm:p-6">
            <div className="rounded-2xl border bg-white overflow-hidden">
              <button
                className="w-full focus:outline-none"
                disabled={!pdfUrl}
                onClick={() => setOpenPdf(true)}
              >
                <div className="aspect-16/11 w-full bg-muted/10">
                  {pdfUrl ? (
                    <iframe src={pdfUrl} className="w-full h-full" />
                  ) : (
                    <div className="grid h-full place-items-center">
                      <FileText className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </button>

              <div className="p-3 border-t">
                {loading && (
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memuat data…
                  </div>
                )}

                {error && (
                  <div className="text-sm text-red-600 wrap-break-word">
                    {error}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Detail */}
        <Card className="rounded-2xl">
          <div className="p-4 sm:p-6">
            <div className="text-base font-semibold">Detail Keaslian</div>
            <Separator className="my-4" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FieldRow icon={<Award className="h-4 w-4" />} label="Nama Sertifikat" value={data?.certificate_name} />
              <FieldRow icon={<Hash className="h-4 w-4" />} label="Nomor Sertifikat" value={data?.certificate_no} />
              <FieldRow icon={<ShieldCheck className="h-4 w-4" />} label="Nama Peserta" value={data?.participant_name} />
              <FieldRow icon={<Mail className="h-4 w-4" />} label="Email" value={data?.participant_email} />
              <FieldRow icon={<Calendar className="h-4 w-4" />} label="Tanggal Ujian" value={formatDateId(data?.exam_date)} />
              <FieldRow icon={<Hash className="h-4 w-4" />} label="Periode / Tahun" value={data ? `${data.period ?? "-"} / ${data.year ?? "-"}` : "-"} />
            </div>
          </div>
        </Card>

        {/* PDF Modal */}
        <Dialog open={openPdf} onOpenChange={setOpenPdf}>
          <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-0 overflow-hidden">
            <DialogHeader className="p-6 pb-3">
              <DialogTitle>Dokumen Sertifikat</DialogTitle>
              <DialogDescription>
                PDF resmi dari sistem.
              </DialogDescription>
            </DialogHeader>

            <div className="h-[calc(90vh-120px)] px-6 pb-6">
              <iframe src={pdfUrl} className="w-full h-full border rounded-xl" />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
