"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { authService } from "@/lib/services/auth.service";
import { setToken } from "@/lib/utils/storage";
import { getApiErrorMessage } from "@/lib/api/errors";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/* ================= VALIDATION ================= */

const schema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

type FormValues = z.infer<typeof schema>;

/* ================= PAGE ================= */

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
    mode: "onSubmit",
  });

  async function onSubmit(values: FormValues) {
    if (loading) return;

    setLoading(true);
    try {
      const res = await authService.login({
        email: values.email.trim(),
        password: values.password,
      });

      setToken(res.token);
      toast.success("Login berhasil");
      router.replace("/dashboard");
    } catch (e: unknown) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* ===== LEFT : IMAGE ===== */}
      <div className="relative hidden lg:block bg-muted">
        <Image
          src="/loginbg.png"
          alt="Login background"
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
      </div>

      {/* ===== RIGHT : FORM ===== */}
      <div className="flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Login</h1>
            <p className="text-sm text-muted-foreground">
              Masuk untuk mengakses dashboard.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@mail.com"
                disabled={loading}
                {...register("email")}
              />
              <p className="text-xs text-muted-foreground">
                Gunakan email yang terdaftar di sistem.
              </p>
              {errors.email ? (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                disabled={loading}
                {...register("password")}
              />
              <p className="text-xs text-muted-foreground">
                Pastikan caps lock tidak aktif.
              </p>
              {errors.password ? (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              ) : null}
            </div>

            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? "Memproses..." : "Login"}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground text-center">
            Belum punya akun?{" "}
            <Link
              className="text-foreground underline underline-offset-4"
              href="/register"
            >
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
