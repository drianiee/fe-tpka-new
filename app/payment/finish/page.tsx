"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { paymentsService } from "@/lib/services/payments.service";

const TARGET_URL = "/dashboard/peserta/my-schedules?status=all";

export default function PaymentFinishPage() {
  return (
    <React.Suspense
      fallback={
        <div className="grid min-h-screen place-items-center bg-background px-4">
          <div className="rounded-xl border bg-white p-6 text-sm text-muted-foreground">
            Mengalihkan ke jadwal tes...
          </div>
        </div>
      }
    >
      <PaymentFinishRedirect />
    </React.Suspense>
  );
}

function PaymentFinishRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = React.useState("Memeriksa status pembayaran...");

  React.useEffect(() => {
    let active = true;

    async function syncAndRedirect() {
      const orderId = searchParams.get("order_id");
      const transactionStatus = searchParams.get("transaction_status");

      if (orderId) {
        try {
          await paymentsService.syncMidtrans(orderId);
          if (active) {
            setMessage(
              transactionStatus === "capture" || transactionStatus === "settlement"
                ? "Pembayaran berhasil dikonfirmasi. Mengalihkan ke jadwal tes..."
                : "Status pembayaran diperbarui. Mengalihkan ke jadwal tes..."
            );
          }
        } catch {
          if (active) {
            setMessage("Pembayaran sedang diproses. Mengalihkan ke jadwal tes...");
          }
        }
      } else if (active) {
        setMessage("Mengalihkan ke jadwal tes...");
      }

      window.setTimeout(() => {
        router.replace(TARGET_URL);
      }, 1200);
    }

    void syncAndRedirect();

    return () => {
      active = false;
    };
  }, [router, searchParams]);

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="rounded-xl border bg-white p-6 text-sm text-muted-foreground">
        {message}
      </div>
    </div>
  );
}
