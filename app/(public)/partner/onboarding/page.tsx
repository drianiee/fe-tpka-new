"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, RotateCcw, Eye, EyeOff } from "lucide-react";
import axios, { AxiosError } from "axios";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { setToken } from "@/lib/utils/storage";
import { getApiErrorMessage } from "@/lib/api/errors";
import { http } from "@/lib/api/http";

/* ================= HELPERS ================= */

function safeTrim(v?: string | null): string {
  return (v ?? "").trim();
}

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

/* ================= TYPES ================= */

type OnboardingResponse = {
  message: string;
  user: {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    profile_completed_at: string | null;
    role: string;
  };
  token: string;
  schedule_id: number | null;
  partner: { id: number; name: string } | null;
  package_id: number | null;
  moodle?: {
    sync_enabled: boolean;
    ok: boolean;
    step?: string | null;
    error?: string | null;
    warnings?: string[];
    moodle_user_id?: number | null;
    course_id?: number | null;
    groups_assigned?: number | null;
    login?: { username: string; password: string } | null;
  };
};

/* ================= VALIDATION ================= */

const passwordRuleText =
  "Password minimal 6 karakter, mengandung 1 huruf besar, 1 angka, dan 1 karakter khusus (contoh: = atau -).";

const schema = z
  .object({
    password: z
      .string()
      .min(6, "Password minimal 6 karakter")
      .refine((v) => /[A-Z]/.test(v), "Password harus mengandung minimal 1 huruf besar")
      .refine((v) => /[0-9]/.test(v), "Password harus mengandung minimal 1 angka")
      .refine((v) => /[=-]/.test(v), "Password harus mengandung minimal 1 karakter khusus: = atau -"),
    password_confirmation: z.string().min(6, "Ulangi password minimal 6 karakter"),
    id_type: z.enum(["ktp", "ktm", "sim"], { message: "Pilih jenis identitas" }),
    birth_date: z.string().min(1, "Tanggal lahir wajib diisi"),
    phone: z.string().min(8, "Nomor HP minimal 8 digit"),
    id_image: z
      .custom<File>((v) => v instanceof File, "Identitas wajib diunggah")
      .refine((f) => f.size <= 5 * 1024 * 1024, "Maks 5MB")
      .refine((f) => ["image/jpeg", "image/png", "image/jpg"].includes(f.type), "File harus JPG/PNG"),
  })
  .refine((v) => v.password === v.password_confirmation, {
    message: "Password dan konfirmasi tidak sama",
    path: ["password_confirmation"],
  });

type FormValues = z.infer<typeof schema>;

/* ================= PAGE ================= */

export default function PartnerOnboardingPage() {
  const router = useRouter();
  const params = useSearchParams();
  const tokenFromUrl = safeTrim(params.get("token"));

  const [submitting, setSubmitting] = React.useState(false);
  const [success, setSuccess] = React.useState<OnboardingResponse | null>(null);

  const [showPassword, setShowPassword] = React.useState(false);
  const [showPasswordConf, setShowPasswordConf] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      password: "",
      password_confirmation: "",
      id_type: "ktp",
      birth_date: "",
      phone: "",
      id_image: undefined as unknown as File,
    },
    mode: "onSubmit",
  });

  async function onSubmit(values: FormValues) {
    if (submitting) return;

    if (!tokenFromUrl) {
      toast.error("Token onboarding tidak ditemukan di URL.");
      router.replace("/login");
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("token", tokenFromUrl);
      fd.append("password", values.password);
      fd.append("password_confirmation", values.password_confirmation);
      fd.append("id_type", values.id_type);
      fd.append("birth_date", values.birth_date);
      fd.append("phone", values.phone);
      fd.append("id_image", values.id_image);

      const res = await http.post<OnboardingResponse>("/api/partner/onboarding", fd, {
        headers: {
          "Content-Type": "multipart/form-data",
          Accept: "application/json",
        },
      });

      setToken(res.data.token);
      toast.success(res.data.message ?? "Onboarding berhasil");
      setSuccess(res.data);

      router.replace("/dashboard/peserta");
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        const ax = e as AxiosError<{ message?: string; errors?: Record<string, string[]> }>;
        toast.error(ax.response?.data?.message ?? ax.message);

        const errors = ax.response?.data?.errors;
        if (errors) {
          for (const [k, msgs] of Object.entries(errors)) {
            const first = msgs?.[0];
            if (!first) continue;

            if (k === "password") form.setError("password", { type: "server", message: first });
            if (k === "password_confirmation")
              form.setError("password_confirmation", { type: "server", message: first });
            if (k === "id_type") form.setError("id_type", { type: "server", message: first });
            if (k === "birth_date") form.setError("birth_date", { type: "server", message: first });
            if (k === "phone") form.setError("phone", { type: "server", message: first });
            if (k === "id_image") form.setError("id_image", { type: "server", message: first });
          }
        }
      } else {
        toast.error(getApiErrorMessage(e));
      }
    } finally {
      setSubmitting(false);
    }
  }

  function onReset() {
    setSuccess(null);
    setShowPassword(false);
    setShowPasswordConf(false);
    form.reset({
      password: "",
      password_confirmation: "",
      id_type: "ktp",
      birth_date: "",
      phone: "",
      id_image: undefined as unknown as File,
    });
  }

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = form;

  const passwordErr = errors.password?.message;
  const passwordConfErr = errors.password_confirmation?.message;
  const birthErr = errors.birth_date?.message;
  const phoneErr = errors.phone?.message;
  const idTypeErr = errors.id_type?.message;
  const idImageErr = errors.id_image?.message;

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* LEFT IMAGE */}
      <div className="relative hidden lg:block bg-muted">
        <Image
          src="/loginbg.png"
          alt="Onboarding background"
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
      </div>

      {/* RIGHT FORM */}
      <div className="flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-lg space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Onboarding Peserta Mitra</h1>
            <p className="text-sm text-muted-foreground">
              Buat password dan lengkapi profil untuk mulai mengakses dashboard peserta.
            </p>
          </div>

          {success ? (
            <div className="rounded-2xl border bg-white p-6">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-xl border bg-muted/30 p-2 text-muted-foreground">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <div className="text-xl font-semibold leading-tight">Berhasil</div>
                  <p className="text-sm text-muted-foreground">
                    {success.message ?? "Onboarding berhasil. Mengarahkan ke dashboard…"}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button type="button" variant="outline" onClick={onReset}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Isi ulang
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border bg-white p-6">
              <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>

                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimal 6 karakter"
                      disabled={submitting}
                      className={cx(fieldClass(Boolean(passwordErr)), "pr-10")}
                      {...register("password")}
                    />

                    <button
                      type="button"
                      tabIndex={-1}
                      aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                      title={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                      disabled={submitting}
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
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  <p className={hintClass(Boolean(passwordErr))}>{fieldHint(passwordErr, passwordRuleText)}</p>
                </div>

                {/* Password confirmation */}
                <div className="space-y-2">
                  <Label htmlFor="password_confirmation">Ulangi password</Label>

                  <div className="relative">
                    <Input
                      id="password_confirmation"
                      type={showPasswordConf ? "text" : "password"}
                      placeholder="Ulangi password"
                      disabled={submitting}
                      className={cx(fieldClass(Boolean(passwordConfErr)), "pr-10")}
                      {...register("password_confirmation")}
                    />

                    <button
                      type="button"
                      tabIndex={-1}
                      aria-label={showPasswordConf ? "Sembunyikan konfirmasi password" : "Tampilkan konfirmasi password"}
                      title={showPasswordConf ? "Sembunyikan konfirmasi password" : "Tampilkan konfirmasi password"}
                      disabled={submitting}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setShowPasswordConf((v) => !v)}
                      className={cx(
                        "absolute right-2 top-1/2 -translate-y-1/2",
                        "inline-flex h-8 w-8 items-center justify-center rounded-md",
                        "text-muted-foreground hover:text-foreground",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        "focus:outline-none focus-visible:outline-none focus-visible:ring-0"
                      )}
                    >
                      {showPasswordConf ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  <p className={hintClass(Boolean(passwordConfErr))}>
                    {fieldHint(passwordConfErr, "Harus sama persis dengan password di atas.")}
                  </p>
                </div>

                {/* Birth date + phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Tanggal Lahir dan No HP</Label>

                  <div className="flex gap-2">
                    <Input
                      id="birth_date"
                      type="date"
                      disabled={submitting}
                      className={cx("w-fit", fieldClass(Boolean(birthErr)))}
                      {...register("birth_date")}
                    />

                    <Input
                      id="phone"
                      placeholder="08xxxxxxxxxx"
                      disabled={submitting}
                      className={fieldClass(Boolean(phoneErr))}
                      {...register("phone")}
                    />
                  </div>

                  <p className={hintClass(Boolean(birthErr || phoneErr))}>
                    {fieldHint(birthErr || phoneErr, "Gunakan nomor aktif (untuk kebutuhan informasi/konfirmasi).")}
                  </p>
                </div>

                {/* ID type + ID image */}
                <div className="space-y-2">
                  <Label htmlFor="id_image">Unggah Identitas</Label>

                  <div className="flex gap-2">
                    <Controller
                      control={control}
                      name="id_type"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange} disabled={submitting}>
                          <SelectTrigger className={fieldClass(Boolean(idTypeErr))}>
                            <SelectValue placeholder="Pilih jenis identitas" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ktp">KTP</SelectItem>
                            <SelectItem value="ktm">KTM</SelectItem>
                            <SelectItem value="sim">SIM</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />

                    <Input
                      id="id_image"
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      disabled={submitting}
                      className={fieldClass(Boolean(idImageErr))}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setValue("id_image", file, { shouldValidate: true });
                      }}
                    />
                  </div>

                  <p className={hintClass(Boolean(idTypeErr || idImageErr))}>
                    {fieldHint(idTypeErr || idImageErr, "Format JPG/PNG, ukuran maks 5MB.")}
                  </p>
                </div>

                <Button className="w-full" type="submit" disabled={submitting}>
                  {submitting ? "Memproses..." : "Selesaikan Onboarding"}
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
