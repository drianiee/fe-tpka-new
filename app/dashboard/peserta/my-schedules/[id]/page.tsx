// app/dashboard/peserta/my-schedules/[id]/page.tsx
"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";

import { schedulesService } from "@/lib/services/schedules.service";
import type { ParticipantMyScheduleDetail } from "@/lib/types/participant-my-schedules";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { getApiErrorMessage } from "@/lib/api/errors";
import { formatRupiah, hhmm } from "@/lib/utils/format";
import { formatDateId } from "@/lib/utils/datetime";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeaderLayout } from "@/components/layouts/PageHeaderLayout";

function normalizeText(s: string) {
  return s.trim().toLowerCase();
}

function statusVariant(
  status?: string | null
): "muted" | "warning" | "success" {
  const s = normalizeText(status ?? "");
  if (!s) return "muted";
  if (s === "tes belum dimulai") return "muted";
  if (s === "tes akan segera dimulai") return "warning";
  if (s === "tes sedang berlangsung") return "warning";
  if (s === "tes selesai") return "success";
  return "muted";
}

function paymentStatusLabel(ps?: string | null) {
  const s = normalizeText(ps ?? "");
  if (!s) return "-";
  if (s === "pending") return "Menunggu Pembayaran";
  if (s === "capture" || s === "settlement" || s === "paid" || s === "partner")
    return "Terdaftar";
  return ps ?? "-";
}

function paymentBadgeVariant(
  ps?: string | null
): "muted" | "warning" | "success" {
  const s = normalizeText(ps ?? "");
  if (!s) return "muted";
  if (s === "pending") return "warning";
  if (s === "capture" || s === "settlement" || s === "paid" || s === "partner")
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

  const query = useQuery<ParticipantMyScheduleDetail>({
    queryKey: [API_ENDPOINTS.PARTICIPANT.MY_SCHEDULE_DETAIL(id ?? "none")],
    queryFn: () => schedulesService.participantMyScheduleDetail(id as string),
    enabled: Boolean(id),
    staleTime: 30_000,
  });

  const d = query.data;

  const canStart = Boolean(d?.can_start) && Boolean(d?.quiz_url);

  return (
    <PageHeaderLayout
      title={`Detail Jadwal #${id ?? "-"}`}
      description="Informasi jadwal dan akses tes (jika sudah tersedia)."
      showBack
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
                    variant={statusVariant(d.status)}
                    className="truncate max-w-56"
                  >
                    {d.status || "-"}
                  </Badge>

                  <Badge
                    variant={paymentBadgeVariant(d.payment_status)}
                    className="truncate max-w-44"
                    title={d.payment_status ?? undefined}
                  >
                    {paymentStatusLabel(d.payment_status)}
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

              <div className="pt-3 items-center flex flex-col space-y-2 justify-center">
                <Button
                  disabled={!canStart}
                  onClick={() => {
                    if (!d.quiz_url) return;
                    window.open(d.quiz_url, "_blank", "noopener,noreferrer");
                  }}
                  className="gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Mulai Tes
                </Button>
              {!canStart ? (
                <div className="text-xs text-muted-foreground">
                  Tombol{" "}
                  <span className="font-medium text-foreground">Mulai Tes</span>{" "}
                  akan aktif saat sudah masuk waktu tes{" "}
                  <span className="font-medium text-foreground">{formatDateId(d.date)}</span>
                  {" "}Pukul{" "}
                  <span className="font-medium text-foreground">{hhmm(d.start_time)}</span>
                </div>
              ) : null}
              </div>

            </CardContent>
          </Card>
        </div>
      )}
    </PageHeaderLayout>
  );
}
