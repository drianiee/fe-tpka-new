// app/dashboard/admin/peserta/[id]/page.tsx
"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { participantsService } from "@/lib/services/participants.service";
import { authService } from "@/lib/services/auth.service";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { getApiErrorMessage } from "@/lib/api/errors";
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
import { formatDateId } from "@/lib/utils/datetime";

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
  status?: string | null
): "muted" | "warning" | "success" {
  const s = normalizeStatus(status);
  if (!s) return "muted";
  if (s === "peserta belum terdaftar") return "muted";
  if (s === "peserta terdaftar") return "success";
  return "muted";
}

function participantStatusLabel(status?: string | null) {
  const s = normalizeStatus(status);
  if (!s) return "-";
  if (s === "peserta belum terdaftar") return "Peserta Belum Terdaftar";
  if (s === "peserta terdaftar") return "Peserta Terdaftar";
  return status ?? "-";
}

function VerifiedBadge({ verifiedAt }: { verifiedAt?: string | null }) {
  if (verifiedAt) return <Badge variant="success">Terverifikasi</Badge>;
  return <Badge variant="muted">Belum terverifikasi</Badge>;
}

export default function AdminParticipantDetailPage() {
  const params = useParams();
  const id = String(params?.id ?? "");

  const query = useQuery({
    queryKey: [API_ENDPOINTS.PARTICIPANTS.DETAIL(id)],
    queryFn: () => participantsService.detail(id),
    enabled: Boolean(id),
  });

  const resendMutation = useMutation({
    mutationFn: (email: string) => authService.resendVerify({ email }),
    onSuccess: (data) => {
      toast.success(data?.message ?? "Link verifikasi telah berhasil dikirim");
    },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e)),
  });

  const scheduleColumns = React.useMemo<
    DataTableColumn<ParticipantScheduleItem>[]
  >(
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
              variant={participantStatusVariant(row.participant_status)}
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
      <div className="space-y-4">
        <Card className="p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <VerifiedBadge verifiedAt={p.email_verified_at} />
            <Badge variant="outline">ID: {p.id}</Badge>
            <Badge variant="secondary">
              Total Jadwal: {data.total_schedules ?? schedules.length}
            </Badge>
          </div>

          <Separator />

          <div className="grid gap-3 md:grid-cols-4 text-sm">
            <div>
              <div className="text-muted-foreground">Nama</div>
              <div className="font-medium truncate" title={p.name}>
                {p.name}
              </div>
            </div>

            <div>
              <div className="text-muted-foreground">Email</div>
              <div className="truncate" title={p.email}>
                {p.email}
              </div>
            </div>

            <div>
              <div className="text-muted-foreground">Status Verifikasi</div>
              <div>
                <VerifiedBadge verifiedAt={p.email_verified_at} />
              </div>
            </div>

            <div>
              <div className="text-muted-foreground">Profile Completed</div>
              <div>
                {p.profile_completed_at ? (
                  <Badge variant="success">Ya</Badge>
                ) : (
                  <Badge variant="muted">Belum</Badge>
                )}
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
