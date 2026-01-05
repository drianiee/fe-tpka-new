"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { z } from "zod"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { schedulesService, type PartnerImportResponse } from "@/lib/services/schedules.service"
import type { ScheduleDetail, ScheduleParticipant } from "@/lib/types/schedules"
import { API_ENDPOINTS } from "@/lib/api/endpoints"
import { getApiErrorMessage } from "@/lib/api/errors"
import { formatRupiah, hhmm } from "@/lib/utils/format"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const importSchema = z.object({
  file: z
    .instanceof(File, { message: "File wajib di-upload" })
    .refine((f) => /\.(xlsx|xls)$/i.test(f.name), "File harus .xlsx / .xls"),
})

type ImportForm = z.infer<typeof importSchema>

function importSummaryText(res: PartnerImportResponse) {
  const s = res.summary
  if (!s) return ""
  const parts: string[] = []
  if (typeof s.attached_to_schedule === "number") parts.push(`Terpasang: ${s.attached_to_schedule}`)
  if (typeof s.created_users === "number") parts.push(`User dibuat: ${s.created_users}`)
  if (typeof s.sent_invitations === "number") parts.push(`Invitation: ${s.sent_invitations}`)
  if (typeof s.skipped_rows === "number") parts.push(`Skip: ${s.skipped_rows}`)
  return parts.join(" • ")
}

function scoreCell(v?: number | null) {
  if (v === null || v === undefined) return "-"
  return String(v)
}

function normalizeStatus(status?: string | null) {
  return (status ?? "").trim().toLowerCase()
}

function statusVariant(status?: string | null): "muted" | "warning" | "success" {
  const s = normalizeStatus(status)
  if (!s) return "muted"
  if (s === "peserta belum terdaftar") return "muted"
  if (s === "peserta terdaftar") return "success"
  return "muted"
}

function statusLabel(status?: string | null) {
  const s = normalizeStatus(status)
  if (!s) return "-"
  if (s === "peserta belum terdaftar") return "Peserta Belum Terdaftar"
  if (s === "peserta terdaftar") return "Peserta Terdaftar"
  return status ?? "-"
}

export default function AdminScheduleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()

  const scheduleId = Number(id)
  const [importOpen, setImportOpen] = React.useState(false)

  const detailQuery = useQuery({
    queryKey: [API_ENDPOINTS.SCHEDULES.DETAIL(scheduleId)],
    queryFn: () => schedulesService.detail(scheduleId),
    enabled: Number.isFinite(scheduleId),
  })

  const importForm = useForm<ImportForm>({
    resolver: zodResolver(importSchema),
    defaultValues: {},
    mode: "onSubmit",
  })

  const importMut = useMutation({
    mutationFn: (file: File) => schedulesService.partnerImport(scheduleId, file),
    onSuccess: (res) => {
      const sum = importSummaryText(res)
      toast.success(sum ? `${res.message} (${sum})` : res.message ?? "Import berhasil")
      qc.invalidateQueries({ queryKey: [API_ENDPOINTS.SCHEDULES.DETAIL(scheduleId)] })
      importForm.reset()
      setImportOpen(false)
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  })

  if (detailQuery.isLoading) return <p className="text-sm text-muted-foreground">Loading...</p>
  if (detailQuery.isError || !detailQuery.data) return <p className="text-sm text-destructive">Gagal load schedule</p>

  const d: ScheduleDetail = detailQuery.data
  const participants: ScheduleParticipant[] = d.participants ?? []
  const packages = d.packages ?? []
  const isPartnerSchedule = Boolean(d.partner?.id)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold">Schedule #{d.id}</h1>
          <p className="text-sm text-muted-foreground">
            {d.date} • {hhmm(d.start_time)} - {hhmm(d.end_time)}
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          Kembali
        </Button>
      </div>

      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
          <div>
            <div className="text-muted-foreground">Harga</div>
            <div>{formatRupiah(d.price)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Kapasitas</div>
            <div>{d.capacity}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Peserta</div>
            <div>{d.current_participants}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Partner</div>
            <div>{d.partner?.name ?? "-"}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Status</div>
            <Badge variant={statusVariant(d.status)}>{statusLabel(d.status)}</Badge>
          </div>
        </div>

        <div>
          <div className="text-muted-foreground text-sm mb-1">Paket Soal</div>
          {packages.length === 0 ? (
            <span className="text-sm text-muted-foreground">-</span>
          ) : (
            <div className="flex flex-wrap gap-1">
              {packages.map((p) => (
                <Badge key={p.id} variant="outline">
                  {p.name}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {d.moodle_course_id ? <Badge variant="secondary">Course: {d.moodle_course_id}</Badge> : null}
          {d.moodle_quiz_id ? <Badge variant="secondary">Quiz: {d.moodle_quiz_id}</Badge> : null}
          {d.moodle_quiz_cmid ? <Badge variant="secondary">CMID: {d.moodle_quiz_cmid}</Badge> : null}
          {d.quiz_url ? (
            <Button asChild size="sm" variant="outline">
              <a href={d.quiz_url} target="_blank" rel="noreferrer">
                Buka Quiz
              </a>
            </Button>
          ) : null}
        </div>
      </Card>

      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-sm font-semibold">Peserta</div>
            <div className="text-sm text-muted-foreground">Total: {participants.length}</div>
          </div>

          {isPartnerSchedule ? (
            <Dialog open={importOpen} onOpenChange={setImportOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary">Import Peserta Mitra (XLSX)</Button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Import Peserta Mitra</DialogTitle>
                </DialogHeader>

                <form className="space-y-4" onSubmit={importForm.handleSubmit((v) => importMut.mutate(v.file))}>
                  <div className="space-y-2">
                    <Label>File XLSX</Label>

                    <Controller
                      control={importForm.control}
                      name="file"
                      render={({ field }) => (
                        <Input
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) field.onChange(file)
                          }}
                        />
                      )}
                    />

                    {importForm.formState.errors.file ? (
                      <p className="text-sm text-destructive">{importForm.formState.errors.file.message}</p>
                    ) : null}
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setImportOpen(false)}
                      disabled={importMut.isPending}
                    >
                      Batal
                    </Button>
                    <Button type="submit" disabled={importMut.isPending}>
                      {importMut.isPending ? "Importing..." : "Import"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          ) : null}
        </div>

        <Separator />

        <div className="rounded-md border">
          <Table className="table-fixed w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="w-11">No</TableHead>
                <TableHead className="w-14">ID</TableHead>
                <TableHead className="w-35">Nama</TableHead>
                <TableHead className="w-42.5">Email</TableHead>
                <TableHead className="w-32.5">Status</TableHead>

                <TableHead className="w-14.5 text-center">Verbal</TableHead>
                <TableHead className="w-14.5 text-center">Kuantitatif</TableHead>
                <TableHead className="w-14.5 text-center">Logika</TableHead>
                <TableHead className="w-14.5 text-center">Spatial</TableHead>
                <TableHead className="w-14.5 text-center">Total</TableHead>

                <TableHead className="w-30 text-right">Sertifikat</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {participants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="py-10 text-center text-sm text-muted-foreground">
                    Belum ada peserta
                  </TableCell>
                </TableRow>
              ) : (
                participants.map((p, i) => {
                  const s = p.scores ?? null
                  const certUrl = p.certificate_download_url ?? null

                  return (
                    <TableRow key={p.id}>
                      <TableCell className="whitespace-nowrap">{i + 1}</TableCell>
                      <TableCell className="whitespace-nowrap">{p.id}</TableCell>

                      <TableCell className="truncate font-medium" title={p.name}>
                        {p.name}
                      </TableCell>

                      <TableCell className="truncate" title={p.email}>
                        {p.email}
                      </TableCell>

                      <TableCell className="truncate" title={p.status}>
                        <Badge variant={statusVariant(p.status)} className="capitalize">
                          {statusLabel(p.status)}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-center whitespace-nowrap">{scoreCell(s?.verbal)}</TableCell>
                      <TableCell className="text-center whitespace-nowrap">{scoreCell(s?.kuantitatif)}</TableCell>
                      <TableCell className="text-center whitespace-nowrap">{scoreCell(s?.logika)}</TableCell>
                      <TableCell className="text-center whitespace-nowrap">{scoreCell(s?.spasial)}</TableCell>
                      <TableCell className="text-center whitespace-nowrap">{scoreCell(s?.total)}</TableCell>

                      <TableCell className="text-right whitespace-nowrap">
                        {certUrl ? (
                          <Button asChild size="sm" variant="outline">
                            <a href={certUrl} target="_blank" rel="noreferrer">
                              Download
                            </a>
                          </Button>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
