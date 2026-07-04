// components/packages/QuestionPackagesTable.tsx
"use client";

import Link from "next/link";
import * as React from "react";
import { useRouter } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Filter } from "lucide-react";

import { questionPackagesService } from "@/lib/services/questionPackages.service";
import type { QuestionPackage } from "@/lib/types/question-packages";
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

function ActiveBadge({ status }: { status: QuestionPackage["status"] }) {
  if (status === "published") return <Badge variant="success">Aktif</Badge>;
  return <Badge variant="muted">Nonaktif</Badge>;
}

export function QuestionPackagesTable() {
  const router = useRouter();
  const basePath = "/dashboard/admin/question-packages";

  const [qText, setQText] = React.useState("");
  const [status, setStatus] = React.useState<string>("");
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(10);

  const qDebounced = useDebouncedValue(qText, 350);

  React.useEffect(() => {
    setPage(1);
  }, [qDebounced, status, perPage]);

  const params = React.useMemo(() => {
    const q = qDebounced.trim() || undefined;
    const is_active =
      status === "active" ? true : status === "inactive" ? false : undefined;

    return {
      q,
      is_active,
      per_page: perPage,
      page,
    };
  }, [qDebounced, status, perPage, page]);

  const query = useQuery<PaginatedResponse<QuestionPackage>>({
    queryKey: [API_ENDPOINTS.QUESTION_PACKAGES.BASE, params],
    queryFn: () => questionPackagesService.list(params),
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
    setStatus("");
    setPerPage(10);
    setPage(1);
  }, []);

  const statusLabelText =
    STATUS_OPTIONS.find((o) => o.value === status)?.label ?? "Semua Status";

  const columns = React.useMemo<DataTableColumn<QuestionPackage>[]>(() => {
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
        key: "questions",
        header: "Soal / Durasi",
        headerClassName: "min-w-[200px]",
        className: "py-4 px-2",
        cell: (row) => (
          <div className="truncate max-w-50 mx-auto">
            {row.total_questions}/{row.target_total_questions ?? 0} soal / {row.total_duration_minutes} menit
          </div>
        ),
      },
      {
        key: "summary",
        header: "Sesi",
        headerClassName: "min-w-[200px]",
        className: "py-4 px-2",
        cell: (row) => (
          <div className="flex flex-col gap-1 text-xs">
            <span>Verbal: {row.summary?.verbal ?? 0}/{row.sections?.find((s) => s.code === "verbal")?.target_question_count ?? 0}</span>
            <span>Kuant: {row.summary?.kuantitatif ?? 0}/{row.sections?.find((s) => s.code === "kuantitatif")?.target_question_count ?? 0}</span>
            <span>Logika: {row.summary?.logika ?? 0}/{row.sections?.find((s) => s.code === "logika")?.target_question_count ?? 0}</span>
            <span>Spasial: {row.summary?.spasial ?? 0}/{row.sections?.find((s) => s.code === "spasial")?.target_question_count ?? 0}</span>
          </div>
        ),
      },
      {
        key: "scoring",
        header: "Skoring",
        headerClassName: "min-w-[220px]",
        className: "py-4 px-2",
        cell: (row) => (
          <div className="text-xs leading-5">
            <div>Template: {row.base_score}</div>
            <div>Benar: +{row.correct_answer_score}/soal</div>
            <div>
              Maks: {row.base_score + (row.target_total_questions ?? 0) * row.correct_answer_score}
            </div>
          </div>
        ),
      },
      {
        key: "status",
        header: "Status",
        headerClassName: "w-32 text-center",
        className: "py-4 px-2 text-center",
        cell: (row) => (
          <div className="flex justify-center">
            <ActiveBadge status={row.status} />
          </div>
        ),
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
                href={`${basePath}/${row.id}`}
                onClick={(e) => e.stopPropagation()}
              >
                Detail
              </Link>
            </Button>
          </div>
        ),
      },
    ];
  }, [basePath, page, perPage]);

  return (
    <div className="h-full min-h-0 rounded-xl border overflow-hidden flex flex-col">
      <div className="p-4 space-y-2">
        <div className="flex flex-col sm:flex-row gap-3 lg:items-center">
          <div className="flex-1">
            <Input
              value={qText}
              onChange={(e) => setQText(e.target.value)}
              placeholder="Cari nama paket soal..."
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
            router.push(`${basePath}/${row.id}`)
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
