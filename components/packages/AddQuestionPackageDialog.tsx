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
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const schema = z.object({ name: z.string().trim().min(1, "Nama paket wajib diisi"), description: z.string().trim().optional(), total_duration_minutes: z.number().int().min(1, "Durasi minimal 1 menit"), status: z.enum(["draft", "published", "archived"]) });
type FormValues = z.infer<typeof schema>;

export function AddQuestionPackageDialog() {
  const [open, setOpen] = React.useState(false); const qc = useQueryClient();
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: "", description: "", total_duration_minutes: 120, status: "draft" } });
  const mutation = useMutation({ mutationFn: (v: FormValues) => questionPackagesService.create(v), onSuccess: (r) => { toast.success(r.message ?? "Paket dibuat"); qc.invalidateQueries({ queryKey: [API_ENDPOINTS.QUESTION_PACKAGES.BASE] }); setOpen(false); form.reset(); }, onError: (e) => toast.error(getApiErrorMessage(e)) });
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button>+ Tambah Paket</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Tambah Paket Soal</DialogTitle><DialogDescription>Buat paket internal. Section dan bank soal dapat ditambahkan dari halaman detail.</DialogDescription></DialogHeader><form className="space-y-4" onSubmit={form.handleSubmit((v) => mutation.mutate(v))}>
    <div className="space-y-2"><Label>Nama Paket</Label><Input {...form.register("name")} placeholder="Paket TPA A"/>{form.formState.errors.name ? <p className="text-sm text-destructive">{form.formState.errors.name.message}</p> : null}</div>
    <div className="space-y-2"><Label>Deskripsi</Label><Input {...form.register("description")} placeholder="Deskripsi singkat"/></div>
    <div className="space-y-2"><Label>Durasi Total (menit)</Label><Input type="number" {...form.register("total_duration_minutes", { valueAsNumber: true })}/>{form.formState.errors.total_duration_minutes ? <p className="text-sm text-destructive">{form.formState.errors.total_duration_minutes.message}</p> : null}</div>
    <div className="space-y-2"><Label>Status</Label><Controller control={form.control} name="status" render={({ field }) => <Select value={field.value} onValueChange={field.onChange}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="published">Published</SelectItem><SelectItem value="archived">Archived</SelectItem></SelectContent></Select>}/></div>
    <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button><Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Menyimpan..." : "Simpan"}</Button></div>
  </form></DialogContent></Dialog>;
}
