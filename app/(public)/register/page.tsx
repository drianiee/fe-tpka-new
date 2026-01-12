"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CheckCircle2, Mail, RotateCcw, Eye, EyeOff } from "lucide-react";

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

import { authService } from "@/lib/services/auth.service";
import { setToken } from "@/lib/utils/storage";
import { getApiErrorMessage } from "@/lib/api/errors";

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

function safeTrim(v?: string | null) {
  return (v ?? "").trim();
}

/* ================= REGISTER VALIDATION ================= */

const passwordRuleText =
  "Password minimal 6 karakter, mengandung 1 huruf besar, 1 angka, dan 1 karakter khusus (contoh: = atau -).";

const registerSchema = z
  .object({
    name: z.string().min(2, "Nama minimal 2 karakter"),
    email: z.string().email("Email tidak valid"),
    password: z
      .string()
      .min(6, "Password minimal 6 karakter")
      .refine((v) => /[A-Z]/.test(v), "Password harus mengandung minimal 1 huruf besar")
      .refine((v) => /[0-9]/.test(v), "Password harus mengandung minimal 1 angka")
      .refine((v) => /[=-]/.test(v), "Password harus mengandung minimal 1 karakter khusus: = atau -"),
    password_confirmation: z.string().min(6, "Konfirmasi password minimal 6 karakter"),
  })
  .refine((v) => v.password === v.password_confirmation, {
    message: "Password dan konfirmasi tidak sama",
    path: ["password_confirmation"],
  });

type RegisterValues = z.infer<typeof registerSchema>;

/* ================= COMPLETE PROFILE VALIDATION ================= */

const completeProfileSchema = z.object({
  id_type: z.enum(["ktp", "ktm", "sim"], { message: "Pilih jenis identitas" }),
  birth_date: z.string().min(1, "Tanggal lahir wajib diisi"),
  phone: z.string().min(8, "Nomor HP minimal 8 digit"),
  id_image: z
    .custom<File>((v) => v instanceof File, "Identitas wajib diunggah")
    .refine((f) => f.size <= 5 * 1024 * 1024, "Maks 5MB")
    .refine((f) => ["image/jpeg", "image/png", "image/jpg"].includes(f.type), "File harus JPG/PNG"),
});

type CompleteProfileValues = z.infer<typeof completeProfileSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const params = useSearchParams();

  const tokenFromUrl = safeTrim(params.get("token"));
  const statusFromUrl = safeTrim(params.get("status"));
  const emailFromUrl = safeTrim(params.get("email"));

  const [registering, setRegistering] = React.useState(false);
  const [completing, setCompleting] = React.useState(false);

  const [registeredEmail, setRegisteredEmail] = React.useState<string | null>(null);

  const [showPassword, setShowPassword] = React.useState(false);
  const [showPasswordConf, setShowPasswordConf] = React.useState(false);

  const isCompleteMode = Boolean(tokenFromUrl);

  /* ---------------- REGISTER FORM ---------------- */

  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      password_confirmation: "",
    },
    mode: "onSubmit",
  });

  async function onRegisterSubmit(values: RegisterValues) {
    if (registering) return;

    setRegistering(true);
    try {
      const payload = {
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        password_confirmation: values.password_confirmation,
      };

      const res = await authService.register(payload);

      toast.success(res?.message ?? "Registrasi berhasil. Silakan cek email untuk verifikasi.");
      setRegisteredEmail(payload.email);
    } catch (e: unknown) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setRegistering(false);
    }
  }

  function resetRegister() {
    setRegisteredEmail(null);
    setShowPassword(false);
    setShowPasswordConf(false);
    registerForm.reset({
      name: "",
      email: "",
      password: "",
      password_confirmation: "",
    });
  }

  /* ---------------- COMPLETE PROFILE FORM ---------------- */

  const completeForm = useForm<CompleteProfileValues>({
    resolver: zodResolver(completeProfileSchema),
    defaultValues: {
      id_type: "ktp",
      birth_date: "",
      phone: "",
      id_image: undefined as unknown as File,
    },
    mode: "onSubmit",
  });

  React.useEffect(() => {
    if (!tokenFromUrl) return;

    if (statusFromUrl === "already-verified") {
      toast.info("Email sudah terverifikasi. Silakan lengkapi profil.");
    } else if (statusFromUrl === "verified") {
      toast.success("Email berhasil diverifikasi. Silakan lengkapi profil.");
    }
  }, [tokenFromUrl, statusFromUrl]);

  async function onCompleteSubmit(values: CompleteProfileValues) {
    if (!tokenFromUrl) {
      toast.error("Token verifikasi tidak ditemukan. Silakan klik ulang link verifikasi dari email.");
      router.replace("/login");
      return;
    }

    if (completing) return;

    setCompleting(true);
    try {
      const res = await authService.completeProfile(tokenFromUrl, {
        id_type: values.id_type,
        birth_date: values.birth_date,
        phone: values.phone,
        id_image: values.id_image,
      });

      setToken(res.token);

      toast.success(res?.message ?? "Profil berhasil dilengkapi");
      router.replace("/dashboard");
    } catch (e: unknown) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setCompleting(false);
    }
  }

  /* ---------------- UI STATES ---------------- */

  const showCheckEmail = !isCompleteMode && Boolean(registeredEmail);

  // errors (register)
  const regErr = registerForm.formState.errors;
  const nameErr = regErr.name?.message;
  const emailErr = regErr.email?.message;
  const passErr = regErr.password?.message;
  const passConfErr = regErr.password_confirmation?.message;

  // errors (complete)
  const compErr = completeForm.formState.errors;
  const birthErr = compErr.birth_date?.message;
  const phoneErr = compErr.phone?.message;
  const idTypeErr = compErr.id_type?.message;
  const idImgErr = compErr.id_image?.message as string | undefined;

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* ===== LEFT : IMAGE ===== */}
      <div className="relative hidden lg:block bg-muted">
        <Image
          src="/loginbg.png"
          alt="Register background"
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
      </div>

      {/* ===== RIGHT : CONTENT ===== */}
      <div className="flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-lg">
          {/* ============ COMPLETE PROFILE MODE (token in URL) ============ */}
          {isCompleteMode ? (
            <div className="space-y-6">
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight">Lengkapi Profil</h1>
                <p className="text-sm text-muted-foreground">
                  {emailFromUrl ? (
                    <>
                      Lengkapi profil untuk:{" "}
                      <span className="font-medium text-foreground">{emailFromUrl}</span>
                    </>
                  ) : (
                    "Lengkapi profil Anda untuk melanjutkan."
                  )}
                </p>
              </div>

              <div className="rounded-2xl border bg-white p-6">
                <form className="space-y-4" onSubmit={completeForm.handleSubmit(onCompleteSubmit)}>
                  {/* Birth date */}
                  <div className="space-y-2">
                    <Label htmlFor="birth_date">Tanggal Lahir</Label>
                    <Input
                      id="birth_date"
                      type="date"
                      disabled={completing}
                      className={fieldClass(Boolean(birthErr))}
                      {...completeForm.register("birth_date")}
                    />
                    <p className={hintClass(Boolean(birthErr))}>
                      {fieldHint(birthErr, "Pastikan sesuai dokumen identitas.")}
                    </p>
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone">No HP</Label>
                    <Input
                      id="phone"
                      placeholder="08xxxxxxxxxx"
                      disabled={completing}
                      className={fieldClass(Boolean(phoneErr))}
                      {...completeForm.register("phone")}
                    />
                    <p className={hintClass(Boolean(phoneErr))}>
                      {fieldHint(phoneErr, "Gunakan nomor aktif (untuk kebutuhan informasi/konfirmasi).")}
                    </p>
                  </div>

                  {/* ID type + ID image */}
                  <div className="space-y-2">
                    <Label htmlFor="id_image">Unggah Identitas</Label>

                    <div className="flex gap-2">
                      <Controller
                        control={completeForm.control}
                        name="id_type"
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange} disabled={completing}>
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
                        disabled={completing}
                        className={fieldClass(Boolean(idImgErr))}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            completeForm.setValue("id_image", file, { shouldValidate: true });
                          }
                        }}
                      />
                    </div>

                    <p className={hintClass(Boolean(idTypeErr || idImgErr))}>
                      {fieldHint(idTypeErr || idImgErr, "Format JPG/PNG, ukuran maks 5MB.")}
                    </p>
                  </div>

                  <Button className="w-full" type="submit" disabled={completing}>
                    {completing ? "Menyimpan..." : "Simpan Profil"}
                  </Button>

                  <div className="pt-2 text-center text-sm text-muted-foreground">
                    Salah akun?{" "}
                    <Link href="/login" className="text-foreground underline underline-offset-4">
                      Login
                    </Link>
                  </div>
                </form>
              </div>
            </div>
          ) : showCheckEmail ? (
            /* ============ CHECK EMAIL MODE (after register success) ============ */
            <div className="space-y-6">
              <div className="rounded-2xl border bg-white p-6">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-xl border bg-muted/30 p-2 text-muted-foreground">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>

                  <div className="space-y-1">
                    <h1 className="text-xl font-semibold leading-tight">Cek email kamu</h1>
                    <p className="text-sm text-muted-foreground">
                      Kami sudah mengirim link verifikasi. Silakan cek inbox/spam dan klik link-nya untuk mengaktifkan
                      akun.
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-xl border bg-muted/20 p-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Email tujuan:</span>
                    <span className="font-medium text-foreground">{registeredEmail}</span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Jika email tidak masuk dalam 1–3 menit, cek folder spam/promotions.
                  </p>
                </div>

                <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button type="button" variant="outline" onClick={resetRegister}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Register ulang
                  </Button>

                  <Button type="button" onClick={() => router.replace("/login")}>
                    Ke Login
                  </Button>
                </div>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                Sudah klik link verifikasi? Setelah itu kamu akan diarahkan kembali untuk{" "}
                <span className="font-medium text-foreground">lengkapi profil</span>.
              </div>
            </div>
          ) : (
            /* ============ REGISTER MODE ============ */
            <div className="space-y-6">
              <div className="space-y-1">
                <div className="flex gap-4 items-center">
                  <h1 className="text-2xl font-semibold tracking-tight">Buat Akun</h1>
                  <Button type="button" variant="outline" size="sm" className="mt-1" onClick={() => router.push("/home")}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Kembali ke Landing
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Daftar sebagai peserta. Verifikasi email diperlukan untuk mengaktifkan akun.
                </p>
              </div>

              <div className="rounded-2xl border bg-white p-6">
                <form className="space-y-4" onSubmit={registerForm.handleSubmit(onRegisterSubmit)}>
                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama</Label>
                    <Input
                      id="name"
                      placeholder="Nama lengkap"
                      disabled={registering}
                      className={fieldClass(Boolean(nameErr))}
                      {...registerForm.register("name")}
                    />
                    <p className={hintClass(Boolean(nameErr))}>{fieldHint(nameErr, "")}</p>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@mail.com"
                      disabled={registering}
                      className={fieldClass(Boolean(emailErr))}
                      {...registerForm.register("email")}
                    />
                    <p className={hintClass(Boolean(emailErr))}>{fieldHint(emailErr, "")}</p>
                  </div>

                  {/* Password (eye, no focus block) */}
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Minimal 6 karakter"
                        disabled={registering}
                        className={cx(fieldClass(Boolean(passErr)), "pr-10")}
                        {...registerForm.register("password")}
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                        title={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                        disabled={registering}
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

                    <p className={hintClass(Boolean(passErr))}>{fieldHint(passErr, passwordRuleText)}</p>
                  </div>

                  {/* Password confirmation (eye, no focus block) */}
                  <div className="space-y-2">
                    <Label htmlFor="password_confirmation">Konfirmasi Password</Label>
                    <div className="relative">
                      <Input
                        id="password_confirmation"
                        type={showPasswordConf ? "text" : "password"}
                        placeholder="Ulangi password"
                        disabled={registering}
                        className={cx(fieldClass(Boolean(passConfErr)), "pr-10")}
                        {...registerForm.register("password_confirmation")}
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        aria-label={showPasswordConf ? "Sembunyikan konfirmasi password" : "Tampilkan konfirmasi password"}
                        title={showPasswordConf ? "Sembunyikan konfirmasi password" : "Tampilkan konfirmasi password"}
                        disabled={registering}
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

                    <p className={hintClass(Boolean(passConfErr))}>
                      {fieldHint(passConfErr, "Harus sama persis dengan password di atas.")}
                    </p>
                  </div>

                  <Button className="w-full" disabled={registering} type="submit">
                    {registering ? "Memproses..." : "Register"}
                  </Button>

                  <div className="pt-2 text-center text-sm text-muted-foreground">
                    Sudah punya akun?{" "}
                    <Link href="/login" className="text-foreground underline underline-offset-4">
                      Login
                    </Link>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
