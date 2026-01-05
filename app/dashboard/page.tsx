"use client"

import Link from "next/link"
import * as React from "react"
import { useQuery } from "@tanstack/react-query"

import { dashboardService } from "@/lib/services/dashboard.service"
import { getApiErrorMessage } from "@/lib/api/errors"
import { formatRupiah, hhmm } from "@/lib/utils/format"
import { StatusBadge } from "@/lib/utils/status"
import { API_ENDPOINTS } from "@/lib/api/endpoints"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function DashboardPage() {
  const dashboardQuery = useQuery({
    queryKey: [API_ENDPOINTS.DASHBOARD.BASE, { limit: 10 }],
    queryFn: () => dashboardService.getDashboard(10),
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
        <div className="text-sm text-destructive">{getApiErrorMessage(dashboardQuery.error)}</div>
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
                <div className="text-3xl font-semibold">{formatRupiah(String(totals.income_paid ?? 0))}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Paid Count</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold">{totals.paid_count}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Total Schedules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold">{totals.total_schedules}</div>
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
                  const isPartner = Boolean(s.is_partner)

                  return (
                    <div key={s.id} className="rounded-md border p-3 space-y-2">
                      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-1">
                          <div className="font-medium">
                            #{s.id} • {s.date} • {jam}
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={isPartner ? "secondary" : "outline"}>
                              {isPartner ? "Partner" : "Non-partner"}
                            </Badge>

                            <Badge variant="outline">Kapasitas: {s.capacity}</Badge>

                            <Badge variant="outline">Harga: {formatRupiah(String(s.price ?? 0))}</Badge>

                            {typeof s.partner_id === "number" && s.partner_id ? (
                              <Badge variant="outline">Partner ID: {s.partner_id}</Badge>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 md:justify-end">
                          <StatusBadge status={s.status ?? "-"} />
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
