// app/(public)/public-navbar.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import * as React from "react";
import { BookOpenText } from "lucide-react";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getToken } from "@/lib/utils/storage";

function isAuthRoute(pathname: string) {
  return (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/register/")
  );
}

export default function PublicNavbar() {
  const pathname = usePathname();
  const [hasToken, setHasToken] = React.useState(false);

  React.useEffect(() => {
    setHasToken(Boolean(getToken()));
  }, []);

  const authPage = isAuthRoute(pathname);
  const isLogin = pathname === "/login";
  const isRegister = pathname === "/register";

  return (
    <header className="fixed inset-x-0 top-0 z-40">
      <div className="border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Link href="/home" className="flex items-center gap-3">
              <Image
                src="/blue-logo.svg"
                alt="TPKA Logo"
                width={114}
                height={36}
                className="object-contain"
                priority
              />
            </Link>
          </div>

          {authPage ? (
            <div className="flex items-center gap-2">
              <div className="hidden text-sm text-muted-foreground md:block">
                {isLogin ? "Belum punya akun?" : "Sudah punya akun?"}
              </div>

              <Button asChild variant="outline" size="sm">
                <Link href={isLogin ? "/register" : "/login"}>
                  {isLogin ? "Daftar" : "Masuk"}
                </Link>
              </Button>

              {hasToken ? (
                <Button asChild variant="blue" size="sm">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm" className="hidden md:inline-flex">
                <Link href="/panduan/panduan-pendaftaran-dan-pelaksanaan-peserta.pdf" target="_blank" rel="noopener noreferrer">
                  <BookOpenText className="h-4 w-4" />
                  Panduan Peserta
                </Link>
              </Button>
              {hasToken ? (
                <Button asChild variant="blue" size="sm">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="outline" size="sm" className="md:hidden">
                    <Link href="/panduan/panduan-pendaftaran-dan-pelaksanaan-peserta.pdf" target="_blank" rel="noopener noreferrer">
                      <BookOpenText className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant={isLogin ? "default" : "outline"} size="sm">
                    <Link href="/login">Masuk</Link>
                  </Button>
                  <Button asChild variant={isRegister ? "default" : "blue"} size="sm">
                    <Link href="/register">Daftar</Link>
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
