"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { getApiErrorMessage } from "@/lib/api/errors";
import { authService } from "@/lib/services/auth.service";
import { questionPackagesService } from "@/lib/services/questionPackages.service";
import { questionsService } from "@/lib/services/questions.service";
import type { ExamQuestion, ExamSection } from "@/lib/types/exam";
import { ExamWorkspace } from "@/components/exam/ExamWorkspace";
import { PageHeaderLayout } from "@/components/layouts/PageHeaderLayout";

function roleLabel(role?: string) {
  if (role === "administrator") return "Admin";
  if (role === "operator") return "Operator";
  if (role === "peserta") return "Peserta";
  return "Preview";
}

function initials(name?: string | null) {
  const value = (name ?? "").trim();
  if (!value) return "P";
  const parts = value.split(/\s+/).slice(0, 2);

  return `${parts[0]?.[0] ?? "P"}${parts[1]?.[0] ?? ""}`.toUpperCase();
}

export function PackageExamPreviewPage({ packageId, backHref }: { packageId: number; backHref: string }) {
  const router = useRouter();
  const [currentId, setCurrentId] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<number, number>>({});
  const [flaggedIds, setFlaggedIds] = React.useState<Set<number>>(() => new Set());

  const detailQuery = useQuery({
    queryKey: [API_ENDPOINTS.QUESTION_PACKAGES.DETAIL(packageId)],
    queryFn: () => questionPackagesService.detail(packageId),
    enabled: Number.isFinite(packageId),
  });

  const questionsQuery = useQuery({
    queryKey: [API_ENDPOINTS.QUESTION_PACKAGES.QUESTIONS(packageId), { preview: true }],
    queryFn: () => questionsService.list(packageId, { per_page: 1000 }),
    enabled: Number.isFinite(packageId),
  });

  const meQuery = useQuery({
    queryKey: [API_ENDPOINTS.AUTH.ME, "exam-preview"],
    queryFn: () => authService.me(),
    staleTime: 60_000,
  });

  const pkg = detailQuery.data?.data ?? null;
  const sections: ExamSection[] = React.useMemo(() => {
    return [...(pkg?.sections ?? [])]
      .sort((a, b) => a.order_number - b.order_number)
      .map((section) => ({
        id: section.id,
        name: section.name,
        description: section.description,
        order_number: section.order_number,
        duration_minutes: section.duration_minutes,
        question_count: section.question_count,
      }));
  }, [pkg?.sections]);

  const questions: ExamQuestion[] = React.useMemo(() => {
    const sectionOrder = new Map(sections.map((section, index) => [section.id, index]));

    return [...(questionsQuery.data?.data ?? [])]
      .sort((a, b) => {
        const sectionDiff = (sectionOrder.get(a.exam_section_id) ?? 0) - (sectionOrder.get(b.exam_section_id) ?? 0);
        if (sectionDiff !== 0) return sectionDiff;
        return a.order_number - b.order_number;
      })
      .map((question) => ({
        id: question.id,
        section_id: question.exam_section_id,
        order_number: question.order_number,
        question_text: question.question_text,
        question_image: question.question_image,
        options: [...question.options]
          .sort((a, b) => (a.order_number ?? 0) - (b.order_number ?? 0))
          .map((option, index) => ({
            id: option.id ?? Number(`${question.id}${index + 1}`),
            option_label: option.option_label,
            option_text: option.option_text,
            option_image: option.option_image,
          })),
      }));
  }, [questionsQuery.data?.data, sections]);

  React.useEffect(() => {
    if (!currentId && questions[0]?.id) setCurrentId(questions[0].id);
  }, [currentId, questions]);

  if (detailQuery.isLoading || questionsQuery.isLoading) {
    return <PageHeaderLayout title="Preview Paket Soal" description="Memuat preview ujian..."><p className="text-sm text-muted-foreground">Loading...</p></PageHeaderLayout>;
  }

  if (detailQuery.isError || questionsQuery.isError || !pkg) {
    return <PageHeaderLayout title="Preview Paket Soal" description="Gagal memuat preview" showBack onBack={() => router.push(backHref)}><p className="text-sm text-destructive">{getApiErrorMessage(detailQuery.error ?? questionsQuery.error)}</p></PageHeaderLayout>;
  }

  const current = questions.find((question) => question.id === currentId) ?? questions[0] ?? null;
  const answeredIds = new Set(Object.keys(answers).map(Number));

  return (
    <ExamWorkspace
      title={pkg.name}
      accessLabel={roleLabel(meQuery.data?.role)}
      avatarLabel={initials(meQuery.data?.name)}
      sections={sections}
      questions={questions}
      currentId={current?.id ?? 0}
      selectedOptionId={current ? answers[current.id] ?? null : null}
      answeredIds={answeredIds}
      flaggedIds={flaggedIds}
      timerMode="section"
      finishLabel="Kembali"
      footerStatus="Mode preview: jawaban dan flag tidak disimpan."
      onCurrentIdChange={setCurrentId}
      onSelectOption={(questionId, optionId) => setAnswers((value) => ({ ...value, [questionId]: optionId }))}
      onToggleFlag={(questionId) => {
        setFlaggedIds((value) => {
          const next = new Set(value);
          if (next.has(questionId)) next.delete(questionId);
          else next.add(questionId);
          return next;
        });
      }}
      onFinish={() => router.push(backHref)}
    />
  );
}
