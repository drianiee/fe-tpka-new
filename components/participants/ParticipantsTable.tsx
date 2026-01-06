// components/participants/ParticipantsTable.tsx
"use client";

import Link from "next/link";
import * as React from "react";
import { useRouter } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Filter } from "lucide-react";

import {
  participantsService,
  type ListParticipantsParams,
} from "@/lib/services/participants.service";
import type { ParticipantListItem } from "@/lib/types/participants";
import type { PaginatedResponse } from "@/lib/types/pagination";
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

type VerifiedOption = { label: string; value: string };

const VERIFIED_OPTIONS: VerifiedOption[] = [
  { label: "Semua Status", value: "" },
  { label: "Terverifikasi", value: "verified" },
  { label: "Belum Terverifikasi", value: "unverified" },
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

function VerifiedBadge({ verifiedAt }: { verifiedAt?: string | null }) {
  if (verifiedAt) return <Badge variant="success">Terverifikasi</Badge>;
  return <Badge variant="muted">Belum terverifikasi</Badge>;
}

export function ParticipantsTable() {
  const router = useRouter();

  const [qText, setQText] = React.useState("");
  const [verified, setVerified] = React.useState<string>("");
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(20);

  const qDebounced = useDebouncedValue(qText, 350);

  React.useEffect(() => {
    setPage(1);
  }, [qDebounced, verified, perPage]);

  const params: ListParticipantsParams = React.useMemo(
    () => ({
      q: qDebounced.trim() || undefined,
      verified: verified === "verified" ? true : verified === "unverified" ? false : undefined,
      per_page: perPage,
      page,
    }),
    [qDebounced, verified, perPage, page]
  );

  const query = useQuery<PaginatedResponse<ParticipantListItem>>({
    queryKey: [API_ENDPOINTS.PARTICIPANTS.BASE, params],
    queryFn: () => participantsService.list(params),
    placeholderData: keepPreviousData,
  });

  const res = query.data;
  const rows = res?.data ?? [];
  const lastPage = res?.last_page ?? 1;
  const canPrev = page > 1;
  const canNext = page < lastPage;
  const pages = buildPages(page, lastPage);
  const busy = query.isFetching;

  const resetAll = React.useCallback(() => {
    setQText("");
    setVerified("");
    setPerPage(20);
    setPage(1);
  }, []);

  const verifiedLabelText =
    VERIFIED_OPTIONS.find((o) => o.value === verified)?.label ?? "Semua Status";

  const columns = React.useMemo<DataTableColumn<ParticipantListItem>[]>(() => {
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
        headerClassName: "min-w-[200px]",
        className: "py-4 px-2",
        cell: (row) => (
          <div className="truncate max-w-50">{row.email}</div>
        ),
      },
      {
        key: "verified",
        header: "Verifikasi",
        headerClassName: "w-40 text-center",
        className: "py-4 px-2 text-center",
        cell: (row) => (
          <div className="flex justify-center">
            <VerifiedBadge verifiedAt={row.email_verified_at ?? null} />
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
              <Link href={`/dashboard/admin/peserta/${row.id}`}>Detail</Link>
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
              placeholder="Cari peserta (nama / email)…"
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
                  aria-label="Filter status verifikasi"
                  title={verifiedLabelText}
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Filter Verifikasi</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuRadioGroup
                  value={verified}
                  onValueChange={setVerified}
                >
                  {VERIFIED_OPTIONS.map((o) => (
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
            router.push(`/dashboard/admin/peserta/${row.id}`)
          }
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