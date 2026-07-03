"use client";

import Link from "next/link";
import * as React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { partnersService } from "@/lib/services/partners.service";
import type {
  PartnerDetailResponse,
  PartnerScheduleItem,
} from "@/lib/types/partners";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { getApiErrorMessage } from "@/lib/api/errors";
import { formatRupiah, hhmm } from "@/lib/utils/format";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { PageHeaderLayout } from "@/components/layouts/PageHeaderLayout";

// function ActiveBadge({ active }: { active?: boolean | null }) {
//   if (active === false) return <Badge variant="muted">Nonaktif</Badge>;
//   return <Badge variant="success">Aktif</Badge>;
// }

function statusVariant(
  status?: string | null,
): "muted" | "warning" | "success" {
  if (!status) return "muted";
  if (status === "belum-dimulai") return "muted";
  if (status === "sedang-berlangsung") return "warning";
  return "success";
}

function statusLabel(status?: string | null) {
  if (!status) return "-";
  if (status === "belum-dimulai") return "Tes Belum Dimulai";
  if (status === "sedang-berlangsung") return "Tes Sedang Berlangsung";
  if (status === "telah-selesai") return "Tes Telah Selesai";
  return status;
}

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

export default function AdminPartnerDetailPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
          Memuat halaman...
        </div>
      }
    >
      <AdminPartnerDetailPageContent />
    </React.Suspense>
  );
}

function AdminPartnerDetailPageContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const sp = useSearchParams();

  const partnerId = Number(id);
  const pageRaw = Number(sp.get("page") || "1");
  const perPageRaw = Number(sp.get("per_page") || "20");

  const params = React.useMemo(() => {
    return {
      page: Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1,
      per_page: Number.isFinite(perPageRaw) && perPageRaw > 0 ? perPageRaw : 20,
    };
  }, [pageRaw, perPageRaw]);

  const q = useQuery<PartnerDetailResponse>({
    queryKey: [API_ENDPOINTS.PARTNERS.DETAIL(partnerId), params],
    queryFn: () => partnersService.detail(partnerId, params),
    enabled: Number.isFinite(partnerId),
    placeholderData: keepPreviousData,
  });

  const exportSchedulesMut = useMutation({
    mutationFn: () => partnersService.exportSchedules(partnerId),
    onSuccess: ({ blob, filename }) => {
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success("Berhasil export jadwal mitra")
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const data = q.data;
  const partner = data?.partner ?? null;
  const schedulesRes = data?.schedules ?? null;
  const schedules: PartnerScheduleItem[] = schedulesRes?.data ?? [];

  const lastPage = schedulesRes?.last_page ?? 1;
  const canPrev = params.page > 1;
  const canNext = params.page < lastPage;

  const pages = React.useMemo(
    () => buildPages(params.page, lastPage),
    [params.page, lastPage],
  );

  const hrefFor = (p: number) => {
    const usp = new URLSearchParams();
    if (params.per_page !== 20) usp.set("per_page", String(params.per_page));
    if (p !== 1) usp.set("page", String(p));
    const qs = usp.toString();
    return qs
      ? `/dashboard/admin/mitra/${partnerId}?${qs}`
      : `/dashboard/admin/mitra/${partnerId}`;
  };

  const onChangePerPage = (v: number) => {
    const u = new URLSearchParams(sp.toString());
    if (v !== 20) u.set("per_page", String(v));
    else u.delete("per_page");
    u.delete("page");
    const qs = u.toString();
    router.push(
      qs
        ? `/dashboard/admin/mitra/${partnerId}?${qs}`
        : `/dashboard/admin/mitra/${partnerId}`,
    );
  };

  const columns = React.useMemo<DataTableColumn<PartnerScheduleItem>[]>(() => {
    return [
      {
        key: "no",
        header: "No",
        headerClassName: "w-16 text-center",
        className: "py-4 px-2 text-center",
        cell: (_row, idx) => (params.page - 1) * params.per_page + (idx + 1),
      },
      {
        key: "date",
        header: "Tanggal",
        headerClassName: "w-36",
        className: "py-4 px-2",
        cell: (row) => row.date,
      },
      {
        key: "time",
        header: "Jam",
        headerClassName: "w-40 text-center",
        className: "py-4 px-2 text-center",
        cell: (row) => `${hhmm(row.start_time)} - ${hhmm(row.end_time)}`,
      },
      {
        key: "price",
        header: "Harga",
        headerClassName: "w-40 text-center",
        className: "py-4 px-2 text-center",
        cell: (row) => formatRupiah(row.price),
      },
      {
        key: "capacity",
        header: "Kapasitas",
        headerClassName: "w-32 text-center",
        className: "py-4 px-2 text-center",
        cell: (row) => `${row.current_participants}/${row.capacity}`,
      },
      {
        key: "status",
        header: "Status",
        headerClassName: "w-48 text-center",
        className: "py-4 px-2 text-center",
        cell: (row) => (
          <div className="flex justify-center">
            <Badge
              variant={statusVariant(row.status)}
              className="truncate max-w-45"
            >
              {statusLabel(row.status)}
            </Badge>
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
              <Link href={`/dashboard/admin/schedules/${row.id}`}>Detail</Link>
            </Button>
          </div>
        ),
      },
    ];
  }, [params.page, params.per_page]);

  if (q.isLoading) {
    return (
      <PageHeaderLayout
        title="Detail Mitra"
        description="Memuat detail mitra..."
      >
        <p className="text-sm text-muted-foreground">Loading...</p>
      </PageHeaderLayout>
    );
  }

  if (q.isError || !partner) {
    return (
      <PageHeaderLayout
        title="Detail Mitra"
        description="Gagal memuat detail mitra"
      >
        <p className="text-sm text-destructive">Gagal load partner</p>
      </PageHeaderLayout>
    );
  }

  const title = `Mitra #${partner.id} — ${partner.name}`;

  return (
    <PageHeaderLayout title={title} showBack={true}>
      <div className="space-y-4">
        <Card className="p-4 space-y-3">
          <div className="grid gap-3 md:grid-cols-4 text-sm">
            <div>
              <div className="text-muted-foreground">PIC</div>
              <div
                className="font-medium truncate"
                title={partner.contact_name ?? "-"}
              >
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
          <div className="flex items-center justify-between gap-3">
            <div>
            <h3 className="text-lg font-semibold">Jadwal</h3>
            <div className="text-xs text-muted-foreground">
              {schedulesRes && (
                <>
                  Menampilkan{" "}
                  <span className="font-medium text-foreground">
                    {schedulesRes.from ?? 0}
                  </span>
                  –
                  <span className="font-medium text-foreground">
                    {schedulesRes.to ?? 0}
                  </span>{" "}
                  dari{" "}
                  <span className="font-medium text-foreground">
                    {schedulesRes.total ?? 0}
                  </span>
                </>
              )}
            </div>
            </div>
            <Button
              variant="excel"
              onClick={() => exportSchedulesMut.mutate()}
              disabled={exportSchedulesMut.isPending}
            >
              {exportSchedulesMut.isPending ? "Exporting..." : "Export Excel"}
            </Button>
          </div>

          <div className="rounded-xl border overflow-hidden flex flex-col">
            <div className="flex-1 min-h-0 overflow-auto">
              <DataTable
                columns={columns}
                rows={schedules}
                getRowKey={(r) => r.id}
                loading={q.isFetching}
                emptyText="Tidak ada schedule"
                stickyHeader
                onRowClick={(row) =>
                  router.push(`/dashboard/admin/schedules/${row.id}`)
                }
                getRowClassName={() =>
                  "cursor-pointer transition-colors hover:bg-muted/30 focus-visible:bg-muted/30"
                }
              />
            </div>

            <div className="border-t bg-white">
              <div className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Per halaman
                  </span>
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
                <Pagination className="ml-auto w-full justify-end">
                  <PaginationContent className="justify-end w-full">
                    <PaginationItem>
                      <PaginationPrevious
                        href={hrefFor(Math.max(1, params.page - 1))}
                        onClick={(e) => {
                          e.preventDefault();
                          if (!canPrev || q.isFetching) return;
                          router.push(hrefFor(Math.max(1, params.page - 1)));
                        }}
                        className={
                          !canPrev || q.isFetching
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
                            href={hrefFor(p)}
                            isActive={p === params.page}
                            onClick={(e) => {
                              e.preventDefault();
                              if (q.isFetching) return;
                              router.push(hrefFor(p));
                            }}
                          >
                            {String(p)}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}

                    <PaginationItem>
                      <PaginationNext
                        href={hrefFor(Math.min(lastPage, params.page + 1))}
                        onClick={(e) => {
                          e.preventDefault();
                          if (!canNext || q.isFetching) return;
                          router.push(
                            hrefFor(Math.min(lastPage, params.page + 1)),
                          );
                        }}
                        className={
                          !canNext || q.isFetching
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
        </Card>
      </div>
    </PageHeaderLayout>
  );
}
