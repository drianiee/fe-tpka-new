// app/dashboard/page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/services/auth.service";
import { getToken } from "@/lib/utils/storage";

function roleHome(role: string) {
  if (role === "administrator" || role === "operator") return "/dashboard/admin";
  return "/dashboard/peserta";
}

export default function DashboardIndexPage() {
  const router = useRouter();

  React.useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    authService
      .me()
      .then((me) => router.replace(roleHome(me.role)))
      .catch(() => router.replace("/login"));
  }, [router]);

  return <></>;
}
