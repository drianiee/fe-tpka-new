"use client";

import * as React from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardAction, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import type { LandingScheduleItem } from "@/lib/types/landing";
import { schedulesService } from "@/lib/services/schedules.service";
import { getToken } from "@/lib/utils/storage";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { RegisterScheduleResponse } from "@/lib/types/schedules";

function parseJakartaDate(dateTime: string) {
  return new Date(dateTime.replace(" ", "T"));
}

function dateFormat(dateTime: string) {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(parseJakartaDate(dateTime));
}

function hhmm(time: string) {
  if (!time) return "-";
  return time.length >= 5 ? time.slice(0, 5) : time;
}

function toRupiahFromPriceString(price: string) {
  const n = Number(String(price).replace(/[^\d]/g, ""));
  const safe = Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(safe);
}

type BadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "muted"
  | "warning"
  | "success"
  | "time";

function getStatusBadge(item: LandingScheduleItem): { label: string; variant: BadgeVariant } {
  const full = item.current_participants >= item.capacity;

  if (full) return { label: "Kuota Penuh", variant: "destructive" };

  if (item.status?.toLowerCase() === "tes belum dimulai") {
    return { label: item.status, variant: "muted" };
  }

  return { label: item.status || "Tersedia", variant: "success" };
}

export const JadwalCard = ({ item }: { item: LandingScheduleItem }) => {
  const router = useRouter();

  const full = item.current_participants >= item.capacity;
  const badge = getStatusBadge(item);

  const price = toRupiahFromPriceString(item.price);
  const jamLabel = `${hhmm(item.start_time)} WIB`;

  const isLoggedIn = Boolean(getToken());
  const primaryLabel = isLoggedIn ? "Lanjut ke Pembayaran" : "Daftar Akun";

  const registerMutation = useMutation<RegisterScheduleResponse, unknown, number>({
    mutationFn: (scheduleId: number) => schedulesService.registerParticipant(scheduleId),
    onSuccess: (res) => {
      const url = res?.data?.redirect_url;
      if (url) window.location.href = url;
    },
  });

  const onPrimaryAction = () => {
    if (!isLoggedIn) {
      router.push("/register");
      return;
    }

    registerMutation.mutate(item.id);
  };

  return (
    <Card className="w-full border border-slate-200">
      <CardHeader className="flex flex-col space-y-2">
        <div className="flex items-center w-full justify-between">
          <div className="flex items-center gap-2">
            <p className="text-base">{dateFormat(item.date)}</p>
            <Badge variant="time">{jamLabel}</Badge>
          </div>
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </div>

        <div className="flex items-center w-full justify-between">
          <p className="font-semibold text-xl">{price}</p>

          <CardAction>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={full}>
                  Daftar Sekarang
                </Button>
              </AlertDialogTrigger>

              <AlertDialogContent className="sm:max-w-lg">
                <AlertDialogHeader>
                  <AlertDialogTitle>Konfirmasi Pendaftaran Jadwal Tes</AlertDialogTitle>
                  <p className="text-sm text-muted-foreground">
                    Setelah Anda menekan{" "}
                    <span className="font-medium text-foreground">{primaryLabel}</span>, Anda akan{" "}
                    {isLoggedIn
                      ? "diarahkan ke halaman pembayaran untuk menyelesaikan pendaftaran."
                      : "diarahkan ke halaman pendaftaran akun terlebih dahulu."}
                  </p>
                </AlertDialogHeader>

                <div className="space-y-4">
                  {!isLoggedIn ? (
                    <Alert variant="default">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Perlu akun</AlertTitle>
                      <AlertDescription>
                        Anda belum login. Untuk mendaftar jadwal tes, Anda perlu membuat akun terlebih dahulu.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert variant="default">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Catatan</AlertTitle>
                      <AlertDescription>
                        Pastikan jadwal yang dipilih sudah sesuai (tanggal, jam, dan kapasitas). Pendaftaran diproses
                        setelah pembayaran berhasil.
                      </AlertDescription>
                    </Alert>
                  )}

                  {registerMutation.isError ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      {getApiErrorMessage(registerMutation.error)}
                    </div>
                  ) : null}

                  <div className="rounded-xl border bg-muted/20 p-4">
                    <div className="grid gap-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Tanggal & Waktu</p>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium text-foreground">{dateFormat(item.date)}</p>
                            <Badge variant="time">{jamLabel}</Badge>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Biaya</p>
                          <p className="text-lg font-semibold text-foreground">{price}</p>
                        </div>
                      </div>

                      <div className="h-px w-full bg-border" />

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Status</p>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={badge.variant}>{badge.label}</Badge>
                            <span className="text-sm text-muted-foreground">
                              Kuota:{" "}
                              <span className="font-medium text-foreground">{item.current_participants}</span>/
                              {item.capacity}
                            </span>
                          </div>
                        </div>

                        {full ? (
                          <Badge variant="destructive">Kuota penuh</Badge>
                        ) : (
                          <Badge variant="success">Kuota tersedia</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <AlertDialogFooter>
                  <AlertDialogCancel disabled={registerMutation.isPending}>Batal</AlertDialogCancel>

                  <AlertDialogAction asChild>
                    <Button onClick={onPrimaryAction} disabled={full || (isLoggedIn && registerMutation.isPending)}>
                      {isLoggedIn && registerMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Memproses...
                        </>
                      ) : (
                        primaryLabel
                      )}
                    </Button>
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardAction>
        </div>
      </CardHeader>
    </Card>
  );
};
