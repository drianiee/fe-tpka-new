"use client";

import * as React from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { getApiErrorMessage } from "@/lib/api/errors";
import { questionPackagesService } from "@/lib/services/questionPackages.service";
import type { CreateQuestionPackageRequest } from "@/lib/types/question-packages";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const schema = z.object({
  name: z.string().trim().min(1, "Nama paket wajib diisi"),
  moodle_group_name: z.string().trim().min(1, "Moodle group name wajib diisi"),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

function toTrimmed(v: string) {
  return v.trim();
}

export function AddQuestionPackageDialog() {
  const [open, setOpen] = React.useState(false);
  const qc = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      moodle_group_name: "",
      is_active: true,
    },
    mode: "onSubmit",
  });

  const createMut = useMutation({
    mutationFn: (v: FormValues) => {
      const payload: CreateQuestionPackageRequest = {
        name: toTrimmed(v.name),
        moodle_group_name: toTrimmed(v.moodle_group_name),
        is_active: v.is_active,
      };
      return questionPackagesService.create(payload);
    },
    onSuccess: (res) => {
      toast.success(res.message ?? "Paket soal berhasil dibuat");
      qc.invalidateQueries({
        queryKey: [API_ENDPOINTS.QUESTION_PACKAGES.BASE],
      });
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
        <Button>+ Tambah Paket</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Tambah Paket Soal</DialogTitle>
          <DialogDescription>
            Buat paket soal baru dan tentukan group Moodle untuk penempatan
            peserta.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-6"
          onSubmit={form.handleSubmit((v) => createMut.mutate(v))}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="pkg-name">Nama Paket</Label>
              </div>

              <Input
                id="pkg-name"
                placeholder="Contoh: Paket 2"
                disabled={busy}
                {...form.register("name")}
              />

              {form.formState.errors.name ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.name.message}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Nama yang tampil di dashboard & tabel jadwal.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="pkg-moodle-group">Moodle Group Name</Label>
              </div>

              <Input
                id="pkg-moodle-group"
                placeholder="Contoh: Paket 2"
                disabled={busy}
                {...form.register("moodle_group_name")}
              />

              {form.formState.errors.moodle_group_name ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.moodle_group_name.message}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Pastikan persis sama dengan nama group di Moodle
                  (case-sensitive).
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Status Paket</Label>
              <Controller
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <Select
                    value={field.value ? "active" : "inactive"}
                    onValueChange={(v) => field.onChange(v === "active")}
                    disabled={busy}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Aktif</SelectItem>
                      <SelectItem value="inactive">Nonaktif</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />

              <p className="text-xs text-muted-foreground">
                Paket nonaktif tetap tersimpan, tapi bisa disembunyikan dari
                pemakaian.
              </p>
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
