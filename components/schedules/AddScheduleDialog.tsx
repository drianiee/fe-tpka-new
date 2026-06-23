"use client";

import * as React from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Controller, useForm, type UseFormRegisterReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { schedulesService } from "@/lib/services/schedules.service";
import { questionPackagesService } from "@/lib/services/questionPackages.service";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { getApiErrorMessage } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const schema = z.object({
  title: z.string().min(1, "Judul wajib diisi"),
  question_package_id: z.number().min(1, "Paket wajib dipilih"),
  start_at: z.string().min(1), end_at: z.string().min(1),
  registration_start_at: z.string().optional(), registration_end_at: z.string().optional(),
  price: z.number().min(0), quota: z.number().int().min(1),
  status: z.enum(["draft", "published"]),
}).refine((v) => new Date(v.end_at) > new Date(v.start_at), { message: "Waktu selesai harus setelah waktu mulai", path: ["end_at"] });
type Values = z.infer<typeof schema>;

function Field({ label, type, register, error }: { label: string; type: string; register: UseFormRegisterReturn; error?: string }) {
  return <div className="space-y-2"><Label>{label}</Label><Input type={type} {...register}/>{error ? <p className="text-sm text-destructive">{error}</p> : null}</div>;
}

export function AddScheduleDialog() {
  const [open, setOpen] = React.useState(false); const qc = useQueryClient();
  const packageQuery = useQuery({ queryKey: [API_ENDPOINTS.QUESTION_PACKAGES.BASE, "schedule-options"], queryFn: () => questionPackagesService.list({ per_page: 100, is_active: true }), enabled: open });
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { title: "", question_package_id: 0, start_at: "", end_at: "", registration_start_at: "", registration_end_at: "", price: 0, quota: 50, status: "draft" } });
  const mutation = useMutation({ mutationFn: (v: Values) => schedulesService.create({ ...v, registration_start_at: v.registration_start_at || undefined, registration_end_at: v.registration_end_at || undefined }), onSuccess: (r) => { toast.success(r.message ?? "Jadwal dibuat"); qc.invalidateQueries({ queryKey: [API_ENDPOINTS.SCHEDULES.BASE] }); setOpen(false); form.reset(); }, onError: (e) => toast.error(getApiErrorMessage(e)) });
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button>+ Jadwal</Button></DialogTrigger><DialogContent className="sm:max-w-xl"><DialogHeader><DialogTitle>Tambah Jadwal Ujian</DialogTitle></DialogHeader><form className="grid gap-4" onSubmit={form.handleSubmit((v) => mutation.mutate(v))}>
    <div className="space-y-2"><Label>Judul</Label><Input {...form.register("title")} placeholder="TPA Gelombang 1"/>{form.formState.errors.title ? <p className="text-sm text-destructive">{form.formState.errors.title.message}</p> : null}</div>
    <div className="space-y-2"><Label>Paket Soal</Label><Controller control={form.control} name="question_package_id" render={({ field }) => <Select value={field.value ? String(field.value) : ""} onValueChange={(v) => field.onChange(Number(v))}><SelectTrigger><SelectValue placeholder="Pilih paket"/></SelectTrigger><SelectContent>{packageQuery.data?.data.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name} ({p.total_questions} soal)</SelectItem>)}</SelectContent></Select>}/></div>
    <div className="grid gap-4 sm:grid-cols-2"><Field label="Mulai" type="datetime-local" register={form.register("start_at")}/><Field label="Selesai" type="datetime-local" register={form.register("end_at")} error={form.formState.errors.end_at?.message}/><Field label="Buka Registrasi" type="datetime-local" register={form.register("registration_start_at")}/><Field label="Tutup Registrasi" type="datetime-local" register={form.register("registration_end_at")}/><Field label="Harga" type="number" register={form.register("price", { valueAsNumber: true })}/><Field label="Kuota" type="number" register={form.register("quota", { valueAsNumber: true })}/></div>
    <div className="space-y-2"><Label>Status</Label><Controller control={form.control} name="status" render={({ field }) => <Select value={field.value} onValueChange={field.onChange}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="published">Published</SelectItem></SelectContent></Select>}/></div>
    <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button><Button disabled={mutation.isPending}>{mutation.isPending ? "Menyimpan..." : "Simpan"}</Button></div>
  </form></DialogContent></Dialog>;
}
