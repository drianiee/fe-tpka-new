"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Mail, RotateCcw, UserRound, ShieldCheck } from "lucide-react";

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
    .custom<File>((v) => v instanceof File, "File identitas wajib diupload")
    .refine((f) => f.size <= 5 * 1024 * 1024, "Maks 5MB")
    .refine(
      (f) => ["image/jpeg", "image/png", "image/jpg"].includes(f.type),
      "File harus JPG/PNG"
    ),
});

type CompleteProfileValues = z.infer<typeof completeProfileSchema>;

function safeTrim(v?: string | null) {
  return (v ?? "").trim();
}

export default function RegisterPage() {
  const router = useRouter();
  const params = useSearchParams();

  const tokenFromUrl = safeTrim(params.get("token"));
  const statusFromUrl = safeTrim(params.get("status"));
  const emailFromUrl = safeTrim(params.get("email"));

  const [registering, setRegistering] = React.useState(false);
  const [completing, setCompleting] = React.useState(false);

  // register success state (untuk tampilan "cek email" tanpa harus pindah halaman)
  const [registeredEmail, setRegisteredEmail] = React.useState<string | null>(null);

  // Jika user datang dari link verifikasi, kita anggap masuk flow complete profile
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
                  <div className="space-y-2">
                    <Label>Jenis Identitas</Label>
                    <Controller
                      control={completeForm.control}
                      name="id_type"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange} disabled={completing}>
                          <SelectTrigger>
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
                    <p className="text-xs text-muted-foreground">
                      Pilih identitas yang akan kamu unggah.
                    </p>
                    {completeForm.formState.errors.id_type ? (
                      <p className="text-sm text-destructive">
                        {completeForm.formState.errors.id_type.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="birth_date">Tanggal Lahir</Label>
                    <Input
                      id="birth_date"
                      type="date"
                      disabled={completing}
                      {...completeForm.register("birth_date")}
                    />
                    <p className="text-xs text-muted-foreground">
                      Pastikan sesuai dokumen identitas.
                    </p>
                    {completeForm.formState.errors.birth_date ? (
                      <p className="text-sm text-destructive">
                        {completeForm.formState.errors.birth_date.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">No HP</Label>
                    <Input
                      id="phone"
                      placeholder="08xxxxxxxxxx"
                      disabled={completing}
                      {...completeForm.register("phone")}
                    />
                    <p className="text-xs text-muted-foreground">
                      Gunakan nomor aktif (untuk kebutuhan informasi/konfirmasi).
                    </p>
                    {completeForm.formState.errors.phone ? (
                      <p className="text-sm text-destructive">
                        {completeForm.formState.errors.phone.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="id_image">Upload Foto Identitas</Label>
                    <Input
                      id="id_image"
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      disabled={completing}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) completeForm.setValue("id_image", file, { shouldValidate: true });
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Format JPG/PNG, ukuran maks 5MB.
                    </p>
                    {completeForm.formState.errors.id_image ? (
                      <p className="text-sm text-destructive">
                        {completeForm.formState.errors.id_image.message as string}
                      </p>
                    ) : null}
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
                      Kami sudah mengirim link verifikasi. Silakan cek inbox/spam dan klik link-nya
                      untuk mengaktifkan akun.
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
                <h1 className="text-2xl font-semibold tracking-tight">Buat Akun</h1>
                <p className="text-sm text-muted-foreground">
                  Daftar sebagai peserta. Verifikasi email diperlukan untuk mengaktifkan akun.
                </p>
              </div>

              <div className="rounded-2xl border bg-white p-6">
                <form className="space-y-4" onSubmit={registerForm.handleSubmit(onRegisterSubmit)}>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama</Label>
                    <Input
                      id="name"
                      placeholder="Nama lengkap"
                      disabled={registering}
                      {...registerForm.register("name")}
                    />
                    <p className="text-xs text-muted-foreground">
                      Gunakan nama asli sesuai identitas.
                    </p>
                    {registerForm.formState.errors.name ? (
                      <p className="text-sm text-destructive">
                        {registerForm.formState.errors.name.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@mail.com"
                      disabled={registering}
                      {...registerForm.register("email")}
                    />
                    <p className="text-xs text-muted-foreground">
                      Gunakan email yang aktif untuk menerima link verifikasi.
                    </p>
                    {registerForm.formState.errors.email ? (
                      <p className="text-sm text-destructive">
                        {registerForm.formState.errors.email.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Minimal 6 karakter"
                      disabled={registering}
                      {...registerForm.register("password")}
                    />
                    <p className="text-xs text-muted-foreground">{passwordRuleText}</p>
                    {registerForm.formState.errors.password ? (
                      <p className="text-sm text-destructive">
                        {registerForm.formState.errors.password.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password_confirmation">Konfirmasi Password</Label>
                    <Input
                      id="password_confirmation"
                      type="password"
                      placeholder="Ulangi password"
                      disabled={registering}
                      {...registerForm.register("password_confirmation")}
                    />
                    <p className="text-xs text-muted-foreground">
                      Harus sama persis dengan password di atas.
                    </p>
                    {registerForm.formState.errors.password_confirmation ? (
                      <p className="text-sm text-destructive">
                        {registerForm.formState.errors.password_confirmation.message}
                      </p>
                    ) : null}
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

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border bg-white p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl border bg-muted/30 p-2 text-muted-foreground">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Verifikasi Email</div>
                      <div className="text-xs text-muted-foreground">
                        Link verifikasi akan dikirim ke email yang kamu daftarkan.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border bg-white p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl border bg-muted/30 p-2 text-muted-foreground">
                      <UserRound className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Lengkapi Profil</div>
                      <div className="text-xs text-muted-foreground">
                        Setelah verifikasi, kamu akan diminta upload identitas.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
