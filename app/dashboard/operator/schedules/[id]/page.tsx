// app/dashboard/admin/schedules/[id]/page.tsx
"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { schedulesService } from "@/lib/services/schedules.service";
import type { PartnerImportResponse } from "@/lib/types/schedules";
import type {
  ScheduleDetail,
  ScheduleParticipant,
  ExportScheduleParticipantsResponse,
} from "@/lib/types/schedules";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { getApiErrorMessage } from "@/lib/api/errors";
import { formatRupiah, hhmm } from "@/lib/utils/format";
import { formatDateId } from "@/lib/utils/datetime";
import { getToken } from "@/lib/utils/storage";

import { PageHeaderLayout } from "@/components/layouts/PageHeaderLayout";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

const importSchema = z.object({
  file: z
    .instanceof(File, { message: "File wajib di-upload" })
    .refine((f) => /\.(xlsx|xls)$/i.test(f.name), "File harus .xlsx / .xls"),
});

type ImportForm = z.infer<typeof importSchema>;

function importSummaryText(res: PartnerImportResponse) {
  const s = res.summary;
  if (!s) return "";
  const parts: string[] = [];
  if (typeof s.attached_to_schedule === "number")
    parts.push(`Terpasang: ${s.attached_to_schedule}`);
  if (typeof s.created_users === "number") parts.push(`User dibuat: ${s.created_users}`);
  if (typeof s.sent_invitations === "number")
    parts.push(`Invitation: ${s.sent_invitations}`);
  if (typeof s.skipped_rows === "number") parts.push(`Skip: ${s.skipped_rows}`);
  return parts.join(" • ");
}

function scoreCell(v?: number | null) {
  if (v === null || v === undefined) return "-";
  return String(v);
}
function normalizeScheduleStatus(status?: string | null) {
  if (!status) return "";

  const s = status.toLowerCase();

  if (s.includes("belum")) return "belum-dimulai";
  if (s.includes("sedang")) return "sedang-berlangsung";
  if (s.includes("selesai")) return "selesai";

  return "";
}

function scheduleStatusVariant(
  status?: string | null
): "muted" | "warning" | "success" {
  const s = normalizeScheduleStatus(status);

  if (s === "sedang-berlangsung") return "warning";
  if (s === "selesai") return "success";
  return "muted";
}

function scheduleStatusLabel(status?: string | null) {
  const s = normalizeScheduleStatus(status);

  if (s === "belum-dimulai") return "Tes Belum Dimulai";
  if (s === "sedang-berlangsung") return "Tes Sedang Berlangsung";
  if (s === "selesai") return "Tes Selesai";

  return "-";
}

function normalizeStatus(status?: string | null) {
  return (status ?? "").trim().toLowerCase();
}

function statusVariant(status?: string | null): "muted" | "warning" | "success" {
  const s = normalizeStatus(status);
  if (!s) return "muted";
  if (s === "peserta belum terdaftar") return "muted";
  if (s === "peserta terdaftar") return "success";
  if (s === "peserta mengakses tes") return "warning";
  if (s === "peserta selesai tes") return "success";
  return "muted";
}

function statusLabel(status?: string | null) {
  const s = normalizeStatus(status);
  if (!s) return "-";
  if (s === "peserta belum terdaftar") return "Peserta Belum Terdaftar";
  if (s === "peserta terdaftar") return "Peserta Terdaftar";
  if (s === "peserta mengakses tes") return "Peserta Mengakses Tes";
  if (s === "peserta selesai tes") return "Peserta Selesai Tes";
  return status ?? "-";
}

function buildPages(page: number, lastPage: number) {
  const total = Math.max(1, lastPage);
  const current = Math.min(Math.max(1, page), total);
  const windowSize = 1;

  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1) as Array<number | "ellipsis">;
  }

  const start = Math.max(2, current - windowSize);
  const end = Math.min(total - 1, current + windowSize);

  const result: Array<number | "ellipsis"> = [1];
  if (start > 2) result.push("ellipsis");
  for (let p = start; p <= end; p++) result.push(p);
  if (end < total - 1) result.push("ellipsis");
  result.push(total);

  return result;
}

// ✅ helper: buka/download file yang butuh Bearer token
async function openWithBearer(url: string) {
  const token = getToken();
  if (!token) throw new Error("Token tidak ditemukan. Silakan login ulang.");

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "*/*",
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Gagal mengunduh. HTTP ${res.status}`);
  }

  const blob = await res.blob();
  const objUrl = URL.createObjectURL(blob);
  window.open(objUrl, "_blank", "noopener,noreferrer");

  window.setTimeout(() => URL.revokeObjectURL(objUrl), 60_000);
}

export default function AdminScheduleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const scheduleId = Number(id);
  const [importOpen, setImportOpen] = React.useState(false);

  const [qText, setQText] = React.useState("");
  const qDebounced = useDebouncedValue(qText, 350);

  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(10);

  React.useEffect(() => {
    setPage(1);
  }, [qDebounced, perPage]);

  const params = React.useMemo(
    () => ({
      q: qDebounced.trim() || undefined,
      per_page: perPage,
      page,
    }),
    [qDebounced, perPage, page]
  );

  const exportParticipantsMut = useMutation({
    mutationFn: () => schedulesService.exportParticipants(scheduleId),
    onSuccess: (res: ExportScheduleParticipantsResponse) => {
      toast.success(res.message ?? "Berhasil export peserta");
      if (res.download_url) window.open(res.download_url, "_blank", "noopener,noreferrer");
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const downloadCertMut = useMutation({
    mutationFn: (url: string) => openWithBearer(url),
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  // ✅ per-row loading (biar nggak disable semua tombol)
  const [downloadingUrl, setDownloadingUrl] = React.useState<string | null>(null);

  const handleDownloadCert = React.useCallback(
    async (url: string) => {
      try {
        setDownloadingUrl(url);
        await downloadCertMut.mutateAsync(url);
      } finally {
        setDownloadingUrl(null);
      }
    },
    [downloadCertMut]
  );

  const columns = React.useMemo<DataTableColumn<ScheduleParticipant>[]>(() => {
    return [
      {
        key: "no",
        header: "No",
        headerClassName: "w-11 text-center",
        className: "whitespace-nowrap text-center",
        cell: (_row, idx) => (page - 1) * perPage + (idx + 1),
      },
      {
        key: "name",
        header: "Nama",
        headerClassName: "w-35",
        className: "truncate font-medium",
        cell: (row) => (
          <div className="truncate" title={row.name}>
            {row.name}
          </div>
        ),
      },
      {
        key: "email",
        header: "Email",
        headerClassName: "w-42.5",
        className: "truncate",
        cell: (row) => (
          <div className="truncate" title={row.email}>
            {row.email}
          </div>
        ),
      },
      {
        key: "status",
        header: "Status",
        headerClassName: "w-32.5 text-center",
        className: "truncate text-center",
        cell: (row) => (
          <div className="flex justify-center">
            <Badge variant={statusVariant(row.status)} className="capitalize">
              {statusLabel(row.status)}
            </Badge>
          </div>
        ),
      },
      {
        key: "verbal",
        header: "Verbal",
        headerClassName: "w-14.5 text-center",
        className: "text-center whitespace-nowrap",
        cell: (row) => scoreCell(row.scores?.verbal),
      },
      {
        key: "kuantitatif",
        header: "Kuantitatif",
        headerClassName: "w-14.5 text-center",
        className: "text-center whitespace-nowrap",
        cell: (row) => scoreCell(row.scores?.kuantitatif),
      },
      {
        key: "logika",
        header: "Logika",
        headerClassName: "w-14.5 text-center",
        className: "text-center whitespace-nowrap",
        cell: (row) => scoreCell(row.scores?.logika),
      },
      {
        key: "spasial",
        header: "Spatial",
        headerClassName: "w-14.5 text-center",
        className: "text-center whitespace-nowrap",
        cell: (row) => scoreCell(row.scores?.spasial),
      },
      {
        key: "total",
        header: "Total",
        headerClassName: "w-14.5 text-center",
        className: "text-center whitespace-nowrap",
        cell: (row) => scoreCell(row.scores?.total),
      },
      {
        key: "certificate",
        header: "Sertifikat",
        headerClassName: "w-30 text-center",
        className: "text-center whitespace-nowrap",
        cell: (row) => {
          const certUrl = row.certificate_download_url ?? null;
          const isRowDownloading = Boolean(certUrl && downloadingUrl === certUrl);

          return certUrl ? (
            <Button
              size="sm"
              variant="outline"
              disabled={isRowDownloading}
              onClick={() => handleDownloadCert(certUrl)}
            >
              {isRowDownloading ? "Membuka..." : "Unduh"}
            </Button>
          ) : (
            <span className="text-sm text-muted-foreground">-</span>
          );
        },
      },
    ];
  }, [page, perPage, downloadingUrl, handleDownloadCert]);

  const detailQuery = useQuery({
    queryKey: [API_ENDPOINTS.SCHEDULES.DETAIL(scheduleId), params],
    queryFn: () => schedulesService.detail(scheduleId, params),
    enabled: Number.isFinite(scheduleId),
    placeholderData: keepPreviousData,
  });

  const importForm = useForm<ImportForm>({
    resolver: zodResolver(importSchema),
    defaultValues: {},
    mode: "onSubmit",
  });

  const importMut = useMutation({
    mutationFn: (file: File) => schedulesService.partnerImport(scheduleId, file),
    onSuccess: (res) => {
      const sum = importSummaryText(res);
      toast.success(sum ? `${res.message} (${sum})` : res.message ?? "Import berhasil");

      qc.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          q.queryKey[0] === API_ENDPOINTS.SCHEDULES.DETAIL(scheduleId),
      });

      importForm.reset();
      setImportOpen(false);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  if (detailQuery.isLoading) {
    return (
      <PageHeaderLayout title="Detail Jadwal" description="Memuat detail jadwal...">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </PageHeaderLayout>
    );
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <PageHeaderLayout title="Detail Jadwal" description="Gagal memuat detail jadwal">
        <p className="text-sm text-destructive">Gagal load schedule</p>
      </PageHeaderLayout>
    );
  }

  const d: ScheduleDetail = detailQuery.data;

  const participantsPage = d.participants;
  const rows = participantsPage?.data ?? [];

  const lastPage = participantsPage?.last_page ?? 1;
  const canPrev = page > 1;
  const canNext = page < lastPage;
  const pages = buildPages(page, lastPage);

  const busy = detailQuery.isFetching;

  const packages = d.packages ?? [];
  const isPartnerSchedule = Boolean(d.partner?.id);

  const title = `Schedule #${d.id}`;
  const description = `${formatDateId(d.date)} • ${hhmm(d.start_time)} - ${hhmm(d.end_time)}`;

  const actions = isPartnerSchedule ? (
    <Dialog
      open={importOpen}
      onOpenChange={(v) => {
        setImportOpen(v);
        if (!v) importForm.reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="excel" disabled={importMut.isPending}>
          Import Peserta Mitra (XLSX)
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Import Peserta Mitra</DialogTitle>
          <DialogDescription>
            Upload file Excel untuk menambahkan peserta ke jadwal ini.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="text-sm font-medium">Aturan file</div>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
              Format: <span className="font-medium text-foreground">.xlsx</span> /{" "}
              <span className="font-medium text-foreground">.xls</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
              Kolom wajib: <span className="font-medium text-foreground">name</span>,{" "}
              <span className="font-medium text-foreground">email</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
              Baris dengan email tidak valid akan{" "}
              <span className="font-medium text-foreground">di-skip</span>
            </li>
          </ul>
        </div>

        <form
          className="mt-4 space-y-5"
          onSubmit={importForm.handleSubmit((v) => importMut.mutate(v.file))}
        >
          <div className="space-y-2">
            <Label htmlFor="partner-import-file">
              File Excel <span className="text-destructive">*</span>
            </Label>

            <div className="rounded-lg border bg-white p-3">
              <Controller
                control={importForm.control}
                name="file"
                render={({ field }) => (
                  <Input
                    id="partner-import-file"
                    type="file"
                    accept=".xlsx,.xls"
                    disabled={importMut.isPending}
                    className="cursor-pointer"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      field.onChange(file ?? undefined);
                    }}
                  />
                )}
              />

              {importForm.formState.errors.file?.message ? (
                <p className="mt-2 text-sm text-destructive">
                  {importForm.formState.errors.file.message}
                </p>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">
                  Pastikan header kolom sesuai agar proses import berjalan lancar.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setImportOpen(false)}
              disabled={importMut.isPending}
            >
              Batal
            </Button>

            <Button type="submit" disabled={importMut.isPending}>
              {importMut.isPending ? "Mengimpor..." : "Import"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  ) : null;

  return (
    <PageHeaderLayout title={title} description={description} actions={actions}>
      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
          <div>
            <div className="text-muted-foreground">Harga</div>
            <div>{formatRupiah(d.price)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Kapasitas</div>
            <div>{d.capacity}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Peserta</div>
            <div>{d.current_participants}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Partner</div>
            <div>{d.partner?.name ?? "-"}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Status</div>
<Badge variant={scheduleStatusVariant(d.status)}>
  {scheduleStatusLabel(d.status)}
</Badge>
          </div>
        </div>

        <div>
          <div className="text-muted-foreground text-sm mb-1">Paket Soal</div>
          {packages.length === 0 ? (
            <span className="text-sm text-muted-foreground">-</span>
          ) : (
            <div className="flex flex-wrap gap-1">
              {packages.map((p) => (
                <Badge key={p.id} variant="outline">
                  {p.name}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {d.moodle_course_id ? (
            <Badge variant="secondary">Course: {d.moodle_course_id}</Badge>
          ) : null}
          {d.moodle_quiz_id ? <Badge variant="secondary">Quiz: {d.moodle_quiz_id}</Badge> : null}
          {d.moodle_quiz_cmid ? <Badge variant="secondary">CMID: {d.moodle_quiz_cmid}</Badge> : null}
          {d.quiz_url ? (
            <Button asChild size="sm" variant="outline">
              <a href={d.quiz_url} target="_blank" rel="noreferrer">
                Buka Quiz
              </a>
            </Button>
          ) : null}
        </div>
      </Card>

      <div className="rounded-xl border overflow-hidden flex flex-col mt-4">
        <div className="p-4 space-y-2">
          <div className="flex flex-col sm:flex-row gap-3 lg:items-center">
            <div className="flex-1">
              <Input
                value={qText}
                onChange={(e) => setQText(e.target.value)}
                placeholder="Cari peserta (nama / email)…"
                className="w-full"
              />
            </div>

            <Button
              variant="excel"
              onClick={() => exportParticipantsMut.mutate()}
              disabled={exportParticipantsMut.isPending}
            >
              {exportParticipantsMut.isPending ? "Exporting..." : "Export Peserta (XLSX)"}
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            {participantsPage ? (
              <>
                Menampilkan{" "}
                <span className="font-medium text-foreground">{participantsPage.from ?? 0}</span>–
                <span className="font-medium text-foreground">{participantsPage.to ?? 0}</span> dari{" "}
                <span className="font-medium text-foreground">{participantsPage.total ?? 0}</span>
              </>
            ) : null}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-auto border-t">
          <DataTable
            columns={columns}
            rows={rows}
            getRowKey={(r) => r.id}
            loading={detailQuery.isFetching}
            emptyText="Data tidak ditemukan"
            stickyHeader
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
                    className={!canPrev || busy ? "pointer-events-none opacity-50" : undefined}
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
                        className={busy ? "pointer-events-none opacity-50" : undefined}
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
                    className={!canNext || busy ? "pointer-events-none opacity-50" : undefined}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </div>
    </PageHeaderLayout>
  );
}
