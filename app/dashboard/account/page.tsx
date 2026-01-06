// app/dashboard/account/page.tsx
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { PageHeaderLayout } from "@/components/layouts/PageHeaderLayout"

import type { User } from "@/lib/types/auth"
import { authService } from "@/lib/services/auth.service"
import { getToken, clearToken } from "@/lib/utils/storage"
import { getApiErrorMessage } from "@/lib/api/errors"

function roleLabel(role: User["role"]) {
  if (role === "administrator") return "Admin"
  if (role === "operator") return "Operator"
  return "Peserta"
}

function verifyLabel(emailVerifiedAt?: string | null) {
  return emailVerifiedAt ? "Terverifikasi" : "Belum terverifikasi"
}

function verifyVariant(emailVerifiedAt?: string | null): "success" | "muted" {
  return emailVerifiedAt ? "success" : "muted"
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[220px_1fr] sm:gap-3">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="wrap-break-word text-sm font-medium text-foreground">{value}</div>
    </div>
  )
}

export default function AccountPage() {
  const router = useRouter()
  const [user, setUser] = React.useState<User | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const token = getToken()
    if (!token) {
      router.replace("/login")
      return
    }

    ;(async () => {
      try {
        const me = await authService.me()
        setUser(me)
      } catch (e: unknown) {
        clearToken()
        toast.error(getApiErrorMessage(e))
        router.replace("/login")
      } finally {
        setLoading(false)
      }
    })()
  }, [router])

  if (loading) {
    return <div className="text-sm text-muted-foreground">Memuat akun...</div>
  }

  if (!user) {
    return <div className="text-sm text-muted-foreground">Akun tidak ditemukan.</div>
  }

  return (
    <PageHeaderLayout
      title="Akun Saya"
      description="Informasi profil akun yang sedang login"
      showBack={false}
    >
      <div className="rounded-lg border bg-white">
        <div className="p-5 sm:p-6">
          <div className="space-y-1">
            <div className="text-lg font-semibold">{user.name}</div>
            <div className="text-sm text-muted-foreground">{user.email}</div>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Badge variant="secondary">Akses: {roleLabel(user.role)}</Badge>
              <Badge variant={verifyVariant(user.email_verified_at)}>
                {verifyLabel(user.email_verified_at)}
              </Badge>
            </div>
          </div>
        </div>

        <Separator />

        <div className="p-5 sm:p-6">
          <div className="text-sm font-semibold">Detail Akun</div>

          <div className="mt-4 divide-y">
            <Row label="User ID" value={user.id} />
            <Row label="Role" value={roleLabel(user.role)} />
            <Row label="Email verified" value={user.email_verified_at ? "Ya" : "Belum"} />
            {"profile_completed_at" in user ? (
              <Row
                label="Profile completed"
                value={user.profile_completed_at ? "Ya" : "Belum"}
              />
            ) : null}
          </div>
        </div>
      </div>
    </PageHeaderLayout>
  )
}
