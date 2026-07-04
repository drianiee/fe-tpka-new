"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

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
  const [message] = React.useState(
    "Pembayaran sedang menunggu konfirmasi server"
  );

  React.useEffect(() => {
    const timeout = window.setTimeout(() => {
      router.replace(TARGET_URL);
    }, 1200);

    return () => window.clearTimeout(timeout);
  }, [router]);

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="rounded-xl border bg-white p-6 text-sm text-muted-foreground">
        {message}
      </div>
    </div>
  );
}
