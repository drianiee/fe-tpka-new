// app/dashboard/peserta/page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Filter, AlertCircle, Loader2 } from "lucide-react";

import { schedulesService } from "@/lib/services/schedules.service";
import type { ParticipantScheduleListItem } from "@/lib/types/participant";
import type { RegisterScheduleResponse } from "@/lib/types/schedules";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { getApiErrorMessage } from "@/lib/api/errors";
import { formatRupiah, hhmm } from "@/lib/utils/format";
import { formatDateId } from "@/lib/utils/datetime";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PageHeaderLayout } from "@/components/layouts/PageHeaderLayout";

type StatusOption = { label: string; value: string };

const STATUS_OPTIONS: StatusOption[] = [
  { label: "Semua Status", value: "" },
  { label: "Tes Belum Dimulai", value: "Tes Belum Dimulai" },
  { label: "Tes Akan Segera Dimulai", value: "Tes Akan Segera Dimulai" },
  { label: "Tes Sedang Berlangsung", value: "Tes Sedang Berlangsung" },
  { label: "Tes Telah Selesai", value: "Tes Telah Selesai" },
];

function normalizeText(s: string) {
  return s.trim().toLowerCase();
}

function isFull(row: ParticipantScheduleListItem) {
  return row.current_participants >= row.capacity;
}

function isRegistered(row: ParticipantScheduleListItem) {
  return normalizeText(row?.registration_status ?? "") === "terdaftar";
}

function isClosedByStatus(row: ParticipantScheduleListItem) {
  const s = normalizeText(row.status ?? "");
  return s === "tes sedang berlangsung" || s === "tes telah selesai";
}

function isLocked(row: ParticipantScheduleListItem) {
  return isFull(row) || isRegistered(row) || isClosedByStatus(row);
}

function rowStatusText(row: ParticipantScheduleListItem) {
  if (isFull(row)) return "Kuota penuh";
  if (isRegistered(row)) return "Anda telah terdaftar pada jadwal ini";
  if (isClosedByStatus(row)) return "Jadwal telah berlangsung, tidak dapat daftar";
  return row.status || "-";
}

function statusVariantForRow(row: ParticipantScheduleListItem): "muted" | "warning" | "success" {
  if (isFull(row)) return "muted";
  if (isRegistered(row)) return "success";
  if (isClosedByStatus(row)) return "muted";

  const s = normalizeText(row.status ?? "");
  if (!s) return "muted";
  if (s === "tes belum dimulai") return "muted";
  if (s === "tes akan segera dimulai") return "warning";
  if (s === "tes sedang berlangsung") return "warning";
  if (s === "tes telah selesai") return "success";
  return "muted";
}

function safeText(v: unknown) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function safeNumber(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function ConfirmDetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium text-foreground text-right">{value}</div>
    </div>
  );
}

export default function PesertaDashboardPage() {
  const router = useRouter();
  const [qText, setQText] = React.useState("");
  const [status, setStatus] = React.useState<string>("");

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<ParticipantScheduleListItem | null>(null);

  const query = useQuery({
    queryKey: [API_ENDPOINTS.PARTICIPANT.SCHEDULES, { limit: 10 }],
    queryFn: () => schedulesService.participantSchedules({ limit: 10 }),
    staleTime: 60_000,
  });

  const payMutation = useMutation<RegisterScheduleResponse, unknown, number>({
    mutationFn: (scheduleId) => schedulesService.registerParticipant(scheduleId),
    onSuccess: (res) => {
      const url =
        res?.midtrans?.redirect_url ??
        res?.payment?.snap_redirect_url ??
        res?.data?.redirect_url;

      if (url) {
        window.location.href = url;
        return;
      }

      setConfirmOpen(false);
      setSelected(null);
      void query.refetch();
      router.push("/dashboard/peserta/my-schedules?status=all");
    },
  });

  const busy = query.isFetching || payMutation.isPending;

  const rows = React.useMemo(() => {
    const src = query.data ?? [];
    const q = normalizeText(qText);

    return src.filter((r) => {
      const matchQ =
        !q ||
        String(r.id).includes(q) ||
        normalizeText(r.status).includes(q) ||
        normalizeText(formatDateId(r.date)).includes(q) ||
        normalizeText(hhmm(r.start_time)).includes(q);

      const matchStatus = !status || r.status === status;

      return matchQ && matchStatus;
    });
  }, [query.data, qText, status]);

  const statusLabelText =
    STATUS_OPTIONS.find((o) => o.value === status)?.label ?? "Semua Status";

  const openConfirm = React.useCallback(
    (row: ParticipantScheduleListItem) => {
      if (busy) return;
      if (isLocked(row)) return;

      setSelected(row);
      setConfirmOpen(true);
      if (payMutation.isError) payMutation.reset();
    },
    [busy, payMutation]
  );

  const onConfirmPay = React.useCallback(() => {
    if (!selected) return;
    payMutation.mutate(selected.id);
  }, [payMutation, selected]);

  const columns = React.useMemo<DataTableColumn<ParticipantScheduleListItem>[]>(() => {
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
        headerClassName: "w-44",
        className: "py-4 px-2",
        cell: (row) => formatDateId(row.date),
      },
      {
        key: "time",
        header: "Jam",
        headerClassName: "w-24 text-center",
        className: "py-4 px-2 text-center",
        cell: (row) => `${hhmm(row.start_time)} WIB`,
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
        headerClassName: "w-36 text-center",
        className: "py-4 px-2 text-center",
        cell: (row) => `${row.current_participants}/${row.capacity}`,
      },
      {
        key: "status",
        header: "Status",
        headerClassName: "w-[360px] text-center",
        className: "py-4 px-2 text-center",
        cell: (row) => (
          <div className="flex justify-center">
            <Badge variant={statusVariantForRow(row)} className="truncate max-w-85">
              {rowStatusText(row)}
            </Badge>
          </div>
        ),
      },
      {
        key: "action",
        header: "Aksi",
        headerClassName: "w-36 text-center",
        className: "py-4 px-2 text-center",
        cell: (row) => {
          const locked = isLocked(row);

          return (
            <div className="flex justify-center">
              <Button
                size="sm"
                variant="outline"
                disabled={busy || locked}
                onClick={(e) => {
                  e.stopPropagation();
                  openConfirm(row);
                }}
              >
                {isFull(row) ? "Penuh" : "Daftar"}
              </Button>
            </div>
          );
        },
      },
    ];
  }, [busy, openConfirm]);

  const selectedLocked = selected ? isLocked(selected) : false;

  const picked = payMutation.data?.data?.picked;
  const snapAmount = payMutation.data?.data?.amount;
  const snapOrderId = payMutation.data?.data?.order_id;

  return (
    <PageHeaderLayout
      title="Jadwal Tes Terbaru"
      description="Pilih jadwal tes yang tersedia dan lanjutkan ke pembayaran."
      showBack={false}
    >
      <div className="h-full min-h-0 rounded-xl border overflow-hidden flex flex-col bg-white">
        <div className="p-4 space-y-2">
          <div className="flex flex-col sm:flex-row gap-3 lg:items-center">
            <div className="flex-1">
              <Input
                value={qText}
                onChange={(e) => setQText(e.target.value)}
                placeholder="Cari jadwal… (id/tanggal/jam/status)"
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

                <DropdownMenuContent align="end" className="w-72">
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
                onClick={() => {
                  setQText("");
                  setStatus("");
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

          <div className="text-xs text-muted-foreground">
            Menampilkan <span className="font-medium text-foreground">{rows.length}</span> jadwal
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-auto border-t">
          <DataTable
            columns={columns}
            rows={rows}
            getRowKey={(r) => r.id}
            loading={query.isLoading}
            emptyText="Belum ada jadwal tersedia"
            stickyHeader
            onRowClick={(row) => {
              if (busy) return;
              if (isLocked(row)) return;
              openConfirm(row);
            }}
            getRowClassName={(row) =>
              [
                isLocked(row) ? "opacity-60" : "",
                isLocked(row) ? "cursor-not-allowed" : "cursor-pointer hover:bg-muted/50",
              ].join(" ")
            }
          />
        </div>
      </div>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(v) => {
          if (busy) return;
          setConfirmOpen(v);
          if (!v) {
            setSelected(null);
            if (payMutation.isError) payMutation.reset();
          }
        }}
      >
        <AlertDialogContent className="sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Pembayaran Jadwal Tes</AlertDialogTitle>
          </AlertDialogHeader>

          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Periksa detail</AlertTitle>
              <AlertDescription>
                Pastikan jadwal sudah sesuai. Setelah lanjut, Anda akan diarahkan ke Midtrans untuk pembayaran.
              </AlertDescription>
            </Alert>

            {payMutation.isError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {getApiErrorMessage(payMutation.error)}
              </div>
            ) : null}

            <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
              <ConfirmDetailRow label="Schedule ID" value={selected?.id ?? "-"} />
              <ConfirmDetailRow label="Tanggal" value={selected ? formatDateId(selected.date) : "-"} />
              <ConfirmDetailRow label="Jam" value={selected ? `${hhmm(selected.start_time)} WIB` : "-"} />
              <ConfirmDetailRow label="Harga" value={selected ? formatRupiah(selected.price) : "-"} />
              <ConfirmDetailRow
                label="Kapasitas"
                value={selected ? `${selected.current_participants}/${selected.capacity}` : "-"}
              />
              <ConfirmDetailRow
                label="Status"
                value={
                  <Badge variant={selected ? statusVariantForRow(selected) : "muted"}>
                    {selected ? rowStatusText(selected) : "-"}
                  </Badge>
                }
              />
            </div>

            {payMutation.isSuccess ? (
              <div className="rounded-xl border bg-white p-4 space-y-3">
                <div className="text-sm font-semibold">Ringkasan Snap</div>
                <div className="space-y-2">
                  <ConfirmDetailRow label="Order ID" value={snapOrderId ?? "-"} />
                  <ConfirmDetailRow label="Amount" value={formatRupiah(String(snapAmount ?? 0))} />
                  <ConfirmDetailRow
                    label="Paket"
                    value={
                      picked
                        ? `${safeText(picked.package_name)} (ID: ${safeNumber(picked.question_package_id)})`
                        : "-"
                    }
                  />
                </div>
              </div>
            ) : null}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Batal</AlertDialogCancel>

            <AlertDialogAction asChild>
              <Button onClick={onConfirmPay} disabled={!selected || selectedLocked || busy}>
                {payMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  "Lanjut ke Pembayaran"
                )}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageHeaderLayout>
  );
}
