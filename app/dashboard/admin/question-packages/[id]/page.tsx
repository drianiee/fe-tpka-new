"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { questionPackagesService } from "@/lib/services/questionPackages.service"
import type { QuestionPackage } from "@/lib/types/question-packages"
import { API_ENDPOINTS } from "@/lib/api/endpoints"
import { getApiErrorMessage } from "@/lib/api/errors"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function AdminQuestionPackageDetailPage() {
  const params = useParams()
  const router = useRouter()
  const qc = useQueryClient()

  const id = Array.isArray((params)?.id)
    ? (params).id[0]
    : ((params)?.id as string | undefined)

  const pkgId = Number(id)

  const [confirmStatusOpen, setConfirmStatusOpen] = React.useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false)

  const detailQuery = useQuery({
    queryKey: [API_ENDPOINTS.QUESTION_PACKAGES.DETAIL(pkgId)],
    queryFn: () => questionPackagesService.detail(pkgId),
    enabled: Number.isFinite(pkgId),
  })

  const item: QuestionPackage | null = detailQuery.data?.data ?? null

  const statusMut = useMutation({
    mutationFn: (nextActive: boolean) =>
      questionPackagesService.updateStatus(pkgId, { is_active: nextActive }),
    onSuccess: (res) => {
      toast.success(res.message ?? "Status updated")
      qc.invalidateQueries({ queryKey: [API_ENDPOINTS.QUESTION_PACKAGES.BASE] })
      qc.invalidateQueries({ queryKey: [API_ENDPOINTS.QUESTION_PACKAGES.DETAIL(pkgId)] })
      setConfirmStatusOpen(false)
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  })

  const deleteMut = useMutation({
    mutationFn: () => questionPackagesService.destroy(pkgId),
    onSuccess: (res) => {
      toast.success(res.message ?? "Package dihapus")
      qc.invalidateQueries({ queryKey: [API_ENDPOINTS.QUESTION_PACKAGES.BASE] })
      setConfirmDeleteOpen(false)
      router.push("/question-packages")
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  })

  if (detailQuery.isLoading) return <p className="text-sm text-muted-foreground">Loading...</p>
  if (detailQuery.isError || !detailQuery.data) {
    return <p className="text-sm text-destructive">Gagal load package</p>
  }
  if (!item) return <p className="text-sm text-muted-foreground">Data tidak ditemukan</p>

  const nextActive = !item.is_active
  const nextLabel = nextActive ? "Aktifkan" : "Nonaktifkan"
  const busy = detailQuery.isFetching || statusMut.isPending || deleteMut.isPending

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold">Package #{item.id}</h1>
          <p className="text-sm text-muted-foreground">{item.name}</p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          Kembali
        </Button>
      </div>

      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <div className="text-muted-foreground">Nama</div>
            <div className="font-medium">{item.name}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Moodle Group</div>
            <div className="font-medium">{item.moodle_group_name}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Status</div>
            <div>
              {item.is_active ? (
                <Badge variant="secondary">Aktif</Badge>
              ) : (
                <Badge variant="outline">Nonaktif</Badge>
              )}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Updated</div>
            <div className="font-medium">{new Date(item.updated_at).toLocaleString()}</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">Created: {new Date(item.created_at).toLocaleString()}</Badge>
        </div>
      </Card>

      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-sm font-semibold">Aksi</div>
            <div className="text-sm text-muted-foreground">
              Ubah status atau hapus package
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={item.is_active ? "destructive" : "default"}
              disabled={busy}
              onClick={() => setConfirmStatusOpen(true)}
            >
              {nextLabel}
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => setConfirmDeleteOpen(true)}
              className="text-destructive border-destructive/40 hover:bg-destructive/10"
            >
              Hapus Package
            </Button>
          </div>
        </div>

        <Separator />

        <div className="text-sm text-muted-foreground">
          Perubahan status akan langsung mempengaruhi package di tabel list.
        </div>
      </Card>

      <Dialog open={confirmStatusOpen} onOpenChange={setConfirmStatusOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi</DialogTitle>
          </DialogHeader>

          <div className="text-sm">
            Apakah anda yakin ingin{" "}
            <span className="font-semibold">
              {nextActive ? "mengaktifkan" : "menonaktifkan"}
            </span>{" "}
            package <span className="font-semibold">{item.name}</span>?
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmStatusOpen(false)}
              disabled={statusMut.isPending}
            >
              Batal
            </Button>

            <Button
              type="button"
              variant={nextActive ? "default" : "destructive"}
              onClick={() => statusMut.mutate(nextActive)}
              disabled={statusMut.isPending}
            >
              {statusMut.isPending ? "Memproses..." : "Ya, lanjutkan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi</DialogTitle>
          </DialogHeader>

          <div className="text-sm">
            Apakah anda yakin ingin{" "}
            <span className="font-semibold text-destructive">menghapus</span>{" "}
            package <span className="font-semibold">{item.name}</span>?
            <div className="mt-2 text-xs text-muted-foreground">
              Tindakan ini tidak bisa dibatalkan.
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmDeleteOpen(false)}
              disabled={deleteMut.isPending}
            >
              Batal
            </Button>

            <Button
              type="button"
              variant="destructive"
              onClick={() => deleteMut.mutate()}
              disabled={deleteMut.isPending}
            >
              {deleteMut.isPending ? "Menghapus..." : "Ya, hapus"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
