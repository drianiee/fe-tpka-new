// components/operators/AddOperatorDialog.tsx
"use client";

import * as React from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { usersService } from "@/lib/services/users.service";
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

const schema = z
  .object({
    name: z.string().trim().min(1, "Nama wajib diisi"),
    email: z.string().trim().min(1, "Email wajib diisi").email("Email tidak valid"),
    password: z
      .string()
      .min(8, "Password minimal 8 karakter")
      .refine((v) => /[A-Z]/.test(v), "Password harus mengandung minimal 1 huruf besar")
      .refine((v) => /[0-9]/.test(v), "Password harus mengandung minimal 1 angka"),
    password_confirmation: z.string().min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((v) => v.password === v.password_confirmation, {
    message: "Konfirmasi password tidak sama",
    path: ["password_confirmation"],
  });

type FormValues = z.infer<typeof schema>;

function toTrimmed(v: string) {
  return v.trim();
}

export function AddOperatorDialog() {
  const [open, setOpen] = React.useState(false);
  const qc = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      password_confirmation: "",
    },
    mode: "onSubmit",
  });

  const createMut = useMutation({
    mutationFn: (v: FormValues) =>
      usersService.createOperator({
        name: toTrimmed(v.name),
        email: toTrimmed(v.email),
        password: v.password,
        password_confirmation: v.password_confirmation,
      }),
    onSuccess: (res) => {
      toast.success(res.message ?? "Operator berhasil dibuat");
      qc.invalidateQueries({ queryKey: [API_ENDPOINTS.ADMIN.OPERATORS] });
      setOpen(false);
      form.reset();
    },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e)),
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
        <Button>+ Tambah Operator</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tambah Operator</DialogTitle>
          <DialogDescription>
            Buat akun operator untuk mengelola jadwal dan peserta.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-6"
          onSubmit={form.handleSubmit((v) => createMut.mutate(v))}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="op-name">
                  Nama
                </Label>
              </div>

              <Input
                id="op-name"
                placeholder="Contoh: Operator Baru"
                disabled={busy}
                {...form.register("name")}
              />

              {form.formState.errors.name?.message ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.name.message}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Nama ini akan tampil di daftar operator.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="op-email">
                  Email
                </Label>
              </div>

              <Input
                id="op-email"
                type="email"
                placeholder="Contoh: opbaru@tpka.com"
                disabled={busy}
                {...form.register("email")}
              />

              {form.formState.errors.email?.message ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.email.message}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Pastikan email aktif untuk login.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="op-password">
                  Password
                </Label>
              </div>

              <Input
                id="op-password"
                type="password"
                placeholder="Minimal 8 karakter"
                disabled={busy}
                {...form.register("password")}
              />

              {form.formState.errors.password?.message ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.password.message}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Gunakan minimal 8 karakter, 1 huruf besar, dan 1 angka.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="op-password-confirmation">Konfirmasi Password</Label>
              <Input
                id="op-password-confirmation"
                type="password"
                placeholder="Ulangi password"
                disabled={busy}
                {...form.register("password_confirmation")}
              />
              {form.formState.errors.password_confirmation?.message ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.password_confirmation.message}
                </p>
              ) : null}
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
