"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { authService } from "@/lib/services/auth.service";
import { getApiErrorMessage } from "@/lib/api/errors";
import { setToken } from "@/lib/utils/storage";

export default function VerifyEmailPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
          Memuat halaman...
        </div>
      }
    >
      <VerifyEmailContent />
    </React.Suspense>
  );
}

function VerifyEmailContent() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [status, setStatus] = React.useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = React.useState("Memverifikasi email...");

  React.useEffect(() => {
    let active = true;

    async function run() {
      if (!token) {
        setStatus("error");
        setMessage("Token verifikasi tidak ditemukan.");
        return;
      }

      try {
        const res = await authService.verifyEmail(token);
        if (!active) return;
        setToken(res.token);
        setStatus("success");
        setMessage(res.message ?? "Email berhasil diverifikasi.");
        const email = encodeURIComponent(res.user.email);
        router.replace(`/register?token=${encodeURIComponent(res.token)}&status=verified&email=${email}`);
      } catch (error) {
        if (!active) return;
        setStatus("error");
        setMessage(getApiErrorMessage(error));
      }
    }

    void run();
    return () => {
      active = false;
    };
  }, [router, token]);

  return (
    <div className="grid min-h-svh place-items-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border bg-muted/30">
          {status === "loading" ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : status === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600" />
          )}
        </div>
        <h1 className="text-xl font-semibold">Verifikasi Email</h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>

        {status === "error" ? (
          <div className="mt-6 flex flex-col gap-2">
            <Button asChild>
              <Link href="/register">Daftar Ulang</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/login">Ke Login</Link>
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
