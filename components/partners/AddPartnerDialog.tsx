"use client";

import * as React from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { partnersService } from "@/lib/services/partners.service";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { getApiErrorMessage } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/* ================= VALIDATION ================= */

const schema = z.object({
  name: z.string().trim().min(1, "Nama mitra wajib diisi"),
  contact_name: z.string().trim().optional(),

  // optional; empty string dianggap tidak diisi
  contact_email: z
    .union([z.string().trim().email("Email tidak valid"), z.literal("")])
    .optional(),

  contact_phone: z.string().trim().optional(),
});

type FormValues = z.infer<typeof schema>;

function toOptionalTrimmed(v?: string) {
  const t = (v ?? "").trim();
  return t.length ? t : undefined;
}

/* ================= COMPONENT ================= */

export function AddPartnerDialog() {
  const [open, setOpen] = React.useState(false);
  const qc = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      contact_name: "",
      contact_email: "",
      contact_phone: "",
    },
    mode: "onSubmit",
  });

  const createMut = useMutation({
    mutationFn: (v: FormValues) =>
      partnersService.create({
        name: v.name.trim(),
        contact_name: toOptionalTrimmed(v.contact_name),
        contact_email:
          v.contact_email && v.contact_email !== ""
            ? v.contact_email.trim()
            : undefined,
        contact_phone: toOptionalTrimmed(v.contact_phone),
      }),
    onSuccess: (res) => {
      toast.success(res.message || "Mitra berhasil dibuat");
      qc.invalidateQueries({ queryKey: [API_ENDPOINTS.PARTNERS.BASE] });
      setOpen(false);
      form.reset();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const busy = createMut.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) form.reset();
      }}
    >
      <DialogTrigger asChild>
        <Button>+ Mitra</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tambah Mitra</DialogTitle>
          <DialogDescription>
            Isi informasi mitra dan kontak PIC (opsional). Anda bisa mengubahnya
            kapan saja.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-6"
          onSubmit={form.handleSubmit((v) => createMut.mutate(v))}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="partner-name">Nama Mitra</Label>
              </div>
              <Input
                id="partner-name"
                placeholder="Contoh: Mitra Kita"
                disabled={busy}
                {...form.register("name")}
              />
              {form.formState.errors.name ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.name.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="rounded-lg border p-4 space-y-4">
            <div className="space-y-1">
              <div className="text-sm font-medium">Kontak PIC</div>
              <div className="text-xs text-muted-foreground">
                Opsional, isi jika ada kontak penanggung jawab.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pic-name">Nama PIC</Label>
                <Input
                  id="pic-name"
                  placeholder="Contoh: Indah Kusuma"
                  disabled={busy}
                  {...form.register("contact_name")}
                />
                {form.formState.errors.contact_name ? (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.contact_name.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="pic-phone">Nomor PIC</Label>
                <Input
                  id="pic-phone"
                  placeholder="Contoh: 08123456789"
                  disabled={busy}
                  {...form.register("contact_phone")}
                />
                {form.formState.errors.contact_phone ? (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.contact_phone.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="pic-email">Email PIC</Label>
                <Input
                  id="pic-email"
                  type="email"
                  placeholder="Contoh: mitra@mitra.co.id"
                  disabled={busy}
                  {...form.register("contact_email")}
                />
                {form.formState.errors.contact_email ? (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.contact_email.message}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Kosongkan jika tidak ada email.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => {
                setOpen(false);
                form.reset();
              }}
            >
              Batal
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
