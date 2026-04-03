"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogOut, Menu, User as UserIcon } from "lucide-react";

import { DashboardSidebar } from "@/components/common/DashboardSidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import type { User } from "@/lib/types/auth";
import { authService } from "@/lib/services/auth.service";
import { getToken, clearToken } from "@/lib/utils/storage";
import { getApiErrorMessage } from "@/lib/api/errors";
import Image from "next/image";

function roleLabel(role: User["role"]) {
  if (role === "administrator") return "Admin";
  if (role === "operator") return "Operator";
  return "Peserta";
}

function initials(name?: string | null) {
  const s = (name ?? "").trim();
  if (!s) return "U";
  const parts = s.split(/\s+/).slice(0, 2);
  const a = parts[0]?.[0] ?? "U";
  const b = parts[1]?.[0] ?? "";
  return (a + b).toUpperCase();
}

function AvatarCircle({ name }: { name: string }) {
  return (
    <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-900 grid place-items-center text-sm font-semibold">
      {initials(name)}
    </div>
  );
}

export function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = React.useState<User | null>(null);

  const [logoutOpen, setLogoutOpen] = React.useState(false);
  const [logoutLoading, setLogoutLoading] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    (async () => {
      try {
        const me = await authService.me();
        setUser(me);
      } catch (e: unknown) {
        clearToken();
        toast.error(getApiErrorMessage(e));
        router.replace("/login");
      }
    })();
  }, [router]);

  async function onConfirmLogout() {
    setLogoutLoading(true);
    try {
      await authService.logout();
    } catch (e: unknown) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setLogoutLoading(false);
      setLogoutOpen(false);
      clearToken();
      toast.success("Logout");
      router.replace("/login");
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 h-16 border-b bg-white">
        {/* <div className="mx-auto max-w-7xl h-full px-4 md:px-6 flex items-center justify-between"> */}
        <div className="mx-auto h-full px-4 md:px-20 flex items-center justify-between">
                      <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 md:hidden"
              aria-label="Buka menu"
              title="Buka menu"
            >
              <Menu className="h-4 w-4" />
            </button>
          <Link href="/dashboard" className="flex items-center gap-3">
            <Image
              src="/blue-logo.svg"
              alt="TPKA Logo"
              width={114}
              height={36}
              className="object-contain"
              priority
            />
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-md border px-3 py-2">
              <span className="text-sm text-muted-foreground">Akses:</span>
              <span className="text-sm font-medium">
                {roleLabel(user.role)}
              </span>
            </div>



            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="rounded-full focus:outline-none focus:ring-2 focus:ring-blue-200"
                  aria-label="Menu akun"
                >
                  <AvatarCircle name={user.name} />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="space-y-0.5">
                  <div className="text-sm font-medium">{user.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {user.email}
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                  <Link
                    href="/dashboard/account"
                    className="flex items-center gap-2"
                  >
                    <UserIcon className="h-4 w-4" />
                    Akun saya
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => setLogoutOpen(true)}
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[256px_1fr]">
        <div className="hidden md:block md:sticky md:top-16 md:h-[calc(100vh-4rem)] md:overflow-hidden border-b md:border-b-0 md:border-r bg-background">
          <div className="h-full overflow-y-auto">
            <DashboardSidebar user={user} />
          </div>
        </div>

        <main className="min-w-0">
          <div className="mx-auto max-w-6xl p-4 md:p-8">{children}</div>
        </main>
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            aria-hidden="true"
            onClick={() => setMobileMenuOpen(false)}
          />

          <aside className="relative z-10 flex h-full w-72 flex-col overflow-y-auto bg-background shadow-xl">
            {/* <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-3 right-3 rounded-full border border-slate-200 bg-white/80 p-1 text-slate-600 shadow-sm transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
              aria-label="Tutup menu"
            >
              <X className="h-4 w-4" />
            </button> */}

            <div className="h-full overflow-y-auto">
              <DashboardSidebar user={user} onNavigate={() => setMobileMenuOpen(false)} />
            </div>
          </aside>
        </div>
      )}

      <Dialog
        open={logoutOpen}
        onOpenChange={(open) => (logoutLoading ? null : setLogoutOpen(open))}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Logout</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin logout?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLogoutOpen(false)}
              disabled={logoutLoading}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={onConfirmLogout}
              disabled={logoutLoading}
            >
              {logoutLoading ? "Logout..." : "Ya, Logout"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
