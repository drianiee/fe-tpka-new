// app/payment/finish/page.tsx
"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

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

  React.useEffect(() => {
    const orderId = sp.get("order_id") ?? "";
    const statusCode = sp.get("status_code") ?? "";
    const trxStatus = sp.get("transaction_status") ?? "";

    const qs = new URLSearchParams();
    if (orderId) qs.set("order_id", orderId);
    if (statusCode) qs.set("status_code", statusCode);
    if (trxStatus) qs.set("transaction_status", trxStatus);

    router.replace(`/dashboard/peserta/my-schedules?status=all&${qs.toString()}`);
  }, [router, sp]);

  return (
    <div className="h-full min-h-screen grid place-items-center bg-background">
      <div className="rounded-xl border bg-white p-6 text-sm text-muted-foreground">
        Mengarahkan ke jadwal tes Anda...
      </div>
    </div>
  );
}
