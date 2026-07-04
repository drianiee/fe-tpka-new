// app/dashboard/peserta/my-schedules/page.tsx
"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Filter } from "lucide-react";

import { schedulesService } from "@/lib/services/schedules.service";
import type {
  ParticipantMyScheduleListItem,
  ParticipantMySchedulesResponse,
  ParticipantMySchedulesStatusFilter,
} from "@/lib/types/participant-my-schedules";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { getApiErrorMessage } from "@/lib/api/errors";
import { hhmm } from "@/lib/utils/format";
import { formatDateId } from "@/lib/utils/datetime";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { PageHeaderLayout } from "@/components/layouts/PageHeaderLayout";

type StatusOption = {
  label: string;
  value: ParticipantMySchedulesStatusFilter;
};

const STATUS_OPTIONS: StatusOption[] = [
  { label: "Semua", value: "all" },
  { label: "Belum Dimulai", value: "belum-dimulai" },
  { label: "Sedang Berlangsung", value: "sedang-berlangsung" },
  { label: "Telah Selesai", value: "telah-selesai" },
];

function normalizeText(s: string) {
  return s.trim().toLowerCase();
}

function paymentStatusLabel(ps?: string | null) {
  const s = normalizeText(ps ?? "");
  if (!s) return "-";
  if (s === "pending") return "Menunggu Pembayaran";
  if (
    s === "capture" ||
    s === "settlement" ||
    s === "paid" ||
    s === "partner" ||
    s === "approved"
  )
    return "Terdaftar";
  if (s === "expire") return "Kedaluwarsa";
  if (s === "expired") return "Kedaluwarsa";
  if (s === "cancel") return "Dibatalkan";
  if (s === "cancelled") return "Dibatalkan";
  if (s === "deny") return "Ditolak";
  if (s === "failure") return "Gagal";
  if (s === "pending_payment") return "Menunggu Pembayaran";
  return ps ?? "-";
}

function participantStatusLabel(row: ParticipantMyScheduleListItem) {
  if (row.participant_status_label) return row.participant_status_label;
  return paymentStatusLabel(row.payment_status);
}

function participantStatusBadgeVariant(
  row: ParticipantMyScheduleListItem,
): "muted" | "warning" | "success" {
  const key = normalizeText(row.participant_status_key ?? "");
  if (
    key === "confirmed_email" ||
    key === "payment_completed" ||
    normalizeText(row.payment_status ?? "") === "paid"
  ) {
    return "success";
  }

  if (
    key === "unconfirmed_email" ||
    key === "payment_pending" ||
    normalizeText(row.payment_status ?? "") === "pending" ||
    normalizeText(row.payment_status ?? "") === "pending_payment"
  ) {
    return "warning";
  }

  return paymentBadgeVariant(row.payment_status);
}

function paymentBadgeVariant(
  ps?: string | null,
): "muted" | "warning" | "success" {
  const s = normalizeText(ps ?? "");
  if (!s) return "muted";
  if (s === "pending" || s === "pending_payment") return "warning";
  if (
    s === "capture" ||
    s === "settlement" ||
    s === "paid" ||
    s === "partner" ||
    s === "approved"
  )
    return "success";
  if (
    s === "expire" ||
    s === "expired" ||
    s === "cancel" ||
    s === "cancelled" ||
    s === "deny" ||
    s === "failure"
  )
    return "muted";
  return "muted";
}

function statusVariant(
  status?: string | null,
): "muted" | "warning" | "success" {
  const s = normalizeText(status ?? "");
  if (!s) return "muted";
  if (s === "belum dimulai") return "muted";
  if (s === "sedang berlangsung") return "warning";
  if (s === "selesai") return "success";
  return "muted";
}

function scheduleDateTime(date: string, time: string) {
  return new Date(`${date.slice(0, 10)}T${time}`);
}

function testStatusLabel(row: ParticipantMyScheduleListItem) {
  const now = new Date();
  const startAt = scheduleDateTime(row.date, row.start_time);
  const endAt = scheduleDateTime(row.date, row.end_time);
  const attemptStatus = normalizeText(row.attempt_status ?? "");

  if (attemptStatus === "in_progress") {
    return "Sedang Berlangsung";
  }

  if (row.can_start) {
    return "Sedang Berlangsung";
  }

  if (attemptStatus === "submitted" || attemptStatus === "expired") {
    return "Selesai";
  }

  if (now < startAt) {
    return "Belum Dimulai";
  }

  if (now >= endAt) {
    return "Selesai";
  }

  return "Sedang Berlangsung";
}

function canContinuePayment(row: ParticipantMyScheduleListItem) {
  const s = normalizeText(row.payment_status ?? "");
  return (
    (s === "pending" || s === "pending_payment") &&
    Boolean(row.payment?.snap_redirect_url)
  );
}

export default function ParticipantMySchedulesPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
          Memuat halaman...
        </div>
      }
    >
      <ParticipantMySchedulesPageContent />
    </React.Suspense>
  );
}

function ParticipantMySchedulesPageContent() {
  const router = useRouter();
  const sp = useSearchParams();

  const initialStatus =
    (sp.get("status") as ParticipantMySchedulesStatusFilter) || "all";
  const [status, setStatus] =
    React.useState<ParticipantMySchedulesStatusFilter>(initialStatus);
  const [qText, setQText] = React.useState("");
  const [detailWarningOpen, setDetailWarningOpen] = React.useState(false);
  const [blockedSchedule, setBlockedSchedule] =
    React.useState<ParticipantMyScheduleListItem | null>(null);

  React.useEffect(() => {
    const s = (sp.get("status") as ParticipantMySchedulesStatusFilter) || "all";
    setStatus(s);
  }, [sp]);

  const params = React.useMemo(() => ({ status }), [status]);

  const query = useQuery<ParticipantMySchedulesResponse>({
    queryKey: [API_ENDPOINTS.PARTICIPANT.MY_SCHEDULES, params],
    queryFn: () => schedulesService.participantMySchedules(params),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

  const busy = query.isFetching;

  const rows = React.useMemo(() => {
    const src = query.data?.data ?? [];
    const q = normalizeText(qText);

    if (!q) return src;

    return src.filter((r) => {
      const text = [
        r.title ?? "",
        formatDateId(r.date),
        hhmm(r.start_time),
        hhmm(r.end_time),
        `${hhmm(r.start_time)} - ${hhmm(r.end_time)} WIB`,
        testStatusLabel(r),
        participantStatusLabel(r),
        r.payment_status ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return text.includes(q);
    });
  }, [query.data, qText]);

  const isMobileDevice = React.useCallback(() => {
    return (
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 767px)").matches
    );
  }, []);

  const handleDetailClick = React.useCallback(
    (row: ParticipantMyScheduleListItem) => {
      const statusNormalized = normalizeText(testStatusLabel(row));
      if (isMobileDevice() && statusNormalized === "belum dimulai") {
        setBlockedSchedule(row);
        setDetailWarningOpen(true);
        return;
      }

      router.push(`/dashboard/peserta/my-schedules/${row.id}`);
    },
    [isMobileDevice, router],
  );

  const statusLabelText =
    STATUS_OPTIONS.find((o) => o.value === status)?.label ?? "Semua";

  const blockedScheduleLabel = React.useMemo(() => {
    if (!blockedSchedule) return "";
    return `${formatDateId(blockedSchedule.date)} ${hhmm(
      blockedSchedule.start_time,
    )} - ${hhmm(blockedSchedule.end_time)} WIB`;
  }, [blockedSchedule]);

  const columns = React.useMemo<
    DataTableColumn<ParticipantMyScheduleListItem>[]
  >(() => {
    return [
      {
        key: "no",
        header: "No",
        headerClassName: "w-16 text-center",
        className: "py-4 px-2 text-center",
        cell: (_row, idx) => idx + 1,
      },
      {
        key: "date",
        header: "Tanggal",
        headerClassName: "w-48",
        className: "py-4 px-2",
        cell: (row) => formatDateId(row.date),
      },
      {
        key: "time",
        header: "Jam",
        headerClassName: "w-48 text-center",
        className: "py-4 px-2 text-center",
        cell: (row) => `${hhmm(row.start_time)} - ${hhmm(row.end_time)} WIB`,
      },
      {
        key: "test_status",
        header: "Status Tes",
        headerClassName: "w-60 text-center",
        className: "py-4 px-2 text-center",
        cell: (row) => (
          <div className="flex justify-center">
            <Badge
              variant={statusVariant(testStatusLabel(row))}
              className="truncate max-w-56"
            >
              {testStatusLabel(row)}
            </Badge>
          </div>
        ),
      },
      {
        key: "payment",
        header: "Status Pendaftaran",
        headerClassName: "w-56 text-center",
        className: "py-4 px-2 text-center",
        cell: (row) => (
          <div className="flex justify-center">
            <Badge
              variant={participantStatusBadgeVariant(row)}
              className="truncate max-w-52"
            >
              {participantStatusLabel(row)}
            </Badge>
          </div>
        ),
      },
      {
        key: "action",
        header: "Aksi",
        headerClassName: "w-28 text-center",
        className: "py-4 px-2 text-center",
        cell: (row) => (
          <div className="flex justify-center gap-2">
            {canContinuePayment(row) ? (
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.href = row.payment?.snap_redirect_url ?? "";
                }}
                aria-label="Lanjutkan pembayaran"
              >
                Bayar
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                handleDetailClick(row);
              }}
              aria-label="Lihat detail jadwal"
            >
              Detail
            </Button>
          </div>
        ),
      },
    ];
  }, [handleDetailClick]);

  return (
    <PageHeaderLayout
      title="Jadwal Tes Saya"
      description="Daftar jadwal yang sudah Anda miliki"
      showBack={false}
    >
      <div className="h-full min-h-0 rounded-xl border overflow-hidden flex flex-col bg-white">
        <div className="p-4 space-y-2">
          <div className="flex flex-col sm:flex-row gap-3 lg:items-center">
            <div className="flex-1">
              {/* <Input
                value={qText}
                onChange={(e) => setQText(e.target.value)}
                placeholder="Cari… (tanggal/jam/status)"
                disabled={busy}
                className="w-full"
              /> */}
              <div className="text-xs text-muted-foreground">
                Menampilkan{" "}
                <span className="font-medium text-foreground">
                  {rows.length}
                </span>{" "}
                jadwal
              </div>
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

                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuLabel>Filter Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <DropdownMenuRadioGroup
                    value={String(status)}
                    onValueChange={(v) => {
                      const next =
                        (v as ParticipantMySchedulesStatusFilter) || "all";
                      setStatus(next);

                      const nextUrl = new URL(window.location.href);
                      nextUrl.searchParams.set("status", String(next));
                      window.history.replaceState({}, "", nextUrl.toString());
                    }}
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <DropdownMenuRadioItem
                        key={o.value}
                        value={String(o.value)}
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
                onClick={() => {
                  setQText("");
                  setStatus("all");
                  router.replace("/dashboard/peserta/my-schedules?status=all");
                }}
              >
                Reset
              </Button>
            </div>
          </div>

          {query.isError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {getApiErrorMessage(query.error)}
            </div>
          ) : null}

          {/* <div className="text-xs text-muted-foreground">
            Menampilkan{" "}
            <span className="font-medium text-foreground">{rows.length}</span>{" "}
            jadwal
          </div> */}
        </div>

        <div className="flex-1 min-h-0 overflow-auto border-t">
          <DataTable
            columns={columns}
            rows={rows}
            getRowKey={(r) => r.id}
            loading={query.isLoading}
            emptyText="Belum ada jadwal"
            stickyHeader
            onRowClick={(row) => handleDetailClick(row)}
            getRowClassName={() => "cursor-pointer hover:bg-muted/50"}
          />
        </div>
      </div>

      <Dialog
        open={detailWarningOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDetailWarningOpen(false);
            setBlockedSchedule(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Perangkat tidak didukung</DialogTitle>
            <DialogDescription>
              {blockedScheduleLabel
                ? `Jadwal ${blockedScheduleLabel} belum bisa dibuka dari perangkat HP. Silakan lanjutkan dari laptop.`
                : "Ujian belum bisa dibuka dari perangkat HP. Silakan lanjutkan dari laptop."}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDetailWarningOpen(false);
                setBlockedSchedule(null);
              }}
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageHeaderLayout>
  );
}
