// app/dashboard/peserta/my-schedules/[id]/page.tsx
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CreditCard, Download, Info, Play } from "lucide-react";

import { schedulesService } from "@/lib/services/schedules.service";
import type {
  ParticipantAssignedQuestionPackage,
  ParticipantMyScheduleDetail,
} from "@/lib/types/participant-my-schedules";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { examService } from "@/lib/services/exam.service";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api/errors";
import { formatRupiah, hhmm } from "@/lib/utils/format";
import { formatDateId } from "@/lib/utils/datetime";
import { openWithBearer } from "@/lib/utils/download";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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

function safeNumber(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function packageSections(pack?: ParticipantAssignedQuestionPackage | null) {
  if (!pack?.sections?.length) return [];

  return pack.sections.map((section) => ({
    name: section.name,
    questions: safeNumber(
      section.question_count || section.target_question_count,
    ),
    minutes: safeNumber(section.duration_minutes),
  }));
}

function TestCompositionInfo({
  pack,
}: {
  pack?: ParticipantAssignedQuestionPackage | null;
}) {
  const sections = packageSections(pack);
  const [open, setOpen] = React.useState(false);

  const openPopover = () => setOpen(true);
  const closePopover = () => setOpen(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-blue-700 transition hover:bg-blue-100"
          aria-label="Lihat rincian sesi"
          onMouseEnter={openPopover}
          onMouseLeave={closePopover}
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-64 p-3"
        onMouseEnter={openPopover}
        onMouseLeave={closePopover}
      >
        <div className="space-y-2">
          <div className="text-sm font-semibold text-foreground">
            Rincian Sesi
          </div>
          {sections.length ? (
            <div className="space-y-1.5 text-sm text-muted-foreground">
              {sections.map((section) => (
                <div
                  key={`${section.name}-${section.questions}-${section.minutes}`}
                  className="flex items-start justify-between gap-3"
                >
                  <span className="font-medium text-foreground">
                    {section.name}
                  </span>
                  <span className="text-right">
                    {section.questions} soal / {section.minutes} menit
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Rincian sesi belum tersedia.
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function TestComposition({
  pack,
}: {
  pack?: ParticipantAssignedQuestionPackage | null;
}) {
  if (!pack) {
    return <span className="text-muted-foreground">-</span>;
  }

  return (
    <div className="inline-flex items-center justify-end gap-1.5">
      <span>
        {safeNumber(pack.total_questions)} soal /{" "}
        {safeNumber(pack.total_duration_minutes)} menit
      </span>
      <TestCompositionInfo pack={pack} />
    </div>
  );
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

  if (attemptStatus === "in_progress") {
    return "Sedang Berlangsung";
  }

  if (d.can_start) {
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

function isExpiredParticipantStatus(d?: ParticipantMyScheduleDetail | null) {
  const key = normalizeText(d?.participant_status_key ?? "");
  const paymentStatus = normalizeText(d?.payment_status ?? "");
  const registrationStatus = normalizeText(d?.registration?.status ?? "");
  const label = normalizeText(d?.participant_status_label ?? "");

  return (
    key === "payment_expired" ||
    paymentStatus === "expire" ||
    paymentStatus === "expired" ||
    registrationStatus === "expired" ||
    label.includes("kedaluwarsa")
  );
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

function scoreCell(v?: number | null) {
  if (v === null || v === undefined) return "-";
  return String(v);
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
    refetchOnMount: "always",
  });

  const d = query.data;
  const testStatus = testStatusLabel(d);
  const showParticipantStatus = !isExpiredParticipantStatus(d);
  const canContinuePayment =
    (normalizeText(d?.payment_status ?? "") === "pending" ||
      normalizeText(d?.payment_status ?? "") === "pending_payment") &&
    normalizeText(testStatus) === "belum dimulai";
  const isFinished = normalizeText(testStatus) === "selesai";
  const hasResult = Boolean(d?.scores);
  const hasCertificate = Boolean(d?.certificate?.download_url);

  const startMutation = useMutation({
    mutationFn: () => examService.start(id as string),
    onSuccess: (attempt) => {
      setStartConfirmOpen(false);
      router.push(`/exams/${attempt.id}`);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const downloadCertificateMutation = useMutation({
    mutationFn: (url: string) => openWithBearer(url),
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const canStart = Boolean(d?.can_start) || Boolean(d?.attempt_id);

  return (
    <PageHeaderLayout
      title={`Detail Jadwal`}
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
                    variant={statusVariant(testStatus)}
                    className="truncate max-w-56"
                  >
                    {testStatus}
                  </Badge>

                  {showParticipantStatus ? (
                    <Badge
                      variant={participantStatusBadgeVariant(d)}
                      className="truncate max-w-48"
                      title={
                        d.participant_status_label ??
                        d.payment_status ??
                        undefined
                      }
                    >
                      {participantStatusLabel(d)}
                    </Badge>
                  ) : null}
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
              {/* <DetailRow label="Order ID" value={d.order_id ?? "-"} /> */}
              {/* <DetailRow label="Payment Type" value={d.payment_type ?? "-"} /> */}
              {/* <DetailRow label="Paid At" value={d.paid_at ?? "-"} /> */}
              <DetailRow
                label="Jumlah Soal"
                value={<TestComposition pack={d.question_package} />}
              />

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
                {!isFinished ? (
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
                    {startMutation.isPending
                      ? "Menyiapkan Tes..."
                      : "Mulai Tes"}
                  </Button>
                ) : null}
                {!isFinished && !canStart ? (
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
                {isFinished ? (
                  <div className="text-sm font-medium text-foreground">
                    Selesai
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {hasResult || hasCertificate ? (
            <Card className="rounded-xl lg:col-span-3">
              <CardHeader className="border-b">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-sm">
                      Hasil Ujian & Sertifikat
                    </CardTitle>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Nilai akhir dan akses unduh sertifikat untuk jadwal ini.
                    </div>
                  </div>

                  {d.certificate?.certificate_no ? (
                    <Badge variant="success" className="max-w-72 truncate">
                      {d.certificate.certificate_no}
                    </Badge>
                  ) : null}
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-4">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                  <Card className="rounded-xl border shadow-none">
                    <CardContent className="p-4">
                      <div className="text-xs text-muted-foreground">
                        Verbal
                      </div>
                      <div className="mt-1 text-lg font-semibold">
                        {scoreCell(d.scores?.verbal)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="rounded-xl border shadow-none">
                    <CardContent className="p-4">
                      <div className="text-xs text-muted-foreground">
                        Kuantitatif
                      </div>
                      <div className="mt-1 text-lg font-semibold">
                        {scoreCell(d.scores?.kuantitatif)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="rounded-xl border shadow-none">
                    <CardContent className="p-4">
                      <div className="text-xs text-muted-foreground">
                        Logika
                      </div>
                      <div className="mt-1 text-lg font-semibold">
                        {scoreCell(d.scores?.logika)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="rounded-xl border shadow-none">
                    <CardContent className="p-4">
                      <div className="text-xs text-muted-foreground">
                        Spasial
                      </div>
                      <div className="mt-1 text-lg font-semibold">
                        {scoreCell(d.scores?.spasial)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="rounded-xl border border-blue-200 bg-blue-50 shadow-none">
                    <CardContent className="p-4">
                      <div className="text-xs text-blue-700">Total</div>
                      <div className="mt-1 text-xl font-semibold text-blue-900">
                        {scoreCell(d.scores?.total)}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* <div className="grid gap-3 md:grid-cols-2">
                  <DetailRow
                    label="Nama Partner"
                    value={d.partner?.name ?? (d.is_partner ? "Partner" : "-")}
                  />
                  <DetailRow
                    label="Nomor Sertifikat"
                    value={d.certificate?.certificate_no ?? "-"}
                  />
                </div> */}

                <div className="flex w-full items-center justify-center">
                  <Button
                    type="button"
                    onClick={() =>
                      d.certificate?.download_url
                        ? downloadCertificateMutation.mutate(
                            d.certificate.download_url,
                          )
                        : null
                    }
                    disabled={
                      !d.certificate?.download_url ||
                      downloadCertificateMutation.isPending
                    }
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    {downloadCertificateMutation.isPending
                      ? "Membuka Sertifikat..."
                      : "Unduh Sertifikat"}
                  </Button>

                  {/* {d.certificate?.verify_url ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2"
                      onClick={() =>
                        window.open(
                          d.certificate?.verify_url,
                          "_blank",
                          "noopener,noreferrer",
                        )
                      }
                    >
                      <ShieldCheck className="h-4 w-4" />
                      Verifikasi Sertifikat
                    </Button>
                  ) : null} */}
                </div>
              </CardContent>
            </Card>
          ) : null}

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
                  Pastikan Anda sudah siap sebelum memulai. Sistem akan masuk
                  fullscreen dan mode pengawasan ketat akan aktif selama ujian.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 rounded-xl border bg-muted/30 p-4">
                <DetailRow
                  label="Jadwal"
                  value={`${formatDateId(d.date)} • ${hhmm(d.start_time)} WIB`}
                />
                <DetailRow
                  label="Jumlah Soal"
                  value={<TestComposition pack={d.question_package} />}
                />
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                Jangan pindah tab, pindah window, minimize browser, membuka
                aplikasi lain, atau keluar fullscreen. Pelanggaran pertama akan
                langsung mengakhiri ujian.
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
