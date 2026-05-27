// components/schedules/AddScheduleDialog.tsx
"use client"

import * as React from "react"
import { toast } from "sonner"
import { z } from "zod"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { schedulesService } from "@/lib/services/schedules.service"
import { API_ENDPOINTS } from "@/lib/api/endpoints"
import { getApiErrorMessage } from "@/lib/api/errors"
import { usePartnersQuery } from "@/lib/hooks/usePartnersQuery"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SearchableCombobox } from "@/components/common/SearchableCombobox"

const schema = z.object({
  date: z.string().min(1, "Tanggal wajib diisi"),
  start_time: z.string().min(1, "Jam mulai wajib diisi"),
  price: z
    .string()
    .min(1, "Harga wajib diisi")
    .refine((v) => !Number.isNaN(Number(v)), "Harga harus angka")
    .refine((v) => Number(v) >= 0, "Harga minimal 0"),
  is_partner: z.boolean(),
  partner_id: z.number().optional(),
  capacity: z
    .string()
    .min(1, "Kapasitas wajib diisi")
    .refine((v) => !Number.isNaN(Number(v)), "Kapasitas harus angka")
    .refine((v) => Number(v) >= 1, "Kapasitas minimal 1"),
  package_ids: z.array(z.number()),
})

type FormValues = z.infer<typeof schema>

export function AddScheduleDialog() {
  const [open, setOpen] = React.useState(false)
  const qc = useQueryClient()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: "",
      start_time: "",
      price: "150000",
      is_partner: false,
      partner_id: undefined,
      capacity: "50",
      package_ids: [],
    },
    mode: "onSubmit",
  })

  const isPartner = useWatch({ control: form.control, name: "is_partner" })

  const [partnerOpen, setPartnerOpen] = React.useState(false)
  const [partnerQuery, setPartnerQuery] = React.useState("")

  const { qPartners, partners } = usePartnersQuery({
    enabled: open && isPartner,
    q: partnerQuery,
  })

  React.useEffect(() => {
    if (!isPartner) {
      form.setValue("partner_id", undefined)
      form.setValue("package_ids", [])
      form.clearErrors(["partner_id", "package_ids"])
      setPartnerQuery("")
    }
  }, [isPartner, form])

  const createMut = useMutation({
    mutationFn: (v: FormValues) =>
      schedulesService.create({
        date: v.date,
        start_time: v.start_time,
        price: Number(v.price),
        capacity: Number(v.capacity),
        is_partner: v.is_partner,
        partner_id: v.is_partner ? v.partner_id : undefined,
        package_ids: v.is_partner ? v.package_ids : undefined,
      }),
    onSuccess: (res) => {
      toast.success(res.message ?? "Jadwal berhasil dibuat")
      qc.invalidateQueries({ queryKey: [API_ENDPOINTS.SCHEDULES.BASE] })
      setOpen(false)
      form.reset({
        date: "",
        start_time: "",
        price: "150000",
        is_partner: false,
        partner_id: undefined,
        capacity: "50",
        package_ids: [],
      })
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  })

  function onSubmit(v: FormValues) {
    if (v.is_partner && !v.partner_id) {
      form.setError("partner_id", {
        type: "manual",
        message: "Partner wajib dipilih untuk jadwal mitra",
      })
      return
    }

    createMut.mutate(v)
  }

  const fieldWrap = "space-y-1.5"
  const errorText = "text-sm text-destructive"
  const sectionTitle = "text-sm font-semibold"
  const sectionHint = "text-xs text-muted-foreground"

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) {
          form.reset({
            date: "",
            start_time: "",
            price: "150000",
            is_partner: false,
            partner_id: undefined,
            capacity: "50",
            package_ids: [],
          })
          form.clearErrors()
          setPartnerQuery("")
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>+ Jadwal</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tambah Jadwal</DialogTitle>
        </DialogHeader>

        <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="rounded-lg border bg-white p-4 space-y-4">
            <div className="space-y-1">
              <div className={sectionTitle}>Informasi Jadwal</div>
              <div className={sectionHint}>Isi tanggal, jam mulai, harga, dan kapasitas.</div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className={fieldWrap}>
                <Label>Tanggal</Label>
                <Input type="date" {...form.register("date")} />
                {form.formState.errors.date ? (
                  <p className={errorText}>{form.formState.errors.date.message}</p>
                ) : null}
              </div>

              <div className={fieldWrap}>
                <Label>Jam Mulai</Label>
                <Input type="time" {...form.register("start_time")} />
                {form.formState.errors.start_time ? (
                  <p className={errorText}>{form.formState.errors.start_time.message}</p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className={fieldWrap}>
                <Label>Harga</Label>
                <Input type="number" inputMode="numeric" {...form.register("price")} />
                {form.formState.errors.price ? (
                  <p className={errorText}>{form.formState.errors.price.message}</p>
                ) : null}
              </div>

              <div className={fieldWrap}>
                <Label>Kapasitas</Label>
                <Input type="number" inputMode="numeric" {...form.register("capacity")} />
                {form.formState.errors.capacity ? (
                  <p className={errorText}>{form.formState.errors.capacity.message}</p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-white p-4 space-y-4">
            <div className="space-y-1">
              <div className={sectionTitle}>Tipe Jadwal</div>
              <div className={sectionHint}>Atur apakah jadwal ini untuk mitra.</div>
            </div>

            <div className={fieldWrap}>
              <Label>Mitra?</Label>
              <Controller
                control={form.control}
                name="is_partner"
                render={({ field }) => (
                  <Select value={field.value ? "yes" : "no"} onValueChange={(v) => field.onChange(v === "yes")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">Tidak</SelectItem>
                      <SelectItem value="yes">Ya</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {isPartner ? (
              <div className={fieldWrap}>
                <Label>Partner</Label>
                <Controller
                  control={form.control}
                  name="partner_id"
                  render={({ field }) => (
                    <SearchableCombobox
                      value={field.value ?? null}
                      onChange={(val) => {
                        field.onChange(val)
                        form.clearErrors("partner_id")
                      }}
                      options={partners.map((p) => ({ id: p.id, label: p.name }))}
                      open={partnerOpen}
                      onOpenChange={setPartnerOpen}
                      search={partnerQuery}
                      onSearchChange={setPartnerQuery}
                      loading={qPartners.isLoading}
                      placeholder="Pilih partner"
                    />
                  )}
                />
                {form.formState.errors.partner_id ? (
                  <p className={errorText}>{String(form.formState.errors.partner_id.message)}</p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={createMut.isPending}>
              Batal
            </Button>
            <Button type="submit" disabled={createMut.isPending}>
              {createMut.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
