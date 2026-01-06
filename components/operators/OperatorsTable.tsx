// components/operators/OperatorsTable.tsx
"use client";

import Link from "next/link";
import * as React from "react";
import { useRouter } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Filter } from "lucide-react";

import {
  operatorsService,
  type ListOperatorsParams,
} from "@/lib/services/operators.service";
import type { OperatorListItem } from "@/lib/types/operators";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";

import { Badge } from "@/components/ui/badge";
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
  { label: "Aktif", value: "active" },
  { label: "Nonaktif", value: "inactive" },
];

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

function ActiveBadge({ active }: { active?: boolean | null }) {
  if (active === false) return <Badge variant="muted">Nonaktif</Badge>;
  return <Badge variant="success">Aktif</Badge>;
}

export function OperatorsTable() {
  const router = useRouter();

  const [qText, setQText] = React.useState("");
  const [status, setStatus] = React.useState<string>("");
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(20);

  const qDebounced = useDebouncedValue(qText, 350);

  React.useEffect(() => {
    setPage(1);
  }, [qDebounced, status, perPage]);

  const q = React.useMemo(() => qDebounced.trim(), [qDebounced]);
  const params: ListOperatorsParams = React.useMemo(
    () => ({
      q: q || undefined,
      is_active:
        status === "active" ? true : status === "inactive" ? false : undefined,
      per_page: perPage,
      page,
    }),
    [q, status, perPage, page]
  );

  const queryKey = React.useMemo(
    () => [API_ENDPOINTS.ADMIN.OPERATORS, page, perPage, q, status] as const,
    [page, perPage, q, status]
  );

  const query = useQuery({
    queryKey,
    queryFn: () => operatorsService.list(params),
    placeholderData: keepPreviousData,
  });

  const res = query.data;
  const rows: OperatorListItem[] = res?.data ?? [];
  const lastPage = res?.last_page ?? 1;
  const canPrev = page > 1;
  const canNext = page < lastPage;
  const pages = buildPages(page, lastPage);
  const busy = query.isFetching;

  const resetAll = React.useCallback(() => {
    setQText("");
    setStatus("");
    setPerPage(20);
    setPage(1);
  }, []);

  const statusLabelText =
    STATUS_OPTIONS.find((o) => o.value === status)?.label ?? "Semua Status";

  const columns = React.useMemo<DataTableColumn<OperatorListItem>[]>(() => {
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
        header: "Nama",
        headerClassName: "min-w-[200px]",
        className: "py-4 px-2",
        cell: (row) => (
          <div className="truncate max-w-50">{row.name}</div>
        ),
      },
      {
        key: "email",
        header: "Email",
        headerClassName: "min-w-[220px]",
        className: "py-4 px-2",
        cell: (row) => (
          <div className="truncate max-w-55">{row.email}</div>
        ),
      },
      {
        key: "status",
        header: "Status",
        headerClassName: "w-32 text-center",
        className: "py-4 px-2 text-center",
        cell: (row) => (
          <div className="flex justify-center">
            <ActiveBadge active={row.is_active} />
          </div>
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
                href={`/dashboard/admin/operators/${row.id}`}
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
              placeholder="Cari operator (nama / email)…"
              disabled={busy}
              className="w-full"
            />
          </div>

          <div className="flex gap-3 items-center">
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
              <span className="font-medium text-foreground">{res.from ?? 0}</span>
              –
              <span className="font-medium text-foreground">{res.to ?? 0}</span>{" "}
              dari{" "}
              <span className="font-medium text-foreground">{res.total ?? 0}</span>
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
          onRowClick={(row) => router.push(`/dashboard/admin/operators/${row.id}`)}
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
  );
}
