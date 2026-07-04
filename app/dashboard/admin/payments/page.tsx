// app/dashboard/admin/payments/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { Filter } from "lucide-react";

import {
  adminPaymentsService,
  type ListPaymentsParams,
} from "@/lib/services/adminPayments.service";
import type { PaymentsListResponse, PaymentListItem } from "@/lib/types/admin-payments";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { formatRupiah } from "@/lib/utils/format";

import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { PageHeaderLayout } from "@/components/layouts/PageHeaderLayout";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { DateRangePicker } from "@/components/common/DateRangePicker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type StatusOption = { label: string; value: string };

const STATUS_OPTIONS: StatusOption[] = [
  { label: "Semua Status", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Capture", value: "capture" },
  { label: "Settlement", value: "settlement" },
  { label: "Deny", value: "deny" },
  { label: "Cancel", value: "cancel" },
  { label: "Expire", value: "expire" },
  { label: "Failure", value: "failure" },
];

function toYmd(d?: Date | null) {
  if (!d) return undefined;
  return format(d, "yyyy-MM-dd");
}

function useDebouncedValue<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function buildPages(page: number, lastPage: number) {
  const total = Math.max(1, lastPage);
  const current = Math.min(Math.max(1, page), total);
  const windowSize = 1;

  if (total <= 7)
    return Array.from({ length: total }, (_, i) => i + 1) as Array<
      number | "ellipsis"
    >;

  const start = Math.max(2, current - windowSize);
  const end = Math.min(total - 1, current + windowSize);

  const result: Array<number | "ellipsis"> = [1];
  if (start > 2) result.push("ellipsis");
  for (let p = start; p <= end; p++) result.push(p);
  if (end < total - 1) result.push("ellipsis");
  result.push(total);

  return result;
}

function statusVariant(s: string) {
  const v = (s ?? "").toLowerCase();
  if (v === "settlement" || v === "capture") return "success" as const;
  if (v === "pending") return "warning" as const;
  if (v === "deny" || v === "cancel" || v === "expire" || v === "failure")
    return "destructive" as const;
  return "muted" as const;
}

export default function AdminPaymentsPage() {
  const router = useRouter();

  const [qText, setQText] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [range, setRange] = React.useState<DateRange | undefined>(undefined);
  const [perPage, setPerPage] = React.useState(20);
  const [page, setPage] = React.useState(1);

  const qDebounced = useDebouncedValue(qText, 350);

  React.useEffect(() => {
    setPage(1);
  }, [qDebounced, status, range, perPage]);

  const q = React.useMemo(() => qDebounced.trim(), [qDebounced]);
  const from = React.useMemo(() => toYmd(range?.from) ?? "", [range?.from]);
  const to = React.useMemo(() => toYmd(range?.to) ?? "", [range?.to]);
  const s = React.useMemo(() => status ?? "", [status]);

  const params: ListPaymentsParams = React.useMemo(() => {
    return {
      q: q || undefined,
      status: s || undefined,
      from: from || undefined,
      to: to || undefined,
      per_page: perPage,
      page,
    };
  }, [q, s, from, to, perPage, page]);

  const queryKey = React.useMemo(
    () =>
      [
        API_ENDPOINTS.PAYMENTS_ADMIN.BASE,
        page,
        perPage,
        q,
        s,
        from,
        to,
      ] as const,
    [page, perPage, q, s, from, to]
  );

  const query = useQuery<PaymentsListResponse>({
    queryKey,
    queryFn: () => adminPaymentsService.list(params),
    placeholderData: keepPreviousData,
  });

  const res = query.data;
  const rows: PaymentListItem[] = res?.payments?.data ?? [];
  const lastPage = res?.payments?.last_page ?? 1;

  const canPrev = page > 1;
  const canNext = page < lastPage;
  const pages = buildPages(page, lastPage);

  const busy = query.isFetching;

  const resetAll = React.useCallback(() => {
    setQText("");
    setStatus("");
    setRange(undefined);
    setPerPage(20);
    setPage(1);
  }, []);

  const statusLabelText =
    STATUS_OPTIONS.find((o) => o.value === status)?.label ?? "Semua Status";

  const columns = React.useMemo<DataTableColumn<PaymentListItem>[]>(() => {
    return [
      {
        key: "no",
        header: "No",
        headerClassName: "w-16 text-center",
        className: "py-4 px-2 text-center",
        cell: (_row, idx) => (page - 1) * perPage + (idx + 1),
      },
      {
        key: "user",
        header: "User",
        headerClassName: "min-w-[220px]",
        className: "py-4 px-2",
        cell: (row) =>
          row.user ? (
            <div className="space-y-1">
              <div className="font-medium truncate">{row.user.name}</div>
              <div className="text-xs text-muted-foreground truncate">
                {row.user.email}
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground">-</div>
          ),
      },
      {
        key: "order_id",
        header: "Order",
        headerClassName: "text-center",
        className: "py-4 px-2 text-center",
        cell: (row) => (
          <div className="truncate max-w-45 mx-auto">{row.order_id ?? "-"}</div>
        ),
      },
      {
        key: "amount",
        header: "Amount",
        headerClassName: "w-40 text-center",
        className: "py-4 px-2 text-center",
        cell: (row) => formatRupiah(String(row.amount ?? 0)),
      },
      {
        key: "transaction_status",
        header: "Status",
        headerClassName: "w-40 text-center",
        className: "py-4 px-2 text-center",
        cell: (row) => (
          <div className="flex justify-center">
            <Badge variant={statusVariant(row.transaction_status || "")}>
              {row.transaction_status || "-"}
            </Badge>
          </div>
        ),
      },
      {
        key: "paid_at",
        header: "Paid At",
        headerClassName: "w-48 text-center",
        className: "py-4 px-2 text-center",
        cell: (row) => (
          <div className="truncate max-w-50 mx-auto">{row.paid_at ?? "-"}</div>
        ),
      },
      {
        key: "action",
        header: "Detail",
        headerClassName: "w-32 text-center",
        className: "py-4 px-2 text-center",
        cell: (row) => (
          <div className="flex justify-center">
            <Button asChild size="sm" variant="outline">
              <Link
                href={`/dashboard/admin/payments/${row.id}`}
                onClick={(e) => e.stopPropagation()}
              >
                Detail
              </Link>
            </Button>
          </div>
        ),
      },
    ];
  }, [page, perPage]);

  return (
    <PageHeaderLayout title="Payments" description="Kelola Pembayaran" showBack={false}>
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-4">
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Income Paid</div>
            <div className="text-lg font-semibold">
              {res ? formatRupiah(String(res.summary.income_paid_total)) : "-"}
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Paid Count</div>
            <div className="text-lg font-semibold">
              {res ? res.summary.count_paid : "-"}
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Pending</div>
            <div className="text-lg font-semibold">
              {res ? res.summary.count_pending : "-"}
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Failed</div>
            <div className="text-lg font-semibold">
              {res ? res.summary.count_failed : "-"}
            </div>
          </Card>
        </div>

        <div className="h-full min-h-0 rounded-xl border overflow-hidden flex flex-col">
          <div className="p-4 space-y-2">
            <div className="flex flex-col sm:flex-row gap-3 lg:items-center">
              <div className="flex-1">
                <Input
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  placeholder="Cari nama/email peserta…"
                  className="w-full"
                />
              </div>

              <div className="flex gap-3 items-center">
                <DateRangePicker value={range} onChange={setRange} />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={busy}
                      aria-label="Filter status"
                      title={statusLabelText}
                    >
                      <Filter className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Filter Status</DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    <DropdownMenuRadioGroup value={status} onValueChange={setStatus}>
                      {STATUS_OPTIONS.map((o) => (
                        <DropdownMenuRadioItem
                          key={o.value}
                          value={o.value}
                          disabled={busy}
                          onSelect={(e) => e.preventDefault()}
                        >
                          {o.label}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button type="button" variant="outline" disabled={busy} onClick={resetAll}>
                  Reset
                </Button>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              {res && (
                <>
                  Menampilkan{" "}
                  <span className="font-medium text-foreground">
                    {res.payments.from ?? 0}
                  </span>
                  –
                  <span className="font-medium text-foreground">
                    {res.payments.to ?? 0}
                  </span>{" "}
                  dari{" "}
                  <span className="font-medium text-foreground">
                    {res.payments.total ?? 0}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-auto border-t">
            <DataTable
              columns={columns}
              rows={rows}
              getRowKey={(r) => r.id}
              loading={query.isLoading}
              emptyText="Data tidak ditemukan"
              stickyHeader
              onRowClick={(row) => router.push(`/dashboard/admin/payments/${row.id}`)}
              getRowClassName={() => "cursor-pointer hover:bg-muted/50"}
            />
          </div>

          <div className="border-t bg-white">
            <div className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Per halaman</span>
                <select
                  className="h-9 rounded-md border bg-background px-3 text-sm"
                  value={perPage}
                  onChange={(e) => setPerPage(Number(e.target.value))}
                  disabled={busy}
                >
                  {[10, 20, 50, 100, 200].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              <Pagination className="ml-auto w-full justify-end">
                <PaginationContent className="justify-end w-full">
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (!canPrev || busy) return;
                        setPage((p) => Math.max(1, p - 1));
                      }}
                      className={
                        !canPrev || busy ? "pointer-events-none opacity-50" : undefined
                      }
                    />
                  </PaginationItem>

                  {pages.map((p, i) => {
                    if (p === "ellipsis") {
                      return (
                        <PaginationItem key={`el-${i}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }

                    return (
                      <PaginationItem key={p}>
                        <PaginationLink
                          href="#"
                          isActive={p === page}
                          onClick={(e) => {
                            e.preventDefault();
                            if (busy) return;
                            setPage(p);
                          }}
                        >
                          {String(p)}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (!canNext || busy) return;
                        setPage((p) => p + 1);
                      }}
                      className={
                        !canNext || busy ? "pointer-events-none opacity-50" : undefined
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        </div>
      </div>
    </PageHeaderLayout>
  );
}
