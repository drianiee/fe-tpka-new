"use client"

import * as React from "react"
import Link from "next/link"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import type { DateRange } from "react-day-picker"
import { format } from "date-fns"

import { adminPaymentsService, type ListPaymentsParams } from "@/lib/services/adminPayments.service"
import type { PaymentsListResponse, PaymentListItem } from "@/lib/types/admin-payments"
import { API_ENDPOINTS } from "@/lib/api/endpoints"
import { formatRupiah } from "@/lib/utils/format"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
import { DateRangePicker } from "@/components/common/DateRangePicker"

type StatusOption = { label: string; value: string }

const STATUS_OPTIONS: StatusOption[] = [
  { label: "Semua Status", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Capture", value: "capture" },
  { label: "Settlement", value: "settlement" },
  { label: "Deny", value: "deny" },
  { label: "Cancel", value: "cancel" },
  { label: "Expire", value: "expire" },
  { label: "Failure", value: "failure" },
]

function toYmd(d?: Date | null) {
  if (!d) return undefined
  return format(d, "yyyy-MM-dd")
}

function buildPages(page: number, lastPage: number) {
  const total = lastPage
  const current = page
  const windowSize = 1

  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1) as Array<number | "ellipsis">

  const start = Math.max(2, current - windowSize)
  const end = Math.min(total - 1, current + windowSize)

  const result: Array<number | "ellipsis"> = [1]
  if (start > 2) result.push("ellipsis")
  for (let p = start; p <= end; p++) result.push(p)
  if (end < total - 1) result.push("ellipsis")
  result.push(total)

  return result
}

function StatusPill({ s }: { s: string }) {
  const v = (s || "").toLowerCase()
  const variant =
    v === "settlement" || v === "capture"
      ? "secondary"
      : v === "pending"
      ? "outline"
      : "destructive"

  return <Badge variant={variant}>{s || "-"}</Badge>
}

export default function AdminPaymentsPage() {
  const [qText, setQText] = React.useState("")
  const [status, setStatus] = React.useState("")
  const [range, setRange] = React.useState<DateRange | undefined>(undefined)
  const [perPage, setPerPage] = React.useState(20)
  const [page, setPage] = React.useState(1)

  React.useEffect(() => {
    setPage(1)
  }, [status, range, perPage])

  const params: ListPaymentsParams = React.useMemo(() => {
    const q = qText.trim() || undefined
    const from = toYmd(range?.from)
    const to = toYmd(range?.to)
    const s = status || undefined

    return { q, status: s, from, to, per_page: perPage, page }
  }, [qText, status, range, perPage, page])

  const query = useQuery<PaymentsListResponse>({
    queryKey: [API_ENDPOINTS.PAYMENTS_ADMIN.BASE, params],
    queryFn: () => adminPaymentsService.list(params),
    placeholderData: keepPreviousData,
  })

  const res = query.data
  const rows: PaymentListItem[] = res?.payments?.data ?? []
  const lastPage = res?.payments?.last_page ?? 1
  const canPrev = page > 1
  const canNext = page < lastPage
  const pages = buildPages(page, lastPage)
  const busy = query.isFetching

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <Input
            value={qText}
            onChange={(e) => setQText(e.target.value)}
            placeholder="Cari nama/email peserta"
            className="lg:w-72"
          />

          <select
            className="h-9 rounded-md border bg-background px-3 text-sm lg:w-56"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <DateRangePicker value={range} onChange={setRange} />

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Per halaman</span>
            <select
              className="h-9 rounded-md border bg-background px-3 text-sm"
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
            >
              {[10, 20, 50, 100, 200].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => {
              setQText("")
              setStatus("")
              setRange(undefined)
              setPerPage(20)
              setPage(1)
            }}
          >
            Reset
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Income Paid</div>
          <div className="text-lg font-semibold">
            {res ? formatRupiah(String(res.summary.income_paid_total)) : "-"}
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Paid Count</div>
          <div className="text-lg font-semibold">{res ? res.summary.count_paid : "-"}</div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Pending</div>
          <div className="text-lg font-semibold">{res ? res.summary.count_pending : "-"}</div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Failed</div>
          <div className="text-lg font-semibold">{res ? res.summary.count_failed : "-"}</div>
        </Card>
      </div>

      <div className="rounded-md border">
        <Table className="table-fixed w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[52px]">No</TableHead>
              <TableHead className="w-[90px]">ID</TableHead>
              <TableHead className="w-[190px]">User</TableHead>
              <TableHead className="w-[150px]">Order</TableHead>
              <TableHead className="w-[130px]">Amount</TableHead>
              <TableHead className="w-[140px]">Status</TableHead>
              <TableHead className="w-[140px]">Paid At</TableHead>
              <TableHead className="w-[110px] text-right">Detail</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                  {query.isLoading ? "Memuat..." : "Data tidak ditemukan"}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((it, idx) => (
                <TableRow key={it.id}>
                  <TableCell className="whitespace-nowrap">
                    {(page - 1) * perPage + (idx + 1)}
                  </TableCell>

                  <TableCell className="whitespace-nowrap">{it.id}</TableCell>

                  <TableCell className="truncate" title={it.user ? `${it.user.name} (${it.user.email})` : "-"}>
                    {it.user ? (
                      <div className="space-y-0.5">
                        <div className="font-medium truncate">{it.user.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{it.user.email}</div>
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>

                  <TableCell className="truncate" title={it.order_id ?? "-"}>
                    {it.order_id ?? "-"}
                  </TableCell>

                  <TableCell className="whitespace-nowrap">
                    {formatRupiah(String(it.amount ?? 0))}
                  </TableCell>

                  <TableCell className="whitespace-nowrap">
                    <StatusPill s={it.transaction_status ?? "-"} />
                  </TableCell>

                  <TableCell className="truncate" title={it.paid_at ?? "-"}>
                    {it.paid_at ?? "-"}
                  </TableCell>

                  <TableCell className="text-right whitespace-nowrap">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/dashboard/admin/payments/${it.id}`}>Detail</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-muted-foreground">
          {res ? (
            <>
              Total <span className="font-medium text-foreground">{res.payments.total}</span> data
            </>
          ) : (
            <span />
          )}
        </div>

        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (!canPrev || busy) return
                  setPage((p) => Math.max(1, p - 1))
                }}
                className={!canPrev || busy ? "pointer-events-none opacity-50" : undefined}
              />
            </PaginationItem>

            {pages.map((p, i) => {
              if (p === "ellipsis") {
                return (
                  <PaginationItem key={`el-${i}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                )
              }

              return (
                <PaginationItem key={p}>
                  <PaginationLink
                    href="#"
                    isActive={p === page}
                    onClick={(e) => {
                      e.preventDefault()
                      if (busy) return
                      setPage(p)
                    }}
                  >
                    {String(p)}
                  </PaginationLink>
                </PaginationItem>
              )
            })}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (!canNext || busy) return
                  setPage((p) => p + 1)
                }}
                className={!canNext || busy ? "pointer-events-none opacity-50" : undefined}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}
