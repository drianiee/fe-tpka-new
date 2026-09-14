"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { KeyRound } from "lucide-react";

import { operatorsService } from "@/lib/services/operators.service";
import { getApiErrorMessage } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z
  .object({
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

export function ChangeOperatorPasswordDialog({
  operatorId,
  operatorName,
  disabled = false,
}: {
  operatorId: number | string;
  operatorName: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", password_confirmation: "" },
    mode: "onSubmit",
  });

  const mutation = useMutation({
    mutationFn: (v: FormValues) => operatorsService.updatePassword(operatorId, v),
    onSuccess: (res) => {
      toast.success(res.message ?? "Password operator diperbarui");
      setOpen(false);
      form.reset();
    },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e)),
  });

  const busy = mutation.isPending;
  const errors = form.formState.errors;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) form.reset();
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline" disabled={disabled} className="gap-2">
          <KeyRound className="h-4 w-4" />
          Ubah Password
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ubah Password Operator</DialogTitle>
          <DialogDescription>
            Password baru untuk <span className="font-medium text-foreground">{operatorName}</span>.
            Sesi login operator yang sedang aktif akan diputus.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
        >
          <div className="space-y-2">
            <Label htmlFor="op-new-password">Password Baru</Label>
            <Input
              id="op-new-password"
              type="password"
              placeholder="Minimal 8 karakter"
              autoComplete="new-password"
              disabled={busy}
              {...form.register("password")}
            />
            {errors.password?.message ? (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Gunakan minimal 8 karakter, 1 huruf besar, dan 1 angka.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="op-new-password-confirmation">Konfirmasi Password</Label>
            <Input
              id="op-new-password-confirmation"
              type="password"
              placeholder="Ulangi password baru"
              autoComplete="new-password"
              disabled={busy}
              {...form.register("password_confirmation")}
            />
            {errors.password_confirmation?.message ? (
              <p className="text-sm text-destructive">{errors.password_confirmation.message}</p>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" disabled={busy} onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Menyimpan..." : "Simpan Password"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
