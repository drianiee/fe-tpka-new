"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMutation, useQuery } from "@tanstack/react-query"
import { Plus, RefreshCw } from "lucide-react"

import { certificateService } from "@/lib/services/certificate.service"
import type { Certificate, CreateCertificatePayload } from "@/lib/types/certificate"
import { API_ENDPOINTS } from "@/lib/api/endpoints"
import { getApiErrorMessage } from "@/lib/api/errors"

import { PageHeaderLayout } from "@/components/layouts/PageHeaderLayout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DataTable, type DataTableColumn } from "@/components/common/DataTable"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

export default function AdminCertificatesPage() {
  const router = useRouter()

  const [q, setQ] = React.useState("")
  const [openCreate, setOpenCreate] = React.useState(false)

  const [form, setForm] = React.useState<CreateCertificatePayload>({
    name: "",
    period: "1",
    year: 2026,
    sign_name: "",
    sign_nip: "",
    letter_prefix: "001/TPKA/I/2026",
    template: null as unknown as File,
    is_active: 1,
  })

  const listQ = useQuery({
    queryKey: [API_ENDPOINTS.ADMIN.CERTIFICATES.ROOT],
    queryFn: () => certificateService.list(),
    staleTime: 60_000,
  })

  const createM = useMutation({
    mutationFn: (payload: CreateCertificatePayload) => certificateService.create(payload),
    onSuccess: (res) => {
      setOpenCreate(false)
      router.push(`/dashboard/admin/certificates/${res.data.id}`)
    },
  })

  const rows = React.useMemo(() => {
    const src = listQ.data ?? []
    const qq = q.trim().toLowerCase()
    if (!qq) return src

    return src.filter((r) => {
      const text = `${r.name} ${r.year} ${r.period} ${r.letter_prefix} ${r.sign_name} ${r.sign_nip}`.toLowerCase()
      return text.includes(qq)
    })
  }, [listQ.data, q])

  const cols = React.useMemo<DataTableColumn<Certificate>[]>(() => {
    return [
      {
        key: "no",
        header: "No",
        headerClassName: "w-16 text-center",
        className: "py-4 px-2 text-center",
        cell: (_row, idx) => idx + 1,
      },
      {
        key: "name",
        header: "Nama",
        headerClassName: "w-[340px]",
        className: "py-4 px-2",
        cell: (row) => (
          <div className="space-y-0.5">
            <div className="font-medium">{row.name}</div>
            <div className="text-xs text-muted-foreground">
              Periode {row.period} • {row.year}
            </div>
          </div>
        ),
      },
      {
        key: "active",
        header: "Aktif",
        headerClassName: "w-28 text-center",
        className: "py-4 px-2 text-center",
        cell: (row) => (
          <div className="flex justify-center">
            <Badge variant={row.is_active ? "success" : "muted"}>
              {row.is_active ? "Aktif" : "Nonaktif"}
            </Badge>
          </div>
        ),
      },
      {
        key: "letter_prefix",
        header: "Prefix Surat",
        headerClassName: "w-64",
        className: "py-4 px-2",
        cell: (row) => row.letter_prefix,
      },
      {
        key: "signer",
        header: "Penandatangan",
        headerClassName: "w-72",
        className: "py-4 px-2",
        cell: (row) => (
          <div className="space-y-0.5">
            <div className="font-medium">{row.sign_name}</div>
            <div className="text-xs text-muted-foreground">NIP: {row.sign_nip}</div>
          </div>
        ),
      },
      {
        key: "action",
        header: "Aksi",
        headerClassName: "w-28 text-center",
        className: "py-4 px-2 text-center",
        cell: (row) => (
          <Button asChild size="sm" variant="outline">
            <Link href={`/dashboard/admin/certificates/${row.id}`}>Atur</Link>
          </Button>
        ),
      },
    ]
  }, [])

  const busy = listQ.isFetching || createM.isPending

  return (
    <PageHeaderLayout
      title="Certificate"
      description="Kelola template sertifikat dan atur layout (react-konva)."
      showBack={false}
    >
      <div className="h-full min-h-0 rounded-xl border overflow-hidden flex flex-col bg-white">
        <div className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="flex-1">
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cari… (nama/tahun/periode/prefix/penandatangan)"
                disabled={busy}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" disabled={busy} onClick={() => listQ.refetch()} title="Refresh">
                <RefreshCw className="h-4 w-4" />
              </Button>

              <Button onClick={() => setOpenCreate(true)} disabled={busy}>
                <Plus className="h-4 w-4" />
                Tambah
              </Button>
            </div>
          </div>

          {listQ.isError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {getApiErrorMessage(listQ.error)}
            </div>
          ) : null}

          <div className="text-xs text-muted-foreground">
            Menampilkan <span className="font-medium text-foreground">{rows.length}</span> sertifikat
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-auto border-t">
          <DataTable
            columns={cols}
            rows={rows}
            getRowKey={(r) => r.id}
            loading={listQ.isLoading}
            emptyText="Belum ada sertifikat"
            stickyHeader
            onRowClick={(r) => router.push(`/dashboard/admin/certificates/${r.id}`)}
            getRowClassName={() => "cursor-pointer hover:bg-muted/50"}
          />
        </div>
      </div>

      {/* Create dialog */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Tambah Sertifikat</DialogTitle>
            <DialogDescription>Setelah dibuat, langsung diarahkan ke halaman canvas.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1 sm:col-span-2">
              <div className="text-xs text-muted-foreground">Nama</div>
              <Input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                disabled={createM.isPending}
                placeholder="Sertifikat Periode 3"
              />
            </div>

            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Periode</div>
              <Input
                value={String(form.period)}
                onChange={(e) => setForm((p) => ({ ...p, period: e.target.value }))}
                disabled={createM.isPending}
                placeholder="3"
              />
            </div>

            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Tahun</div>
              <Input
                value={String(form.year)}
                onChange={(e) => setForm((p) => ({ ...p, year: e.target.value }))}
                disabled={createM.isPending}
                placeholder="2026"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <div className="text-xs text-muted-foreground">Nama Penandatangan</div>
              <Input
                value={form.sign_name}
                onChange={(e) => setForm((p) => ({ ...p, sign_name: e.target.value }))}
                disabled={createM.isPending}
              />
            </div>

            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">NIP</div>
              <Input
                value={form.sign_nip}
                onChange={(e) => setForm((p) => ({ ...p, sign_nip: e.target.value }))}
                disabled={createM.isPending}
              />
            </div>

            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Letter Prefix</div>
              <Input
                value={form.letter_prefix}
                onChange={(e) => setForm((p) => ({ ...p, letter_prefix: e.target.value }))}
                disabled={createM.isPending}
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <div className="text-xs text-muted-foreground">Template (PNG/JPG)</div>
              <Input
                type="file"
                accept="image/*"
                disabled={createM.isPending}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) setForm((p) => ({ ...p, template: f }))
                }}
              />
            </div>
          </div>

          {createM.isError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {getApiErrorMessage(createM.error)}
            </div>
          ) : null}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpenCreate(false)} disabled={createM.isPending}>
              Batal
            </Button>
            <Button
              onClick={() => createM.mutate(form)}
              disabled={
                createM.isPending ||
                !form.name ||
                !form.period ||
                !String(form.year) ||
                !form.sign_name ||
                !form.sign_nip ||
                !form.letter_prefix ||
                !form.template
              }
            >
              Simpan & Atur Layout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageHeaderLayout>
  )
}
