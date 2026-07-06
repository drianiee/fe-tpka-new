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
import { ArrowLeft, Eye, EyeOff } from "lucide-react";

/* ================= UI HELPERS ================= */

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function fieldClass(hasError: boolean) {
  return cx(hasError && "border-destructive focus-visible:ring-destructive/30");
}

function hintClass(hasError: boolean) {
  return cx("text-xs", hasError ? "text-destructive" : "text-muted-foreground");
}

function fieldHint(errorMsg?: string, helper?: string) {
  return errorMsg ? errorMsg : helper ?? "";
}

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
  const [showPassword, setShowPassword] = React.useState(false);

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

  const emailErr = errors.email?.message;
  const passErr = errors.password?.message;

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
            <div className="flex gap-4 items-center">
              <h1 className="text-2xl font-semibold tracking-tight">Login</h1>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-1"
                onClick={() => router.push("/home")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali ke Landing
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Masuk untuk mengakses dashboard.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@mail.com"
                disabled={loading}
                className={fieldClass(Boolean(emailErr))}
                {...register("email")}
              />
              <p className={hintClass(Boolean(emailErr))}>
                {fieldHint(emailErr, "Gunakan email yang terdaftar di sistem.")}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>

              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  disabled={loading}
                  className={cx(fieldClass(Boolean(passErr)), "pr-10")}
                  {...register("password")}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  title={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  disabled={loading}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setShowPassword((v) => !v)}
                  className={cx(
                    "absolute right-2 top-1/2 -translate-y-1/2",
                    "inline-flex h-8 w-8 items-center justify-center rounded-md",
                    "text-muted-foreground hover:text-foreground",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    "focus:outline-none focus-visible:outline-none focus-visible:ring-0"
                  )}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
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
