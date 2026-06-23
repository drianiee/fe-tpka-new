"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { questionsService } from "@/lib/services/questions.service";
import type { ExamSection, QuestionPackage } from "@/lib/types/question-packages";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function PackagePreviewDialog({ pkg }: { pkg: QuestionPackage }) {
  const [open, setOpen] = React.useState(false);
  const query = useQuery({
    queryKey: ["package-preview", pkg.id],
    queryFn: () => questionsService.list(pkg.id, { per_page: 500 }),
    enabled: open,
  });
  const questions = query.data?.data ?? [];
  const sections = [...(pkg.sections ?? [])].sort((a, b) => a.order_number - b.order_number);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button type="button" variant="outline">Preview Paket</Button></DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Preview {pkg.name}</DialogTitle>
        </DialogHeader>
        {query.isLoading ? <div className="text-sm text-muted-foreground">Memuat preview...</div> : null}
        <div className="space-y-6">
          {sections.map((section: ExamSection) => (
            <section key={section.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{section.name}</h3>
                <Badge variant="outline">{section.question_count} soal</Badge>
              </div>
              {questions.filter((question) => question.exam_section_id === section.id).map((question) => (
                <article key={question.id} className="rounded-xl border p-4">
                  <div className="mb-2 text-sm font-semibold">Soal {question.order_number}</div>
                  {question.question_text ? <p className="whitespace-pre-wrap leading-7">{question.question_text}</p> : null}
                  {question.question_image ? <img src={question.question_image} alt="Gambar soal" className="mt-3 max-h-64 rounded border object-contain" /> : null}
                  <div className="mt-4 grid gap-2">
                    {question.options.map((option) => (
                      <div key={option.option_label} className="flex items-start gap-3 rounded-lg border p-3">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border font-semibold">{option.option_label}</span>
                        <div className="flex-1">
                          {option.option_text ? <div>{option.option_text}</div> : null}
                          {option.option_image ? <img src={option.option_image} alt={`Opsi ${option.option_label}`} className="mt-2 max-h-40 rounded border object-contain" /> : null}
                        </div>
                        {option.is_correct ? <Badge variant="success">Kunci</Badge> : null}
                      </div>
                    ))}
                  </div>
                </article>
              ))}
              {!questions.some((question) => question.exam_section_id === section.id) ? (
                <div className="rounded-lg border p-3 text-sm text-muted-foreground">Belum ada soal.</div>
              ) : null}
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
