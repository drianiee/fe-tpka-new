"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"

import { adminPaymentsService } from "@/lib/services/adminPayments.service"
import type { PaymentDetail } from "@/lib/types/admin-payments"
import { API_ENDPOINTS } from "@/lib/api/endpoints"
import { formatRupiah } from "@/lib/utils/format"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

function kv(v: unknown) {
  if (v === null || v === undefined || v === "") return "-"
  if (typeof v === "string") return v
  try {
    return JSON.stringify(v, null, 2)
  } catch {
    return String(v)
  }
}

export default function AdminPaymentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const paymentId = Number(id)

  const query = useQuery({
    queryKey: [API_ENDPOINTS.PAYMENTS_ADMIN.DETAIL(paymentId)],
    queryFn: () => adminPaymentsService.detail(paymentId),
    enabled: Number.isFinite(paymentId),
  })

  if (query.isLoading) return <p className="text-sm text-muted-foreground">Loading...</p>
  if (query.isError || !query.data) return <p className="text-sm text-destructive">Gagal load payment</p>

  const p: PaymentDetail = query.data.payment

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Payment #{p.id}</h1>
          <div className="text-sm text-muted-foreground">
            Order: <span className="text-foreground">{p.order_id ?? "-"}</span>
          </div>
        </div>

        <Button variant="outline" onClick={() => router.back()}>
          Kembali
        </Button>
      </div>

      <Card className="p-4 space-y-3">
        <div className="flex flex-wrap gap-2 items-center">
          <Badge variant="outline">Status: {p.transaction_status ?? "-"}</Badge>
          <Badge variant="outline">Payment: {p.payment_type ?? "-"}</Badge>
          <Badge variant="outline">Fraud: {p.fraud_status ?? "-"}</Badge>
          <Badge variant="secondary">Amount: {formatRupiah(String(p.amount ?? 0))}</Badge>
        </div>

        <Separator />

        <div className="grid gap-3 md:grid-cols-3 text-sm">
          <div>
            <div className="text-muted-foreground">Transaction Time</div>
            <div className="truncate" title={p.transaction_time ?? "-"}>
              {p.transaction_time ?? "-"}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Settlement Time</div>
            <div className="truncate" title={p.settlement_time ?? "-"}>
              {p.settlement_time ?? "-"}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Paid At</div>
            <div className="truncate" title={p.paid_at ?? "-"}>
              {p.paid_at ?? "-"}
            </div>
          </div>
        </div>

        <Separator />

        <div className="grid gap-3 md:grid-cols-2 text-sm">
          <div>
            <div className="text-muted-foreground">Transaction ID</div>
            <div className="truncate" title={p.transaction_id ?? "-"}>
              {p.transaction_id ?? "-"}
            </div>
          </div>

          <div>
            <div className="text-muted-foreground">Status Code</div>
            <div>{p.status_code ?? "-"}</div>
          </div>

          <div>
            <div className="text-muted-foreground">Status Message</div>
            <div className="truncate" title={p.status_message ?? "-"}>
              {p.status_message ?? "-"}
            </div>
          </div>

          <div>
            <div className="text-muted-foreground">Bank / VA</div>
            <div className="truncate" title={`${p.bank ?? "-"} / ${p.va_number ?? "-"}`}>
              {p.bank ?? "-"} / {p.va_number ?? "-"}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {p.snap_redirect_url ? (
            <Button asChild size="sm" variant="outline">
              <a href={p.snap_redirect_url} target="_blank" rel="noreferrer">
                Snap Redirect
              </a>
            </Button>
          ) : null}
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <div className="text-sm font-semibold">User</div>
        <div className="text-sm">
          {p.user ? (
            <div className="space-y-1">
              <div className="font-medium">{p.user.name}</div>
              <div className="text-muted-foreground">{p.user.email}</div>
              <div className="text-muted-foreground">ID: {p.user.id}</div>
            </div>
          ) : (
            "-"
          )}
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <div className="text-sm font-semibold">Schedule</div>
        <div className="text-sm">
          {p.schedule ? (
            <div className="space-y-1">
              <div className="font-medium">Schedule #{p.schedule.id}</div>
              <div className="text-muted-foreground">
                {p.schedule.date} • {p.schedule.start_time} - {p.schedule.end_time}
              </div>
              <div className="text-muted-foreground">Price: {formatRupiah(String(p.schedule.price ?? 0))}</div>
              <div className="text-muted-foreground">Partner: {p.schedule.partner?.name ?? "-"}</div>
              <div className="text-muted-foreground">
                Moodle: {p.schedule.moodle_course_id ?? "-"} / {p.schedule.moodle_quiz_id ?? "-"} /{" "}
                {p.schedule.moodle_quiz_cmid ?? "-"}
              </div>
            </div>
          ) : (
            "-"
          )}
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <div className="text-sm font-semibold">Debug / Payload</div>

        <div className="space-y-2 text-sm">
          <div>
            <div className="text-muted-foreground">Snap Token</div>
            <div className="break-all">{p.snap_token ?? "-"}</div>
          </div>

          <div>
            <div className="text-muted-foreground">VA Numbers</div>
            <pre className="rounded-md bg-muted p-3 text-xs overflow-auto">{kv(p.va_numbers)}</pre>
          </div>

          <div>
            <div className="text-muted-foreground">Payload</div>
            <pre className="rounded-md bg-muted p-3 text-xs overflow-auto">{kv(p.payload)}</pre>
          </div>
        </div>
      </Card>
    </div>
  )
}
