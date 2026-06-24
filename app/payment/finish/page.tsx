// app/payment/finish/page.tsx
"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PaymentFinishPage() {
  return (
    <React.Suspense
      fallback={
        <div className="h-full min-h-screen grid place-items-center bg-background">
          <div className="rounded-xl border bg-white p-6 text-sm text-muted-foreground">
            Memuat halaman...
          </div>
        </div>
      }
    >
      <PaymentFinishPageContent />
    </React.Suspense>
  );
}

function PaymentFinishPageContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const orderId = sp.get("order_id") ?? "-";
  const statusCode = sp.get("status_code") ?? "-";
  const transactionStatus = sp.get("transaction_status") ?? "-";

  return (
    <div className="h-full min-h-screen grid place-items-center bg-background px-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Pembayaran Diproses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Status pembayaran akan diperbarui otomatis setelah Midtrans mengirim callback ke server.
            Jika pembayaran sudah berhasil tetapi jadwal belum terbuka, tunggu beberapa saat lalu refresh halaman Jadwal Tes Saya.
          </p>

          <div className="rounded-xl border bg-muted/20 p-4 text-sm space-y-2">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Order ID</span>
              <span className="font-medium text-right">{orderId}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Status Code</span>
              <span className="font-medium text-right">{statusCode}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Transaction Status</span>
              <span className="font-medium text-right">{transactionStatus}</span>
            </div>
          </div>

          <Button
            className="w-full"
            onClick={() => router.push("/dashboard/peserta/my-schedules?status=all")}
          >
            Buka Jadwal Tes Saya
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
