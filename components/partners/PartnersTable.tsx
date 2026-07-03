"use client";

import Link from "next/link";
import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import {
  partnersService,
  type ListPartnersParams,
} from "@/lib/services/partners.service";
import type { PartnerListItem } from "@/lib/types/partners";
import type { PaginatedResponse } from "@/lib/types/pagination";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

// import { Badge } from "@/components/ui/badge";
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
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";

function useDebouncedValue<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// function ActiveBadge({ active }: { active?: boolean | null }) {
//   if (active === false) return <Badge variant="muted">Nonaktif</Badge>;
//   return <Badge variant="success">Aktif</Badge>;
// }

function buildPages(current: number, last: number) {
  const total = Math.max(1, last);
  const cur = Math.min(Math.max(1, current), total);
  const windowSize = 1;

  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const start = Math.max(2, cur - windowSize);
  const end = Math.min(total - 1, cur + windowSize);

  const result: Array<number | "ellipsis"> = [1];
  if (start > 2) result.push("ellipsis");
  for (let p = start; p <= end; p++) result.push(p);
  if (end < total - 1) result.push("ellipsis");
  result.push(total);

  return result;
}

export function PartnersTable() {
  const router = useRouter();

  const [qText, setQText] = React.useState("");
  const [perPage, setPerPage] = React.useState(10);
  const [page, setPage] = React.useState(1);

  const qDebounced = useDebouncedValue(qText, 350);

  React.useEffect(() => {
    setPage(1);
  }, [qDebounced, perPage]);

  const params: ListPartnersParams = React.useMemo(
    () => ({
      q: qDebounced.trim() || undefined,
      per_page: perPage,
      page,
    }),
    [qDebounced, perPage, page]
  );

  const query = useQuery<PaginatedResponse<PartnerListItem>>({
    queryKey: [API_ENDPOINTS.PARTNERS.BASE, params],
    queryFn: () => partnersService.list(params),
  });

  const res = query.data;
  const rows = res?.data ?? [];
  const lastPage = res?.last_page ?? 1;
  const canPrev = page > 1;
  const canNext = page < lastPage;
  const pages = React.useMemo(
    () => buildPages(page, lastPage),
    [page, lastPage]
  );
  const busy = query.isFetching;

  const resetAll = React.useCallback(() => {
    setQText("");
    setPerPage(20);
    setPage(1);
  }, []);

  const columns = React.useMemo<DataTableColumn<PartnerListItem>[]>(() => {
    return [
      {
        key: "no",
        header: "No",
        headerClassName: "w-16 text-center",
        className: "py-4 px-2 text-center",
        cell: (_row, idx) => (page - 1) * perPage + (idx + 1),
      },
      {
        key: "name",
        header: "Nama Mitra",
        className: "py-4 px-2",
        cell: (row) => (
          <div className="truncate max-w-50 mx-auto">{row.name}</div>
        ),
      },
      {
        key: "contact_name",
        header: "Nama PIC",
        headerClassName: "text-center",
        className: "py-4 px-2 text-center",
        cell: (row) => row.contact_name ?? "-",
      },
      {
        key: "contact_email",
        header: "Email PIC",
        headerClassName: "text-center",
        className: "py-4 px-2 text-center",
        cell: (row) => (
          <div className="truncate max-w-45 mx-auto">
            {row.contact_email ?? "-"}
          </div>
        ),
      },
      {
        key: "contact_phone",
        header: "Nomor PIC",
        headerClassName: "w-40 text-center",
        className: "py-4 px-2 text-center",
        cell: (row) => row.contact_phone ?? "-",
      },
      // {
      //   key: "status",
      //   header: "Status",
      //   headerClassName: "w-32 text-center",
      //   className: "py-4 px-2 text-center",
      //   cell: (row) => (
      //     <div className="flex justify-center">
      //       <ActiveBadge active={row.is_active ?? true} />
      //     </div>
      //   ),
      // },
      {
        key: "action",
        header: "Detail",
        headerClassName: "w-32 text-center",
        className: "py-4 px-2 text-center",
        cell: (row) => (
          <div className="flex justify-center">
            <Button asChild size="sm" variant="outline">
              <Link href={`/dashboard/admin/mitra/${row.id}`}>Detail</Link>
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
              placeholder="Cari mitra (nama)…"
              disabled={busy}
              className="w-full"
            />
          </div>

          <div className="flex gap-3 items-center">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={resetAll}
            >
              Reset
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
          onRowClick={(row) => router.push(`/dashboard/admin/mitra/${row.id}`)}
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
