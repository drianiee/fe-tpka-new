// app/dashboard/account/page.tsx
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"

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
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Akun Saya</h1>
        <p className="text-sm text-muted-foreground">Informasi profil akun yang sedang login</p>
      </div>

      <Card className="p-4 space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="space-y-1">
            <div className="text-lg font-semibold">{user.name}</div>
            <div className="text-sm text-muted-foreground">{user.email}</div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Badge variant="secondary">Akses: {roleLabel(user.role)}</Badge>
              <Badge variant={verifyVariant(user.email_verified_at)}>{verifyLabel(user.email_verified_at)}</Badge>
            </div>
          </div>

          <Button variant="outline" onClick={() => router.back()}>
            Kembali
          </Button>
        </div>

        <Separator />

        <div className="grid gap-2 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">User ID</span>
            <span className="font-medium">{user.id}</span>
          </div>

          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Role</span>
            <span className="font-medium">{roleLabel(user.role)}</span>
          </div>

          {"profile_completed_at" in user ? (
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Profile completed</span>
              <span className="font-medium">{user.profile_completed_at ? "Ya" : "Belum"}</span>
            </div>
          ) : null}

          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Email verified</span>
            <span className="font-medium">{user.email_verified_at ? "Ya" : "Belum"}</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
