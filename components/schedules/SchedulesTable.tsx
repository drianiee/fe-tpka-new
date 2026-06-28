"use client";

import Link from "next/link";
import * as React from "react";
import { useRouter } from "next/navigation";
import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import type { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { Filter } from "lucide-react";

import { schedulesService } from "@/lib/services/schedules.service";
import type { ScheduleListItem } from "@/lib/types/schedules";
import type { PaginatedResponse } from "@/lib/types/pagination";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { formatRupiah, hhmm } from "@/lib/utils/format";
import { formatDateId } from "@/lib/utils/datetime";

import { Button } from "@/components/ui/button";
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
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";

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
  { label: "Draft", value: "draft" },
  { label: "Published", value: "published" },
  { label: "Closed", value: "closed" },
  { label: "Cancelled", value: "cancelled" },
];

function toYmd(d?: Date | null) {
  if (!d) return undefined;
  return format(d, "yyyy-MM-dd");
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

export function SchedulesTable() {
  const router = useRouter();

  const [qText, setQText] = React.useState("");
  const [range, setRange] = React.useState<DateRange | undefined>(undefined);
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(10);

  const [status, setStatus] = React.useState<string>("");

  React.useEffect(() => {
    setPage(1);
  }, [qText, status, range, perPage]);

  const params = React.useMemo(() => {
    const q = qText.trim() || undefined;
    const date_from = toYmd(range?.from) || undefined;
    const date_to = toYmd(range?.to) || undefined;

    return {
      q,
      status: status || undefined,
      date_from,
      date_to,
      per_page: perPage,
      page,
    };
  }, [qText, status, range, perPage, page]);

  const query = useQuery<PaginatedResponse<ScheduleListItem>>({
    queryKey: [API_ENDPOINTS.SCHEDULES.BASE, params],
    queryFn: () => schedulesService.list(params),
    placeholderData: keepPreviousData,
  });

  const exportMutation = useMutation({
    mutationFn: () =>
      schedulesService.exportExcel({
        q: params.q,
        status: params.status,
        date_from: params.date_from,
        date_to: params.date_to,
      }),
    onSuccess: (res) => {
      if (res?.download_url)
        window.open(res.download_url, "_blank", "noopener,noreferrer");
    },
  });

  const res = query.data;
  const rows = res?.data ?? [];
  const lastPage = res?.last_page ?? 1;
  const canPrev = page > 1;
  const canNext = page < lastPage;
  const pages = buildPages(page, lastPage);
  const busy = query.isFetching || exportMutation.isPending;

  const resetAll = React.useCallback(() => {
    setQText("");
    setStatus("");
    setRange(undefined);
    setPerPage(10);
    setPage(1);
  }, []);

  const statusLabelText =
    STATUS_OPTIONS.find((o) => o.value === status)?.label ?? "Semua Status";

  const columns = React.useMemo<DataTableColumn<ScheduleListItem>[]>(() => {
    return [
      {
        key: "no",
        header: "No",
        headerClassName: "w-16 text-center",
        className: "py-4 px-2 text-center",
        cell: (_row, idx) => (page - 1) * perPage + (idx + 1),
      },
      {
        key: "date",
        header: "Tanggal",
        headerClassName: "w-36",
        className: "py-4 px-2",
        cell: (row) => formatDateId(row.date),
      },
      {
        key: "time",
        header: "Jam",
        headerClassName: "w-24 text-center",
        className: "py-4 px-2 text-center",
        cell: (row) => hhmm(row.start_time),
      },
      {
        key: "price",
        header: "Harga",
        headerClassName: "w-40 text-center",
        className: "py-4 px-2 text-center",
        cell: (row) => formatRupiah(row.price),
      },
      {
        key: "partner",
        header: "Partner",
        headerClassName: "w-52 text-center",
        className: "py-4 px-2 text-center",
        cell: (row) => (
          <div className="truncate max-w-50 mx-auto">
            {row.partner?.name ?? "-"}
          </div>
        ),
      },
      {
        key: "capacity",
        header: "Kapasitas",
        headerClassName: "w-32 text-center",
        className: "py-4 px-2 text-center",
        cell: (row) => `${row.current_participants}/${row.capacity}`,
      },
      {
        key: "action",
        header: "Aksi",
        headerClassName: "w-32 text-center",
        className: "py-4 px-2 text-center",
        cell: (row) => (
          <div className="flex justify-center">
            <Button asChild size="sm" variant="outline">
              <Link
                href={`/dashboard/admin/schedules/${row.id}`}
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
    <div className="h-full min-h-0 rounded-xl border overflow-hidden flex flex-col">
      <div className="p-4 space-y-2">
        <div className="flex flex-col sm:flex-row gap-3 lg:items-center">
          <div className="flex-1">
            <Input
              value={qText}
              onChange={(e) => setQText(e.target.value)}
              placeholder="Cari partner…"
              disabled={busy}
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

              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Filter Status</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuRadioGroup
                  value={status}
                  onValueChange={setStatus}
                >
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

            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={resetAll}
            >
              Reset
            </Button>

            <Button
              type="button"
              className="whitespace-nowrap"
              disabled={busy}
              onClick={() => exportMutation.mutate()}
              variant="excel"
            >
              {exportMutation.isPending ? "Exporting..." : "Export Excel"}
            </Button>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          {res && (
            <>
              Menampilkan{" "}
              <span className="font-medium text-foreground">
                {res.from ?? 0}
              </span>
              –
              <span className="font-medium text-foreground">{res.to ?? 0}</span>{" "}
              dari{" "}
              <span className="font-medium text-foreground">
                {res.total ?? 0}
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
          onRowClick={(row) =>
            router.push(`/dashboard/admin/schedules/${row.id}`)
          }
          getRowClassName={() => "cursor-pointer hover:bg-muted/50"}
        />
      </div>

      <div className="border-t bg-white">
        <div className="p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 shrink-0">
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
            <PaginationContent className="justify-end w-auto flex-nowrap">
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (!canPrev || busy) return;
                    setPage((p) => Math.max(1, p - 1));
                  }}
                  className={
                    !canPrev || busy
                      ? "pointer-events-none opacity-50"
                      : undefined
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
                    !canNext || busy
                      ? "pointer-events-none opacity-50"
                      : undefined
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
}
