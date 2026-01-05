"use client"

import Link from "next/link"
import * as React from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { partnersService } from "@/lib/services/partners.service"
import type { PartnerDetailResponse, PartnerScheduleItem } from "@/lib/types/partners"
import { API_ENDPOINTS } from "@/lib/api/endpoints"
import { formatRupiah, hhmm } from "@/lib/utils/format"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

function ActiveBadge({ active }: { active?: boolean | null }) {
  if (active === false) return <Badge variant="muted">Nonaktif</Badge>
  return <Badge variant="success">Aktif</Badge>
}

function statusVariant(status?: string | null): "muted" | "warning" | "success" {
  if (!status) return "muted"
  if (status === "belum-dimulai") return "muted"
  if (status === "sedang-berlangsung") return "warning"
  return "success"
}

function statusLabel(status?: string | null) {
  if (!status) return "-"
  if (status === "belum-dimulai") return "Tes Belum Dimulai"
  if (status === "sedang-berlangsung") return "Tes Sedang Berlangsung"
  if (status === "telah-selesai") return "Tes Telah Selesai"
  return status
}

function buildPages(current: number, last: number) {
  const total = Math.max(1, last)
  const cur = Math.min(Math.max(1, current), total)
  const windowSize = 1

  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const start = Math.max(2, cur - windowSize)
  const end = Math.min(total - 1, cur + windowSize)

  const result: Array<number | "ellipsis"> = [1]
  if (start > 2) result.push("ellipsis")
  for (let p = start; p <= end; p++) result.push(p)
  if (end < total - 1) result.push("ellipsis")
  result.push(total)

  return result
}

export default function AdminPartnerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const sp = useSearchParams()

  const partnerId = Number(id)
  const pageRaw = Number(sp.get("page") || "1")
  const perPageRaw = Number(sp.get("per_page") || "20")

  const params = React.useMemo(() => {
    return {
      page: Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1,
      per_page: Number.isFinite(perPageRaw) && perPageRaw > 0 ? perPageRaw : 20,
    }
  }, [pageRaw, perPageRaw])

  const q = useQuery<PartnerDetailResponse>({
    queryKey: [API_ENDPOINTS.PARTNERS.DETAIL(partnerId), params],
    queryFn: () => partnersService.detail(partnerId, params),
    enabled: Number.isFinite(partnerId),
    placeholderData: keepPreviousData,
  })

  const data = q.data
  const partner = data?.partner ?? null
  const schedulesRes = data?.schedules ?? null
  const schedules: PartnerScheduleItem[] = schedulesRes?.data ?? []

  const lastPage = schedulesRes?.last_page ?? 1
  const canPrev = params.page > 1
  const canNext = params.page < lastPage

  const pages = React.useMemo(() => buildPages(params.page, lastPage), [params.page, lastPage])

  const hrefFor = (p: number) => {
    const usp = new URLSearchParams()
    if (params.per_page !== 20) usp.set("per_page", String(params.per_page))
    if (p !== 1) usp.set("page", String(p))
    const qs = usp.toString()
    return qs ? `/dashboard/admin/mitra/${partnerId}?${qs}` : `/dashboard/admin/mitra/${partnerId}`
  }

  const onChangePerPage = (v: number) => {
    const u = new URLSearchParams(sp.toString())
    if (v !== 20) u.set("per_page", String(v))
    else u.delete("per_page")
    u.delete("page")
    const qs = u.toString()
    router.push(qs ? `/dashboard/admin/mitra/${partnerId}?${qs}` : `/dashboard/admin/mitra/${partnerId}`)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">
            {partner ? `Mitra #${partner.id} — ${partner.name}` : "Detail Mitra"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {partner ? `Kode: ${partner.code ?? "-"} • Schedules: ${partner.schedules_count ?? 0}` : " "}
          </p>
        </div>

        <Button variant="outline" onClick={() => router.back()}>
          Kembali
        </Button>
      </div>

      {q.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : q.isError || !partner ? (
        <p className="text-sm text-destructive">Gagal load partner</p>
      ) : (
        <>
          <Card className="p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <ActiveBadge active={partner.is_active ?? true} />
              {partner.code ? <Badge variant="outline">Code: {partner.code}</Badge> : null}
              {typeof partner.schedules_count === "number" ? (
                <Badge variant="secondary">Schedules: {partner.schedules_count}</Badge>
              ) : null}
            </div>

            <Separator />

            <div className="grid gap-3 md:grid-cols-4 text-sm">
              <div>
                <div className="text-muted-foreground">PIC</div>
                <div className="font-medium truncate" title={partner.contact_name ?? "-"}>
                  {partner.contact_name ?? "-"}
                </div>
              </div>

              <div>
                <div className="text-muted-foreground">Email PIC</div>
                <div className="truncate" title={partner.contact_email ?? "-"}>
                  {partner.contact_email ?? "-"}
                </div>
              </div>

              <div>
                <div className="text-muted-foreground">Nomor PIC</div>
                <div className="truncate" title={partner.contact_phone ?? "-"}>
                  {partner.contact_phone ?? "-"}
                </div>
              </div>

              <div>
                <div className="text-muted-foreground">Dibuat</div>
                <div className="truncate" title={partner.created_at ?? "-"}>
                  {partner.created_at ?? "-"}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="text-sm font-semibold">Schedules Mitra</div>
                <div className="text-sm text-muted-foreground">Total: {schedulesRes?.total ?? 0}</div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Per halaman</span>
                <select
                  className="h-9 rounded-md border bg-background px-3 text-sm"
                  value={params.per_page}
                  onChange={(e) => onChangePerPage(Number(e.target.value))}
                >
                  {[10, 20, 50, 100, 200].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Separator />

            <div className="rounded-md border">
              <Table className="table-fixed w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14.5">No</TableHead>
                    <TableHead className="w-20">ID</TableHead>
                    <TableHead className="w-30">Tanggal</TableHead>
                    <TableHead className="w-30">Jam</TableHead>
                    <TableHead className="w-30">Harga</TableHead>
                    <TableHead className="w-27.5">Kapasitas</TableHead>
                    <TableHead className="w-42.5">Paket</TableHead>
                    <TableHead className="w-40">Status</TableHead>
                    <TableHead className="w-30 text-right">Detail</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {schedules.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="py-10 text-center text-sm text-muted-foreground">
                        Tidak ada schedule
                      </TableCell>
                    </TableRow>
                  ) : (
                    schedules.map((s, idx) => {
                      const no = (params.page - 1) * params.per_page + (idx + 1)
                      const packs = s.packages ?? []
                      const jam = `${hhmm(s.start_time)} - ${hhmm(s.end_time)}`

                      return (
                        <TableRow key={s.id}>
                          <TableCell className="whitespace-nowrap">{no}</TableCell>
                          <TableCell className="whitespace-nowrap">{s.id}</TableCell>

                          <TableCell className="truncate" title={s.date}>
                            {s.date}
                          </TableCell>

                          <TableCell className="whitespace-nowrap">{jam}</TableCell>

                          <TableCell className="whitespace-nowrap">{formatRupiah(s.price)}</TableCell>

                          <TableCell className="whitespace-nowrap">
                            {s.current_participants}/{s.capacity}
                          </TableCell>

                          <TableCell>
                            {packs.length === 0 ? (
                              <span className="text-sm text-muted-foreground">-</span>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {packs.map((p) => (
                                  <Badge key={p.id} variant="outline">
                                    {p.name}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </TableCell>

                          <TableCell className="truncate" title={s.status ?? "-"}>
                            <Badge variant={statusVariant(s.status)}>{statusLabel(s.status)}</Badge>
                          </TableCell>

                          <TableCell className="text-right whitespace-nowrap">
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/dashboard/admin/schedules/${s.id}`}>Detail</Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between pt-2">
              <div className="text-sm text-muted-foreground">
                {schedulesRes ? (
                  <>
                    Menampilkan <span className="font-medium text-foreground">{schedulesRes.from ?? 0}</span>–
                    <span className="font-medium text-foreground">{schedulesRes.to ?? 0}</span> dari{" "}
                    <span className="font-medium text-foreground">{schedulesRes.total ?? 0}</span>
                  </>
                ) : (
                  <span />
                )}
              </div>

              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href={hrefFor(Math.max(1, params.page - 1))}
                      onClick={(e) => {
                        e.preventDefault()
                        if (!canPrev || q.isFetching) return
                        router.push(hrefFor(Math.max(1, params.page - 1)))
                      }}
                      className={!canPrev || q.isFetching ? "pointer-events-none opacity-50" : undefined}
                    />
                  </PaginationItem>

                  {pages.map((p, i) =>
                    p === "ellipsis" ? (
                      <PaginationItem key={`el-${i}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={p}>
                        <PaginationLink
                          href={hrefFor(p)}
                          isActive={p === params.page}
                          onClick={(e) => {
                            e.preventDefault()
                            if (q.isFetching) return
                            router.push(hrefFor(p))
                          }}
                        >
                          {String(p)}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  )}

                  <PaginationItem>
                    <PaginationNext
                      href={hrefFor(Math.min(lastPage, params.page + 1))}
                      onClick={(e) => {
                        e.preventDefault()
                        if (!canNext || q.isFetching) return
                        router.push(hrefFor(Math.min(lastPage, params.page + 1)))
                      }}
                      className={!canNext || q.isFetching ? "pointer-events-none opacity-50" : undefined}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
