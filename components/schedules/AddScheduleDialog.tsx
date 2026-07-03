"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Controller,
  useForm,
  useWatch,
  type UseFormRegisterReturn,
} from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { getApiErrorMessage } from "@/lib/api/errors";
import { partnersService } from "@/lib/services/partners.service";
import { schedulesService } from "@/lib/services/schedules.service";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DEFAULT_SCHEDULE_PRICE = 150000;

const schema = z
  .object({
    is_partner: z.boolean(),
    partner_id: z.number().nullable(),
    start_at: z.string().min(1, "Mulai ujian wajib diisi"),
    registration_start_at: z.string().min(1, "Buka registrasi wajib diisi"),
    price: z.number().min(0),
    quota: z.number().int().min(1),
  })
  .refine(
    (v) =>
      new Date(v.registration_start_at).getTime() <=
      new Date(v.start_at).getTime(),
    {
      message: "Buka registrasi tidak boleh setelah mulai ujian",
      path: ["registration_start_at"],
    },
  )
  .refine((v) => !v.is_partner || Boolean(v.partner_id), {
    message: "Mitra wajib dipilih untuk jadwal kemitraan",
    path: ["partner_id"],
  });

type Values = z.infer<typeof schema>;

function formatNumberInput(value: number | null | undefined) {
  const numeric = Number(value ?? 0);

  return new Intl.NumberFormat("id-ID").format(
    Number.isFinite(numeric) ? numeric : 0,
  );
}

function Field({
  label,
  type,
  register,
  error,
  helper,
  disabled,
}: {
  label: string;
  type: string;
  register: UseFormRegisterReturn;
  error?: string;
  helper?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type={type} disabled={disabled} {...register} />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {!error && helper ? (
        <p className="text-sm text-muted-foreground">{helper}</p>
      ) : null}
    </div>
  );
}

export function AddScheduleDialog() {
  const [open, setOpen] = React.useState(false);
  const qc = useQueryClient();
  const defaultFormValues = React.useMemo<Values>(
    () => ({
      is_partner: false,
      partner_id: null,
      start_at: "",
      registration_start_at: "",
      price: DEFAULT_SCHEDULE_PRICE,
      quota: 50,
    }),
    [],
  );

  const partnersQuery = useQuery({
    queryKey: [API_ENDPOINTS.PARTNERS.BASE, "schedule-options"],
    queryFn: () => partnersService.list({ per_page: 100 }),
    enabled: open,
  });

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: defaultFormValues,
  });

  const isPartner = useWatch({
    control: form.control,
    name: "is_partner",
  });

  React.useEffect(() => {
    if (isPartner) {
      form.setValue("price", 0);
      return;
    }

    form.setValue("partner_id", null);
    form.setValue("price", DEFAULT_SCHEDULE_PRICE);
  }, [form, isPartner]);

  const resetForm = React.useCallback(() => {
    form.reset(defaultFormValues);
  }, [defaultFormValues, form]);

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);

      if (!nextOpen) {
        resetForm();
      }
    },
    [resetForm],
  );

  const mutation = useMutation({
    mutationFn: (values: Values) =>
      schedulesService.create({
        ...values,
        partner_id: values.is_partner ? values.partner_id : null,
        price: values.is_partner ? 0 : values.price,
      }),
    onSuccess: (res) => {
      toast.success(res.message ?? "Jadwal dibuat");
      qc.invalidateQueries({ queryKey: [API_ENDPOINTS.SCHEDULES.BASE] });
      setOpen(false);
      resetForm();
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const errors = form.formState.errors;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>+ Jadwal</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Tambah Jadwal Ujian</DialogTitle>
        </DialogHeader>

        <form
          className="grid gap-4"
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Jenis Jadwal</Label>
              <Controller
                control={form.control}
                name="is_partner"
                render={({ field }) => (
                  <Select
                    value={field.value ? "partner" : "public"}
                    onValueChange={(value) =>
                      field.onChange(value === "partner")
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih jenis jadwal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Jadwal Umum</SelectItem>
                      <SelectItem value="partner">Jadwal Mitra</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {isPartner ? (
              <div className="space-y-2">
                <Label>Nama Mitra</Label>
                <Controller
                  control={form.control}
                  name="partner_id"
                  render={({ field }) => (
                    <Select
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(value) => field.onChange(Number(value))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih mitra" />
                      </SelectTrigger>
                      <SelectContent>
                        {partnersQuery.data?.data.map((partner) => (
                          <SelectItem
                            key={partner.id}
                            value={String(partner.id)}
                          >
                            {partner.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.partner_id ? (
                  <p className="text-sm text-destructive">
                    {errors.partner_id.message}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Mulai Ujian"
              type="datetime-local"
              register={form.register("start_at")}
              error={errors.start_at?.message}
            />
            <Field
              label="Buka Registrasi"
              type="datetime-local"
              register={form.register("registration_start_at")}
              error={errors.registration_start_at?.message}
              // helper="Tutup registrasi akan otomatis diset 30 menit sebelum ujian dimulai."
            />
            <div className="space-y-2">
              <Label>Harga</Label>
              <Controller
                control={form.control}
                name="price"
                render={({ field }) => (
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={formatNumberInput(field.value)}
                    onChange={(event) => {
                      const digits = event.target.value.replace(/\D/g, "");
                      field.onChange(digits === "" ? 0 : Number(digits));
                    }}
                    disabled={isPartner}
                  />
                )}
              />
              {errors.price ? (
                <p className="text-sm text-destructive">
                  {errors.price.message}
                </p>
              ) : null}
              {!errors.price && isPartner ? (
                <p className="text-sm text-muted-foreground">
                  Jadwal mitra tidak memakai pembayaran peserta.
                </p>
              ) : null}
            </div>
            <Field
              label="Kuota"
              type="number"
              register={form.register("quota", { valueAsNumber: true })}
              error={errors.quota?.message}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Batal
            </Button>
            <Button disabled={mutation.isPending}>
              {mutation.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
