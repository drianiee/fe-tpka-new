// app/dashboard/page.tsx
"use client"

import Link from "next/link"
import * as React from "react"
import { useQuery } from "@tanstack/react-query"

import { dashboardService } from "@/lib/services/dashboard.service"
import { partnersService } from "@/lib/services/partners.service"
import { getApiErrorMessage } from "@/lib/api/errors"
import { formatRupiah, hhmm } from "@/lib/utils/format"
import { API_ENDPOINTS } from "@/lib/api/endpoints"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

type StatusVariant = "muted" | "warning" | "success"

type PartnerLite = {
  id: number
  name: string
}

type LatestScheduleLite = {
  id: number
  date: string
  start_time: string
  end_time: string
  price: string
  capacity: number
  current_participants: number
  status?: string | null
  partner_id?: number | null
  is_partner?: boolean
}

type DashboardTotalsLite = {
  participants: number
  income_paid?: number | string | null
  paid_count?: number | null
  total_schedules?: number | null
}

type DashboardResponseLite = {
  totals: DashboardTotalsLite
  latest_schedules: LatestScheduleLite[]
}

type PartnerDetailResponseLite = {
  partner: PartnerLite
}

function normalizeStatus(status?: string | null) {
  return (status ?? "").trim().toLowerCase()
}

function statusVariant(status?: string | null): StatusVariant {
  const s = normalizeStatus(status)
  if (!s) return "muted"
  if (s === "belum-dimulai") return "muted"
  if (s === "sedang-berlangsung") return "warning"
  if (s === "telah-selesai") return "success"
  return "muted"
}

function statusLabel(status?: string | null) {
  const s = normalizeStatus(status)
  if (!s) return "-"
  if (s === "belum-dimulai") return "Tes Belum Dimulai"
  if (s === "sedang-berlangsung") return "Tes Sedang Berlangsung"
  if (s === "telah-selesai") return "Tes Telah Selesai"
  return status ?? "-"
}

function isPartnerDetailResponseLite(v: unknown): v is PartnerDetailResponseLite {
  if (!v || typeof v !== "object") return false
  const o = v as Record<string, unknown>
  const p = o["partner"]
  if (!p || typeof p !== "object") return false
  const po = p as Record<string, unknown>
  return typeof po["id"] === "number" && typeof po["name"] === "string"
}

function PartnerBadge({ partnerId }: { partnerId?: number | null }) {
  const qPartner = useQuery({
    queryKey: [API_ENDPOINTS.PARTNERS.DETAIL(partnerId ?? "none")],
    queryFn: async (): Promise<PartnerLite | null> => {
      if (!partnerId) return null
      const resUnknown: unknown = await partnersService.detail(partnerId)
      if (isPartnerDetailResponseLite(resUnknown)) return resUnknown.partner
      return null
    },
    enabled: Boolean(partnerId),
    staleTime: 5 * 60 * 1000,
  })

  if (!partnerId) return <Badge variant="muted">Non-partner</Badge>
  if (qPartner.isLoading) return <Badge variant="warning">Partner: ...</Badge>
  if (qPartner.isError) return <Badge variant="warning">Partner: (gagal load)</Badge>

  const partner = qPartner.data
  return <Badge variant="warning">Partner: {partner?.name ?? "-"}</Badge>
}

export default function DashboardPage() {
  const dashboardQuery = useQuery({
    queryKey: [API_ENDPOINTS.DASHBOARD.BASE, { limit: 10 }],
    queryFn: async (): Promise<DashboardResponseLite> => {
      const res = await dashboardService.getDashboard(10)
      return res as unknown as DashboardResponseLite
    },
  })

  const data = dashboardQuery.data
  const totals = data?.totals
  const latest = data?.latest_schedules ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Ringkasan peserta & jadwal terdekat</p>
      </div>

      {dashboardQuery.isLoading ? (
        <div className="text-sm text-muted-foreground">Loading dashboard...</div>
      ) : dashboardQuery.isError ? (
        <div className="text-sm text-destructive">
          {getApiErrorMessage(dashboardQuery.error)}
        </div>
      ) : !data || !totals ? (
        <div className="text-sm text-muted-foreground">Data dashboard kosong.</div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Total Peserta</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold">{totals.participants}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Income Paid</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold">
                  {formatRupiah(String(totals.income_paid ?? 0))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Paid Count</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold">{totals.paid_count ?? 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Total Schedules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold">{totals.total_schedules ?? 0}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Jadwal Terdekat</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              {latest.length === 0 ? (
                <div className="text-sm text-muted-foreground">Tidak ada jadwal aktif.</div>
              ) : (
                latest.map((s, idx) => {
                  const jam = `${hhmm(s.start_time)} - ${hhmm(s.end_time)}`
                  const partnerId = s.partner_id ?? null

                  return (
                    <div key={s.id} className="rounded-md border p-3 space-y-2">
                      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-1">
                          <div className="font-medium">
                            #{s.id} • {s.date} • {jam}
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <PartnerBadge partnerId={partnerId} />

                            <Badge variant="muted">Kapasitas: {s.capacity}</Badge>

                            <Badge variant="muted">
                              Harga: {formatRupiah(String(s.price ?? 0))}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 md:justify-end">
                          <Badge variant={statusVariant(s.status)}>{statusLabel(s.status)}</Badge>

                          <Button asChild size="sm" variant="outline">
                            <Link href={`/dashboard/admin/schedules/${s.id}`}>Detail</Link>
                          </Button>
                        </div>
                      </div>

                      {idx !== latest.length - 1 ? <Separator /> : null}
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
