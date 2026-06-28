// app/dashboard/peserta/my-schedules/[id]/page.tsx
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CreditCard, Play } from "lucide-react";

import { schedulesService } from "@/lib/services/schedules.service";
import type { ParticipantMyScheduleDetail } from "@/lib/types/participant-my-schedules";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { examService } from "@/lib/services/exam.service";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api/errors";
import { formatRupiah, hhmm } from "@/lib/utils/format";
import { formatDateId } from "@/lib/utils/datetime";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeaderLayout } from "@/components/layouts/PageHeaderLayout";

function normalizeText(s: string) {
  return s.trim().toLowerCase();
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

function testStatusLabel(d?: ParticipantMyScheduleDetail | null) {
  if (!d) return "-";

  const now = new Date();
  const startAt = scheduleDateTime(d.date, d.start_time);
  const endAt = scheduleDateTime(d.date, d.end_time);
  const attemptStatus = normalizeText(d.attempt_status ?? "");

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
  if (s === "pending_payment") return "Menunggu Pembayaran";
  if (s === "expire" || s === "expired") return "Kedaluwarsa";
  if (s === "cancel" || s === "cancelled") return "Dibatalkan";
  if (s === "deny") return "Ditolak";
  if (s === "failure") return "Gagal";
  return ps ?? "-";
}

function participantStatusLabel(d?: ParticipantMyScheduleDetail | null) {
  if (!d) return "-";
  if (d.participant_status_label) return d.participant_status_label;
  return paymentStatusLabel(d.payment_status);
}

function participantStatusBadgeVariant(
  d?: ParticipantMyScheduleDetail | null,
): "muted" | "warning" | "success" {
  const key = normalizeText(d?.participant_status_key ?? "");
  if (
    key === "confirmed_email" ||
    key === "payment_completed" ||
    normalizeText(d?.payment_status ?? "") === "paid"
  ) {
    return "success";
  }

  if (
    key === "unconfirmed_email" ||
    key === "payment_pending" ||
    normalizeText(d?.payment_status ?? "") === "pending" ||
    normalizeText(d?.payment_status ?? "") === "pending_payment"
  ) {
    return "warning";
  }

  return paymentBadgeVariant(d?.payment_status);
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
  return "muted";
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium text-foreground text-right">
        {value}
      </div>
    </div>
  );
}

export default function ParticipantMyScheduleDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const [startConfirmOpen, setStartConfirmOpen] = React.useState(false);

  const query = useQuery<ParticipantMyScheduleDetail>({
    queryKey: [API_ENDPOINTS.PARTICIPANT.MY_SCHEDULE_DETAIL(id ?? "none")],
    queryFn: () => schedulesService.participantMyScheduleDetail(id as string),
    enabled: Boolean(id),
    staleTime: 30_000,
  });

  const d = query.data;
  const canContinuePayment =
    normalizeText(d?.payment_status ?? "") === "pending" ||
    normalizeText(d?.payment_status ?? "") === "pending_payment";

  const startMutation = useMutation({
    mutationFn: () => examService.start(id as string),
    onSuccess: (attempt) => {
      setStartConfirmOpen(false);
      router.push(`/exams/${attempt.id}`);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const canStart = Boolean(d?.can_start) || Boolean(d?.attempt_id);

  return (
    <PageHeaderLayout
      title={`Detail Jadwal #${id ?? "-"}`}
      description="Informasi jadwal dan akses tes"
      showBack
      onBack={() => router.push("/dashboard/peserta/my-schedules/")}
    >
      {query.isLoading ? (
        <div className="rounded-xl border bg-white p-4 text-sm text-muted-foreground">
          Memuat detail...
        </div>
      ) : query.isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {getApiErrorMessage(query.error)}
        </div>
      ) : !d ? (
        <div className="rounded-xl border bg-white p-4 text-sm text-muted-foreground">
          Detail tidak ditemukan.
        </div>
      ) : (
        <div className="grid gap-3">
          <Card className="rounded-xl lg:col-span-3">
            <CardHeader className="border-b">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-sm">Informasi Jadwal</CardTitle>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {formatDateId(d.date)} • {hhmm(d.start_time)} -{" "}
                    {hhmm(d.end_time)} WIB
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant={statusVariant(testStatusLabel(d))}
                    className="truncate max-w-56"
                  >
                    {testStatusLabel(d)}
                  </Badge>

                  <Badge
                    variant={participantStatusBadgeVariant(d)}
                    className="truncate max-w-44"
                    title={d.participant_status_label ?? d.payment_status ?? undefined}
                  >
                    {participantStatusLabel(d)}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-3">
              <DetailRow
                label="Harga"
                value={formatRupiah(String(d.price ?? 0))}
              />
              <DetailRow
                label="Partner"
                value={d.partner?.name ?? (d.is_partner ? "Partner" : "-")}
              />
              <DetailRow label="Order ID" value={d.order_id ?? "-"} />
              <DetailRow label="Payment Type" value={d.payment_type ?? "-"} />
              <DetailRow label="Paid At" value={d.paid_at ?? "-"} />
              <DetailRow label="Paket Soal" value={d.question_package?.name ?? "-"} />
              <DetailRow label="Jumlah Soal" value={d.question_package?.total_questions ?? 0} />
              <DetailRow label="Durasi" value={`${d.question_package?.total_duration_minutes ?? 0} menit`} />

              <div className="pt-3 items-center flex flex-col space-y-2 justify-center">
                {canContinuePayment && d.payment?.snap_redirect_url ? (
                  <Button
                    onClick={() => {
                      window.location.href = d.payment?.snap_redirect_url ?? "";
                    }}
                    className="gap-2"
                  >
                    <CreditCard className="h-4 w-4" />
                    Lanjutkan Pembayaran
                  </Button>
                ) : null}
                <Button
                  disabled={!canStart}
                  onClick={() =>
                    d.attempt_id
                      ? router.push(`/exams/${d.attempt_id}`)
                      : setStartConfirmOpen(true)
                  }
                  className="gap-2"
                >
                  <Play className="h-4 w-4" />
                  {startMutation.isPending ? "Menyiapkan Tes..." : "Mulai Tes"}
                </Button>
                {!canStart ? (
                  <div className="text-xs text-muted-foreground">
                    Tombol{" "}
                    <span className="font-medium text-foreground">
                      Mulai Tes
                    </span>{" "}
                    akan aktif saat sudah masuk waktu tes{" "}
                    <span className="font-medium text-foreground">
                      {formatDateId(d.date)}
                    </span>{" "}
                    Pukul{" "}
                    <span className="font-medium text-foreground">
                      {hhmm(d.start_time)}
                    </span>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Dialog
            open={startConfirmOpen}
            onOpenChange={(open) => {
              if (!startMutation.isPending) setStartConfirmOpen(open);
            }}
          >
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Tes akan dimulai</DialogTitle>
                <DialogDescription>
                  Pastikan Anda sudah siap sebelum memulai. Setelah tes
                  dimulai, waktu pengerjaan akan berjalan dari server.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 rounded-xl border bg-muted/30 p-4">
                <DetailRow
                  label="Paket Soal"
                  value={d.question_package?.name ?? "-"}
                />
                <DetailRow
                  label="Jadwal"
                  value={`${formatDateId(d.date)} • ${hhmm(d.start_time)} WIB`}
                />
                <DetailRow
                  label="Jumlah Soal"
                  value={d.question_package?.total_questions ?? 0}
                />
                <DetailRow
                  label="Durasi"
                  value={`${d.question_package?.total_duration_minutes ?? 0} menit`}
                />
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                Tes dikerjakan per sesi. Selesaikan sesi saat ini sebelum
                lanjut ke sesi berikutnya, dan jawaban tidak dapat diubah
                setelah ujian dikirim.
              </div>

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStartConfirmOpen(false)}
                  disabled={startMutation.isPending}
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  onClick={() => startMutation.mutate()}
                  disabled={startMutation.isPending}
                  className="gap-2"
                >
                  <Play className="h-4 w-4" />
                  {startMutation.isPending
                    ? "Menyiapkan Tes..."
                    : "Mulai Tes Sekarang"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </PageHeaderLayout>
  );
}
