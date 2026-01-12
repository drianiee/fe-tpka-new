// app/dashboard/account/page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PageHeaderLayout } from "@/components/layouts/PageHeaderLayout";
import { Button } from "@/components/ui/button";

// shadcn dialog
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { User } from "@/lib/types/auth";
import { authService } from "@/lib/services/auth.service";
import { getToken, clearToken } from "@/lib/utils/storage";
import { getApiErrorMessage } from "@/lib/api/errors";
import { API_BASE_URL } from "@/lib/api/client";

/* ================= HELPERS ================= */

function roleLabel(role: User["role"]) {
  if (role === "administrator") return "Admin";
  if (role === "operator") return "Operator";
  return "Peserta";
}

function verifyLabel(emailVerifiedAt?: string | null) {
  return emailVerifiedAt ? "Terverifikasi" : "Belum terverifikasi";
}

function verifyVariant(emailVerifiedAt?: string | null): "success" | "muted" {
  return emailVerifiedAt ? "success" : "muted";
}

function activeLabel(isActive?: boolean | null) {
  return isActive ? "Aktif" : "Nonaktif";
}

function activeVariant(isActive?: boolean | null): "success" | "destructive" {
  return isActive ? "success" : "destructive";
}

function formatDateTimeId(input?: string | null) {
  if (!input) return "-";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

function formatDateOnlyId(input?: string | null) {
  if (!input) return "-";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;

  return new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(d);
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[220px_1fr] sm:gap-3">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-sm font-medium text-foreground wrap-break-word">
        {value}
      </div>
    </div>
  );
}

function getApiBaseUrl() {
  return (API_BASE_URL ?? "http://localhost:8000").replace(/\/$/, "");
}

function buildStorageUrl(storagePath?: string | null) {
  if (!storagePath) return null;
  const base = getApiBaseUrl();
  const clean = storagePath.replace(/^\/+/, "");
  return `${base}/storage/${clean}`;
}

/* ================= PAGE ================= */

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [loggingOut, setLoggingOut] = React.useState(false);

  // ===== modal state =====
  const [idImageOpen, setIdImageOpen] = React.useState(false);

  const idImageUrl = React.useMemo(() => {
    return buildStorageUrl((user)?.id_image_path ?? null);
  }, [(user)?.id_image_path]);

  const fetchMe = React.useCallback(async () => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    setLoading(true);
    try {
      const me = await authService.me();
      setUser(me);
    } catch (e: unknown) {
      clearToken();
      toast.error(getApiErrorMessage(e));
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  React.useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  async function onLogout() {
    if (loggingOut) return;

    setLoggingOut(true);
    try {
      await authService.logout();
    } catch (e: unknown) {
      // walaupun gagal, tetap logout lokal biar aman
      toast.error(getApiErrorMessage(e));
    } finally {
      clearToken();
      setLoggingOut(false);
      router.replace("/login");
    }
  }

  if (loading) {
    return (
      <PageHeaderLayout
        title="Akun Saya"
        description="Informasi profil akun yang sedang login"
        showBack={false}
      >
        <div className="text-sm text-muted-foreground">Memuat akun...</div>
      </PageHeaderLayout>
    );
  }

  if (!user) {
    return (
      <PageHeaderLayout
        title="Akun Saya"
        description="Informasi profil akun yang sedang login"
        showBack={false}
      >
        <div className="text-sm text-muted-foreground">
          Akun tidak ditemukan.
        </div>
      </PageHeaderLayout>
    );
  }

  return (
    <PageHeaderLayout
      title="Akun Saya"
      description="Informasi profil akun yang sedang login"
      showBack={false}
    >
      {/* ===== Modal Foto Identitas ===== */}
      <Dialog open={idImageOpen} onOpenChange={setIdImageOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Foto Identitas</DialogTitle>
            <DialogDescription>
              Klik di luar modal atau tekan ESC untuk menutup.
            </DialogDescription>
          </DialogHeader>

          {idImageUrl ? (
            <div className="space-y-3">
              <div className="rounded-xl border bg-muted/10 p-2">
                <div className="relative w-full overflow-hidden rounded-lg border bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={idImageUrl}
                    alt="Foto identitas"
                    className="h-full w-full object-contain"
                    loading="lazy"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIdImageOpen(false)}
                >
                  Tutup
                </Button>

                <Button asChild type="button">
                  <a href={idImageUrl} target="_blank" rel="noreferrer">
                    Buka tab baru
                  </a>
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Belum ada foto identitas.
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="rounded-lg border bg-white">
        {/* Header */}
        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <div className="text-lg font-semibold">{user.name}</div>
              <div className="text-sm text-muted-foreground">{user.email}</div>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                <Badge variant="secondary">Akses: {roleLabel(user.role)}</Badge>

                <Badge variant={verifyVariant(user.email_verified_at)}>
                  {verifyLabel(user.email_verified_at)}
                </Badge>

                {"is_active" in user ? (
                  <Badge variant={activeVariant((user).is_active)}>
                    {activeLabel((user).is_active)}
                  </Badge>
                ) : null}

                {"moodle_user_id" in user && (user).moodle_user_id ? (
                  <Badge variant="outline">
                    Moodle UID: {(user).moodle_user_id}
                  </Badge>
                ) : null}
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={fetchMe}>
                Refresh
              </Button>

              <Button
                type="button"
                variant="destructive"
                onClick={onLogout}
                disabled={loggingOut}
              >
                {loggingOut ? "Keluar..." : "Logout"}
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        {/* Body */}
        <div className="p-5 sm:p-6">
          <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
            {/* LEFT: ID image (klik => modal) */}
            <div className="space-y-2">
              <div className="text-sm font-semibold">Identitas</div>

              <div className="rounded-lg border bg-muted/10 p-3">
                {idImageUrl ? (
                  <button
                    type="button"
                    onClick={() => setIdImageOpen(true)}
                    className="w-full text-left space-y-2 focus:outline-none"
                    aria-label="Buka foto identitas"
                    title="Klik untuk memperbesar"
                  >
                    <div className="relative aspect-4/3 w-full overflow-hidden rounded-md border bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={idImageUrl}
                        alt="Foto identitas"
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Klik foto untuk memperbesar
                    </div>
                  </button>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Belum ada foto identitas.
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: Account details */}
            <div>
              <div className="text-sm font-semibold">Detail Akun</div>

              <div className="mt-4 divide-y">
                <Row label="User ID" value={user.id} />
                <Row label="Role" value={roleLabel(user.role)} />
                <Row
                  label="Email verified"
                  value={user.email_verified_at ? "Ya" : "Belum"}
                />

                {"is_active" in user ? (
                  <Row
                    label="Status akun"
                    value={activeLabel((user).is_active)}
                  />
                ) : null}

                {"id_type" in user ? (
                  <Row
                    label="Jenis identitas"
                    value={String((user).id_type ?? "-").toUpperCase()}
                  />
                ) : null}

                {"birth_date" in user ? (
                  <Row
                    label="Tanggal lahir"
                    value={formatDateOnlyId((user).birth_date ?? null)}
                  />
                ) : null}

                {"phone" in user ? (
                  <Row label="No HP" value={(user).phone ?? "-"} />
                ) : null}

                {"profile_completed_at" in user ? (
                  <Row
                    label="Profile completed"
                    value={(user).profile_completed_at ? "Ya" : "Belum"}
                  />
                ) : null}

                {"created_at" in user ? (
                  <Row
                    label="Dibuat"
                    value={formatDateTimeId((user).created_at ?? null)}
                  />
                ) : null}

                {"updated_at" in user ? (
                  <Row
                    label="Diperbarui"
                    value={formatDateTimeId((user).updated_at ?? null)}
                  />
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageHeaderLayout>
  );
}
