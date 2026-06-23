"use client";

import * as React from "react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "@/lib/api/errors";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { questionsService } from "@/lib/services/questions.service";
import type { ExamSection } from "@/lib/types/question-packages";
import type { QuestionAdmin, QuestionOptionAdmin, QuestionPayload } from "@/lib/types/questions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const LABELS = ["A", "B", "C", "D"] as const;

function emptyOptions(): QuestionOptionAdmin[] {
  return LABELS.map((label, index) => ({
    option_label: label,
    option_text: "",
    option_image: "",
    is_correct: label === "A",
    order_number: index + 1,
  }));
}

function toPayload(question: QuestionAdmin | null, sections: ExamSection[]): QuestionPayload {
  return {
    exam_section_id: question?.exam_section_id ?? sections[0]?.id ?? 0,
    order_number: question?.order_number ?? 1,
    question_text: question?.question_text ?? "",
    question_image: question?.question_image ?? "",
    explanation: question?.explanation ?? "",
    difficulty: question?.difficulty ?? "",
    score: Number(question?.score ?? 1),
    is_active: question?.is_active ?? true,
    options: question?.options?.length ? LABELS.map((label, index) => {
      const option = question.options.find((item) => item.option_label === label);
      return {
        option_label: label,
        option_text: option?.option_text ?? "",
        option_image: option?.option_image ?? "",
        is_correct: option?.is_correct ?? label === "A",
        order_number: option?.order_number ?? index + 1,
      };
    }) : emptyOptions(),
  };
}

export function QuestionFormDialog({
  packageId,
  sections,
  question,
  trigger,
}: {
  packageId: number;
  sections: ExamSection[];
  question?: QuestionAdmin | null;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<QuestionPayload>(() => toPayload(question ?? null, sections));
  const qc = useQueryClient();

  React.useEffect(() => {
    if (open) setForm(toPayload(question ?? null, sections));
  }, [open, question, sections]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: [API_ENDPOINTS.QUESTION_PACKAGES.DETAIL(packageId)] });
    qc.invalidateQueries({ queryKey: [API_ENDPOINTS.QUESTION_PACKAGES.QUESTIONS(packageId)] });
  };

  const saveMutation = useMutation({
    mutationFn: (payload: QuestionPayload) =>
      question?.id ? questionsService.update(question.id, payload) : questionsService.create(packageId, payload),
    onSuccess: (res) => {
      toast.success(res.message ?? "Soal disimpan");
      invalidate();
      setOpen(false);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => questionsService.uploadImage(file),
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const upload = async (file: File | null, apply: (url: string) => void) => {
    if (!file) return;
    const result = await uploadMutation.mutateAsync(file);
    apply(result.url);
  };

  const validate = () => {
    if (!form.exam_section_id) return "Section wajib dipilih.";
    if (!form.question_text?.trim() && !form.question_image?.trim()) return "Soal wajib punya teks atau gambar.";
    if (form.score < 1) return "Skor minimal 1.";
    if (form.options.filter((option) => option.is_correct).length !== 1) return "Pilih tepat satu kunci jawaban.";
    for (const option of form.options) {
      if (!option.option_text?.trim() && !option.option_image?.trim()) return `Opsi ${option.option_label} wajib punya teks atau gambar.`;
    }
    return null;
  };

  const submit = () => {
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }
    saveMutation.mutate({
      ...form,
      question_text: form.question_text?.trim() || null,
      question_image: form.question_image?.trim() || null,
      explanation: form.explanation?.trim() || null,
      difficulty: form.difficulty?.trim() || null,
      options: form.options.map((option, index) => ({
        ...option,
        option_text: option.option_text?.trim() || null,
        option_image: option.option_image?.trim() || null,
        order_number: index + 1,
      })),
    });
  };

  const setOption = (label: string, patch: Partial<QuestionOptionAdmin>) => {
    setForm((value) => ({
      ...value,
      options: value.options.map((option) => option.option_label === label ? { ...option, ...patch } : option),
    }));
  };

  const setCorrect = (label: string) => {
    setForm((value) => ({
      ...value,
      options: value.options.map((option) => ({ ...option, is_correct: option.option_label === label })),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{question ? "Edit Soal" : "Tambah Soal"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Section</Label>
              <Select value={String(form.exam_section_id)} onValueChange={(v) => setForm((x) => ({ ...x, exam_section_id: Number(v) }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {sections.map((section) => <SelectItem key={section.id} value={String(section.id)}>{section.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nomor Urut</Label>
              <Input type="number" min={1} value={form.order_number} onChange={(e) => setForm((x) => ({ ...x, order_number: Number(e.target.value) }))} />
            </div>
            <div className="space-y-2">
              <Label>Skor</Label>
              <Input type="number" min={1} value={form.score} onChange={(e) => setForm((x) => ({ ...x, score: Number(e.target.value) }))} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Teks Soal</Label>
            <textarea className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.question_text ?? ""} onChange={(e) => setForm((x) => ({ ...x, question_text: e.target.value }))} />
          </div>
          <div className="grid gap-2 md:grid-cols-[1fr_auto]">
            <div className="space-y-2">
              <Label>Gambar Soal URL/path</Label>
              <Input value={form.question_image ?? ""} onChange={(e) => setForm((x) => ({ ...x, question_image: e.target.value }))} placeholder="/storage/question-images/..." />
            </div>
            <div className="space-y-2">
              <Label>Upload</Label>
              <Input type="file" accept="image/*" disabled={uploadMutation.isPending} onChange={(e) => upload(e.target.files?.[0] ?? null, (url) => setForm((x) => ({ ...x, question_image: url })))} />
            </div>
          </div>

          <div className="grid gap-3">
            {LABELS.map((label) => {
              const option = form.options.find((item) => item.option_label === label) ?? emptyOptions().find((item) => item.option_label === label)!;
              return (
                <div key={label} className="rounded-lg border p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="font-medium">Opsi {label}</div>
                    <Button type="button" size="sm" variant={option.is_correct ? "default" : "outline"} onClick={() => setCorrect(label)}>
                      {option.is_correct ? "Kunci" : "Jadikan Kunci"}
                    </Button>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    <Input value={option.option_text ?? ""} onChange={(e) => setOption(label, { option_text: e.target.value })} placeholder={`Teks opsi ${label}`} />
                    <Input value={option.option_image ?? ""} onChange={(e) => setOption(label, { option_image: e.target.value })} placeholder="URL/path gambar opsi" />
                    <Input type="file" accept="image/*" disabled={uploadMutation.isPending} onChange={(e) => upload(e.target.files?.[0] ?? null, (url) => setOption(label, { option_image: url }))} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Input value={form.difficulty ?? ""} onChange={(e) => setForm((x) => ({ ...x, difficulty: e.target.value }))} placeholder="mudah/sedang/sulit" />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.is_active ? "1" : "0"} onValueChange={(v) => setForm((x) => ({ ...x, is_active: v === "1" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="1">Aktif</SelectItem><SelectItem value="0">Nonaktif</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Pembahasan</Label>
            <textarea className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm" value={form.explanation ?? ""} onChange={(e) => setForm((x) => ({ ...x, explanation: e.target.value }))} />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button type="button" onClick={submit} disabled={saveMutation.isPending || uploadMutation.isPending}>
              {saveMutation.isPending ? "Menyimpan..." : "Simpan Soal"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
