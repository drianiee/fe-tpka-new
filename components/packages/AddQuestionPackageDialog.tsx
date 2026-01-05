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
  name: z.string().min(1, "Nama wajib diisi"),
  moodle_group_name: z.string().min(1, "Moodle group name wajib diisi"),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

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
  });

  const createMut = useMutation({
    mutationFn: (v: FormValues) => {
      const payload: CreateQuestionPackageRequest = {
        name: v.name,
        moodle_group_name: v.moodle_group_name,
        is_active: v.is_active,
      };
      return questionPackagesService.create(payload);
    },
    onSuccess: (res) => {
      toast.success(res.message ?? "Question package dibuat");
      qc.invalidateQueries({ queryKey: [API_ENDPOINTS.QUESTION_PACKAGES.BASE] });
      setOpen(false);
      form.reset();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>+ Add Package</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Tambah Paket Soal</DialogTitle>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((v) => createMut.mutate(v))}
        >
          <div className="space-y-1">
            <Label>Nama Paket</Label>
            <Input placeholder="Contoh: Paket 2" {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label>Moodle Group Name</Label>
            <Input
              placeholder="Contoh: Paket 2"
              {...form.register("moodle_group_name")}
            />
            {form.formState.errors.moodle_group_name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.moodle_group_name.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label>Status</Label>
            <Controller
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <Select
                  value={field.value ? "active" : "inactive"}
                  onValueChange={(v) => field.onChange(v === "active")}
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
          </div>

          <Button className="w-full" disabled={createMut.isPending}>
            {createMut.isPending ? "Menyimpan..." : "Simpan"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
