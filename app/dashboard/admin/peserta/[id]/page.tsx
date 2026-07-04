// app/dashboard/admin/peserta/[id]/page.tsx
"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, ShieldCheck } from "lucide-react";

import { participantsService } from "@/lib/services/participants.service";
import { authService } from "@/lib/services/auth.service";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { getApiErrorMessage } from "@/lib/api/errors";
import { openWithBearer } from "@/lib/utils/download";

import type {
  ParticipantDetailResponse,
  ParticipantScheduleItem,
} from "@/lib/types/participants";

import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { PageHeaderLayout } from "@/components/layouts/PageHeaderLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// shadcn dialog
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { formatDateId } from "@/lib/utils/datetime";

/* ================= HELPERS ================= */

function normalizeStatus(status?: string | null) {
  return (status ?? "").trim().toLowerCase();
}

function scheduleStatusVariant(
  status?: string | null
): "muted" | "warning" | "success" {
  const s = normalizeStatus(status);
  if (!s) return "muted";

  if (s.includes("belum")) return "muted";
  if (s.includes("berlangsung")) return "warning";
  if (s.includes("selesai")) return "success";

  return "muted";
}

function scheduleStatusLabel(status?: string | null) {
  return status?.trim() || "-";
}

function participantStatusVariant(
  status?: string | null,
  explicitVariant?: "muted" | "warning" | "success" | null
): "muted" | "warning" | "success" {
  if (explicitVariant) return explicitVariant;
  const s = normalizeStatus(status);
  if (!s) return "muted";
  if (s.includes("belum")) return "muted";
  if (s.includes("berlangsung") || s.includes("sedang")) return "warning";
  if (s.includes("selesai") || s.includes("telah")) return "success";
  return "muted";
}

function participantStatusLabel(status?: string | null) {
  return status?.trim() || "-";
}

function formatDateTimeId(v?: string | null) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

function idTypeLabel(v?: string | null) {
  if (!v) return "-";
  const s = v.trim().toLowerCase();
  if (s === "ktp") return "KTP";
  if (s === "ktm") return "KTM";
  if (s === "sim") return "SIM";
  return v;
}

function VerifiedBadge({ verifiedAt }: { verifiedAt?: string | null }) {
  if (verifiedAt) return <Badge variant="success">Terverifikasi</Badge>;
  return <Badge variant="muted">Belum terverifikasi</Badge>;
}

function ActiveBadge({ isActive }: { isActive?: boolean | null }) {
  if (isActive === undefined || isActive === null)
    return <Badge variant="outline">-</Badge>;
  return isActive ? (
    <Badge variant="success">Aktif</Badge>
  ) : (
    <Badge variant="destructive">Nonaktif</Badge>
  );
}

/* ================= PAGE ================= */

export default function AdminParticipantDetailPage() {
  const params = useParams<{ id: string }>();
  const id = String(params?.id ?? "").trim();

  // ===== modal state =====
  const [idImageOpen, setIdImageOpen] = React.useState(false);

  const query = useQuery({
    queryKey: [API_ENDPOINTS.PARTICIPANTS.DETAIL(id)],
    queryFn: () => participantsService.detail(id),
    enabled: Boolean(id),
  });

  const resendMutation = useMutation({
    mutationFn: (email: string) => authService.resendVerify({ email }),
    onSuccess: (data) => {
      toast.success(data?.message ?? "Link verifikasi berhasil dikirim");
    },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e)),
  });

  const downloadCertificateMutation = useMutation({
    mutationFn: (url: string) => openWithBearer(url),
    onError: (e: unknown) => toast.error(getApiErrorMessage(e)),
  });

  const scheduleColumns =
    React.useMemo<DataTableColumn<ParticipantScheduleItem>[]>(
      () => [
        {
          key: "no",
          header: "No",
          headerClassName: "w-11 text-center",
          className: "whitespace-nowrap text-center",
          cell: (_row, idx) => idx + 1,
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
          headerClassName: "w-40 text-center",
          className: "py-4 px-2 text-center",
          cell: (row) => `${row.start_time} - ${row.end_time}`,
        },
        {
          key: "schedule_status",
          header: "Status Jadwal",
          headerClassName: "w-48 text-center",
          className: "py-4 px-2 text-center",
          cell: (row) => (
            <div className="flex justify-center">
              <Badge
                variant={scheduleStatusVariant(row.status_jadwal)}
                className="truncate max-w-45"
              >
                {scheduleStatusLabel(row.status_jadwal)}
              </Badge>
            </div>
          ),
        },
        {
          key: "partner",
          header: "Mitra",
          headerClassName: "text-center min-w-[150px]",
          className: "py-4 px-2 text-center",
          cell: (row) => (
            <div className="truncate max-w-37.5 mx-auto">
              {row.is_partner ? row.partner?.name ?? "-" : "-"}
            </div>
          ),
        },
        {
          key: "participant_status",
          header: "Status Peserta",
          headerClassName: "w-48 text-center",
          className: "py-4 px-2 text-center",
          cell: (row) => (
            <div className="flex justify-center">
              <Badge
                variant={participantStatusVariant(
                  row.participant_status,
                  row.participant_status_variant,
                )}
                className="truncate max-w-45"
              >
                {participantStatusLabel(row.participant_status)}
              </Badge>
            </div>
          ),
        },
        {
          key: "attempt",
          header: "Attempt",
          headerClassName: "w-32 text-center",
          className: "py-4 px-2 text-center",
          cell: (row) => (
            <div className="flex justify-center">
              <span className="text-sm">{row.attempt_id ?? "-"}</span>
            </div>
          ),
        },
        {
          key: "certificate",
          header: "Sertifikat",
          headerClassName: "min-w-[220px] text-center",
          className: "py-4 px-2 text-center",
          cell: (row) => (
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs text-muted-foreground truncate max-w-52">
                {row.certificate?.certificate_no ?? "-"}
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {row.certificate?.download_url ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      row.certificate?.download_url
                        ? downloadCertificateMutation.mutate(
                            row.certificate.download_url,
                          )
                        : null
                    }
                  >
                      <Download className="h-4 w-4" />
                      Unduh
                  </Button>
                ) : null}

                {row.certificate?.verify_url ? (
                  <Button asChild type="button" size="sm" variant="outline">
                    <a
                      href={row.certificate.verify_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      Verifikasi
                    </a>
                  </Button>
                ) : null}
              </div>
            </div>
          ),
        },
      ],
      []
    );

  // ---- early returns AFTER all hooks ----
  if (query.isLoading) {
    return (
      <PageHeaderLayout
        title="Detail Peserta"
        description="Memuat detail peserta..."
      >
        <p className="text-sm text-muted-foreground">Loading...</p>
      </PageHeaderLayout>
    );
  }

  if (query.isError || !query.data) {
    return (
      <PageHeaderLayout
        title="Detail Peserta"
        description="Gagal memuat detail peserta"
        showBack={true}
      >
        <p className="text-sm text-destructive">Gagal load peserta</p>
      </PageHeaderLayout>
    );
  }

  const data: ParticipantDetailResponse = query.data;
  const p = data.participant;
  const schedules: ParticipantScheduleItem[] = data.schedules ?? [];
  const isVerified = Boolean(p.email_verified_at);

  const title = `Peserta #${p.id}`;
  const description = p.name;

  return (
    <PageHeaderLayout title={title} description={description} showBack={true}>
      {/* ===== Modal Foto Identitas ===== */}
      <Dialog open={idImageOpen} onOpenChange={setIdImageOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Foto Identitas</DialogTitle>
            <DialogDescription>
              Klik di luar modal atau tekan ESC untuk menutup.
            </DialogDescription>
          </DialogHeader>

          {p.id_image_url ? (
            <div className="space-y-3">
              <div className="rounded-xl border bg-muted/10 p-2">
                <div className="relative w-full overflow-hidden rounded-lg border bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.id_image_url}
                    alt="Identitas Peserta"
                    className="h-full w-full object-contain"
                    loading="lazy"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIdImageOpen(false)}
                >
                  Tutup
                </Button>

                {/* opsional: buka di tab baru */}
                <Button asChild type="button">
                  <a href={p.id_image_url} target="_blank" rel="noreferrer">
                    Buka tab baru
                  </a>
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Belum ada foto identitas.
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        {/* ===== Participant Summary ===== */}
        <Card className="p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <VerifiedBadge verifiedAt={p.email_verified_at} />
            <ActiveBadge isActive={p.is_active} />
            <Badge variant="outline">ID: {p.id}</Badge>
            <Badge variant="outline">Role: {p.role}</Badge>
            <Badge variant="secondary">
              Total Jadwal: {data.total_schedules ?? schedules.length}
            </Badge>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-[120px_1fr]">
            {/* LEFT: Foto Identitas (klik => modal) */}
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Foto Identitas</div>

              <div className="rounded-xl border bg-muted/10 p-2">
                {p.id_image_url ? (
                  <button
                    type="button"
                    onClick={() => setIdImageOpen(true)}
                    className="w-full text-left space-y-2 focus:outline-none"
                    aria-label="Buka foto identitas"
                    title="Klik untuk memperbesar"
                  >
                    <div className="relative aspect-4/3 w-full overflow-hidden rounded-lg border bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.id_image_url}
                        alt="Identitas Peserta"
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Klik foto untuk memperbesar
                    </div>
                  </button>
                ) : (
                  <div className="text-sm text-muted-foreground p-2">
                    Belum ada foto identitas.
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: Detail */}
            <div className="grid gap-3 md:grid-cols-2 text-sm">
              <div>
                <div className="text-muted-foreground">Nama</div>
                <div className="font-medium wrap-break-word">{p.name}</div>
              </div>

              <div>
                <div className="text-muted-foreground">Email</div>
                <div className="wrap-break-word">{p.email}</div>
              </div>

              <div>
                <div className="text-muted-foreground">Status Verifikasi</div>
                <div className="pt-1">
                  <VerifiedBadge verifiedAt={p.email_verified_at} />
                </div>
              </div>

              <div>
                <div className="text-muted-foreground">Profile Completed</div>
                <div className="pt-1">
                  {p.profile_completed_at ? (
                    <Badge variant="success">Ya</Badge>
                  ) : (
                    <Badge variant="muted">Belum</Badge>
                  )}
                </div>
              </div>

              <div>
                <div className="text-muted-foreground">Jenis Identitas</div>
                <div className="font-medium">{idTypeLabel(p.id_type)}</div>
              </div>

              <div>
                <div className="text-muted-foreground">No HP</div>
                <div className="font-medium">{p.phone ?? "-"}</div>
              </div>

              <div>
                <div className="text-muted-foreground">Tanggal Lahir</div>
                <div className="font-medium">{formatDateTimeId(p.birth_date)}</div>
              </div>

              <div>
                <div className="text-muted-foreground">Dibuat</div>
                <div className="font-medium">
                  {formatDateTimeId(p.created_at)}
                </div>
              </div>
            </div>
          </div>

          {!isVerified && (
            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={resendMutation.isPending}
                onClick={() => resendMutation.mutate(p.email)}
              >
                {resendMutation.isPending
                  ? "Mengirim..."
                  : "Kirim ulang verifikasi"}
              </Button>
            </div>
          )}
        </Card>

        {/* ===== Schedules ===== */}
        <Card className="p-4 space-y-3">
          <div>
            <h3 className="text-sm font-semibold">Jadwal yang diikuti</h3>
            <div className="text-xs text-muted-foreground mt-1">
              Total: {data.total_schedules ?? schedules.length} jadwal
            </div>
          </div>

          <div className="rounded-xl border overflow-hidden flex flex-col">
            <div className="flex-1 min-h-0 overflow-auto">
              <DataTable
                columns={scheduleColumns}
                rows={schedules}
                getRowKey={(r) =>
                  `${r.schedule_id}-${r.date}-${r.start_time}-${r.end_time}`
                }
                loading={query.isFetching}
                emptyText="Tidak ada jadwal"
                stickyHeader
              />
            </div>
          </div>
        </Card>
      </div>
    </PageHeaderLayout>
  );
}
