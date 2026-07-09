"use client";

import * as React from "react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "@/lib/api/errors";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { questionsService } from "@/lib/services/questions.service";
import { cn } from "@/lib/utils";
import { apiAssetUrl } from "@/lib/utils/api-asset";
import { MathText } from "@/components/common/MathText";
import type { ExamSection } from "@/lib/types/question-packages";
import type {
  QuestionAdmin,
  QuestionOptionAdmin,
  QuestionPayload,
} from "@/lib/types/questions";
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

const LABELS = ["A", "B", "C", "D"] as const;

function hasIncompleteInlineLatex(value?: string | null) {
  const text = value ?? "";
  const dollarMatches = text.match(/\$/g) ?? [];

  return dollarMatches.length % 2 !== 0;
}

function emptyOptions(): QuestionOptionAdmin[] {
  return LABELS.map((label, index) => ({
    option_label: label,
    option_text: "",
    option_image: "",
    is_correct: label === "A",
    order_number: index + 1,
  }));
}

function toPayload(
  question: QuestionAdmin | null,
  section: ExamSection,
): QuestionPayload {
  return {
    exam_section_id: section.id,
    order_number: question?.order_number,
    question_text: question?.question_text ?? "",
    question_image: question?.question_image ?? "",
    score: question?.score == null ? undefined : Number(question.score),
    options: question?.options?.length
      ? LABELS.map((label, index) => {
          const option = question.options.find(
            (item) => item.option_label === label,
          );
          return {
            option_label: label,
            option_text: option?.option_text ?? "",
            option_image: option?.option_image ?? "",
            is_correct: option?.is_correct ?? label === "A",
            order_number: option?.order_number ?? index + 1,
          };
        })
      : emptyOptions(),
  };
}

function UploadedImageField({
  label,
  value,
  disabled,
  onUpload,
  onClear,
}: {
  label: string;
  value?: string | null;
  disabled?: boolean;
  onUpload: (file: File | null) => void;
  onClear: () => void;
}) {
  const imageUrl = apiAssetUrl(value ?? null);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type="file"
        accept="image/*"
        disabled={disabled}
        onChange={(e) => onUpload(e.target.files?.[0] ?? null)}
      />
      {imageUrl ? (
        <div className="rounded-lg border p-3">
          <img
            src={imageUrl}
            alt={label}
            className="max-h-40 rounded border object-contain"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-3"
            onClick={onClear}
          >
            Hapus gambar
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function QuestionFormDialog({
  packageId,
  section,
  question,
  trigger,
}: {
  packageId: number;
  section: ExamSection;
  question?: QuestionAdmin | null;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<QuestionPayload>(() =>
    toPayload(question ?? null, section),
  );
  const qc = useQueryClient();

  React.useEffect(() => {
    if (open) setForm(toPayload(question ?? null, section));
  }, [open, question, section]);

  const invalidate = () => {
    qc.invalidateQueries({
      queryKey: [API_ENDPOINTS.QUESTION_PACKAGES.DETAIL(packageId)],
    });
    qc.invalidateQueries({
      queryKey: [API_ENDPOINTS.QUESTION_PACKAGES.QUESTIONS(packageId)],
    });
  };

  const saveMutation = useMutation({
    mutationFn: (payload: QuestionPayload) =>
      question?.id
        ? questionsService.update(question.id, payload)
        : questionsService.create(packageId, payload),
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
    if (!form.question_text?.trim() && !form.question_image?.trim())
      return "Soal wajib punya teks atau gambar.";
    if (form.options.filter((option) => option.is_correct).length !== 1)
      return "Pilih tepat satu kunci jawaban.";
    for (const option of form.options) {
      if (!option.option_text?.trim() && !option.option_image?.trim())
        return `Opsi ${option.option_label} wajib punya teks atau gambar.`;
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
      options: value.options.map((option) =>
        option.option_label === label ? { ...option, ...patch } : option,
      ),
    }));
  };

  const setCorrect = (label: string) => {
    setForm((value) => ({
      ...value,
      options: value.options.map((option) => ({
        ...option,
        is_correct: option.option_label === label,
      })),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>
            {question ? "Edit" : "Tambah"} Soal {section.name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Teks Soal</Label>
                <textarea
                  className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={form.question_text ?? ""}
                  onChange={(e) =>
                    setForm((x) => ({ ...x, question_text: e.target.value }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Gunakan <code>$...$</code> untuk rumus inline dan <code>$$...$$</code>{" "}
                  untuk rumus besar. Contoh: <code>$81^n = 27^4$</code> atau{" "}
                  <code>{"$\\sqrt{x}$"}</code>.
                </p>
              </div>
              <UploadedImageField
                label="Gambar Soal"
                value={form.question_image}
                disabled={uploadMutation.isPending}
                onUpload={(file) =>
                  upload(file, (url) =>
                    setForm((x) => ({ ...x, question_image: url })),
                  )
                }
                onClear={() => setForm((x) => ({ ...x, question_image: null }))}
              />
            </div>

            <div className="rounded-lg border bg-slate-50 p-3 lg:sticky lg:top-0">
              <div className="mb-2 text-xs font-medium text-muted-foreground">
                Preview soal
              </div>
              {form.question_text?.trim() ? (
                <MathText
                  value={form.question_text}
                  className="text-sm leading-7 text-slate-800"
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Preview soal akan muncul di sini.
                </p>
              )}
              {form.question_image ? (
                <img
                  src={apiAssetUrl(form.question_image)!}
                  alt="Preview gambar soal"
                  className="mt-3 max-h-48 rounded border bg-white object-contain"
                />
              ) : null}
            </div>
          </div>

          <div className="grid gap-3">
            {LABELS.map((label) => {
              const option =
                form.options.find((item) => item.option_label === label) ??
                emptyOptions().find((item) => item.option_label === label)!;
              return (
                <div
                  key={label}
                  className={cn(
                    "rounded-lg border p-3 transition-colors",
                    option.is_correct
                      ? "border-blue-300 bg-blue-50 ring-1 ring-blue-200"
                      : "bg-white",
                  )}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "font-medium",
                          option.is_correct ? "text-blue-900" : "",
                        )}
                      >
                        Opsi {label}
                      </div>
                      {option.is_correct ? (
                        <span className="rounded-full bg-blue-600 px-2.5 py-0.5 text-xs font-semibold text-white">
                          Kunci Jawaban
                        </span>
                      ) : null}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant={option.is_correct ? "blue" : "outline"}
                      onClick={() => setCorrect(label)}
                    >
                      {option.is_correct ? "Terpilih" : "Jadikan Kunci"}
                    </Button>
                  </div>
                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start">
                    <div className="space-y-3">
                      <Input
                        value={option.option_text ?? ""}
                        onChange={(e) =>
                          setOption(label, { option_text: e.target.value })
                        }
                        placeholder={`Teks opsi ${label}`}
                      />
                      <p className="text-xs text-muted-foreground">
                        Opsi juga bisa pakai LaTeX. Contoh: <code>{"$x$"}</code>,{" "}
                        <code>{"$\\sqrt{x}$"}</code>, <code>{"$\\frac{1}{2}$"}</code>.
                      </p>
                      {hasIncompleteInlineLatex(option.option_text) ? (
                        <p className="text-xs text-amber-700">
                          Format LaTeX belum lengkap. Tutup kembali dengan tanda{" "}
                          <code>$</code>, misalnya <code>{"$x$"}</code>.
                        </p>
                      ) : null}
                      <UploadedImageField
                        label={`Gambar Opsi ${label}`}
                        value={option.option_image}
                        disabled={uploadMutation.isPending}
                        onUpload={(file) =>
                          upload(file, (url) =>
                            setOption(label, { option_image: url }),
                          )
                        }
                        onClear={() => setOption(label, { option_image: null })}
                      />
                    </div>

                    <div className="rounded-md border bg-slate-50 px-3 py-2">
                      <div className="mb-1 text-[11px] font-medium text-muted-foreground">
                        Preview opsi {label}
                      </div>
                      {option.option_text?.trim() ? (
                        <MathText
                          value={option.option_text}
                          className="text-sm leading-6 text-slate-800"
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Preview opsi akan muncul di sini.
                        </p>
                      )}
                      {option.option_image ? (
                        <img
                          src={apiAssetUrl(option.option_image)!}
                          alt={`Preview gambar opsi ${label}`}
                          className="mt-3 max-h-36 rounded border bg-white object-contain"
                        />
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={submit}
              disabled={saveMutation.isPending || uploadMutation.isPending}
            >
              {saveMutation.isPending ? "Menyimpan..." : "Simpan Soal"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
