"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, ExternalLink, Trash } from "lucide-react";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { getApiErrorMessage } from "@/lib/api/errors";
import { questionPackagesService } from "@/lib/services/questionPackages.service";
import { questionsService } from "@/lib/services/questions.service";
import type {
  ExamSection,
  QuestionPackage,
} from "@/lib/types/question-packages";
import type { QuestionAdmin } from "@/lib/types/questions";
import { QuestionFormDialog } from "@/components/packages/QuestionFormDialog";
import { ImportQuestionsDialog } from "@/components/packages/ImportQuestionsDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { PageHeaderLayout } from "@/components/layouts/PageHeaderLayout";

function StatusBadge({ status }: { status: QuestionPackage["status"] }) {
  if (status === "published") return <Badge variant="success">Aktif</Badge>;
  return <Badge variant="muted">Nonaktif</Badge>;
}

function QuestionPreview({ question }: { question: QuestionAdmin }) {
  return (
    <div>
      <div className="font-medium">
        #{question.order_number} {question.question_text || "(Soal gambar)"}
      </div>
      {question.question_image ? (
        <div className="mt-1 text-xs text-muted-foreground">
          Gambar: {question.question_image}
        </div>
      ) : null}
      <div className="mt-2 grid gap-1 text-xs text-muted-foreground md:grid-cols-2">
        {question.options.map((option) => (
          <div key={option.option_label} className="truncate">
            <span className="font-semibold">{option.option_label}.</span>{" "}
            {option.option_text || option.option_image || "-"}
            {option.is_correct ? (
              <span className="ml-2 text-green-700">(kunci)</span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export function QuestionPackageDetail({
  packageId,
  backHref,
}: {
  packageId: number;
  backHref: string;
}) {
  const router = useRouter();
  const qc = useQueryClient();
  const [activeSectionId, setActiveSectionId] = React.useState<number | null>(
    null,
  );
  const [baseScoreInput, setBaseScoreInput] = React.useState("200");
  const [correctAnswerScoreInput, setCorrectAnswerScoreInput] = React.useState("2");

  const detailQuery = useQuery({
    queryKey: [API_ENDPOINTS.QUESTION_PACKAGES.DETAIL(packageId)],
    queryFn: () => questionPackagesService.detail(packageId),
    enabled: Number.isFinite(packageId),
  });
  const item = detailQuery.data?.data ?? null;
  const sections = React.useMemo(
    () =>
      [...(item?.sections ?? [])].sort(
        (a, b) => a.order_number - b.order_number,
      ),
    [item?.sections],
  );

  React.useEffect(() => {
    if (!activeSectionId && sections[0]?.id) setActiveSectionId(sections[0].id);
  }, [activeSectionId, sections]);

  React.useEffect(() => {
    if (!item) return;
    setBaseScoreInput(String(item.base_score));
    setCorrectAnswerScoreInput(String(item.correct_answer_score));
  }, [item]);

  const questionsQuery = useQuery({
    queryKey: [
      API_ENDPOINTS.QUESTION_PACKAGES.QUESTIONS(packageId),
      { section_id: activeSectionId },
    ],
    queryFn: () =>
      questionsService.list(packageId, {
        section_id: activeSectionId ?? undefined,
        per_page: 100,
      }),
    enabled: Number.isFinite(packageId) && Boolean(activeSectionId),
  });

  const statusMutation = useMutation({
    mutationFn: (status: QuestionPackage["status"]) =>
      questionPackagesService.updateStatus(packageId, { status }),
    onSuccess: (res) => {
      toast.success(res.message ?? "Status paket diperbarui");
      qc.invalidateQueries({
        queryKey: [API_ENDPOINTS.QUESTION_PACKAGES.BASE],
      });
      qc.invalidateQueries({
        queryKey: [API_ENDPOINTS.QUESTION_PACKAGES.DETAIL(packageId)],
      });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => questionPackagesService.destroy(packageId),
    onSuccess: (res) => {
      toast.success(res.message ?? "Paket dihapus");
      qc.invalidateQueries({
        queryKey: [API_ENDPOINTS.QUESTION_PACKAGES.BASE],
      });
      router.push(backHref);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: (questionId: number) => questionsService.destroy(questionId),
    onSuccess: () => {
      toast.success("Soal dihapus");
      qc.invalidateQueries({
        queryKey: [API_ENDPOINTS.QUESTION_PACKAGES.DETAIL(packageId)],
      });
      qc.invalidateQueries({
        queryKey: [API_ENDPOINTS.QUESTION_PACKAGES.QUESTIONS(packageId)],
      });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const updateScoringMutation = useMutation({
    mutationFn: () => {
      if (!item) throw new Error("Paket tidak ditemukan.");

      return questionPackagesService.update(packageId, {
        name: item.name,
        total_duration_minutes: item.total_duration_minutes,
        target_total_questions: item.target_total_questions,
        base_score: Math.max(0, Number(baseScoreInput) || 0),
        correct_answer_score: Math.max(0, Number(correctAnswerScoreInput) || 0),
        sections: sections.map((section) => ({
          code: section.code as
            | "verbal"
            | "kuantitatif"
            | "logika"
            | "spasial",
          duration_minutes: section.duration_minutes,
          target_question_count: section.target_question_count,
        })),
      });
    },
    onSuccess: (res) => {
      toast.success(res.message ?? "Pengaturan nilai diperbarui");
      qc.invalidateQueries({
        queryKey: [API_ENDPOINTS.QUESTION_PACKAGES.BASE],
      });
      qc.invalidateQueries({
        queryKey: [API_ENDPOINTS.QUESTION_PACKAGES.DETAIL(packageId)],
      });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  if (detailQuery.isLoading) {
    return (
      <PageHeaderLayout
        title="Detail Paket Soal"
        description="Memuat detail paket soal..."
      >
        <p className="text-sm text-muted-foreground">Loading...</p>
      </PageHeaderLayout>
    );
  }
  if (detailQuery.isError || !item) {
    return (
      <PageHeaderLayout
        title="Detail Paket Soal"
        description="Gagal memuat detail paket soal"
        showBack
        onBack={() => router.push(backHref)}
      >
        <p className="text-sm text-destructive">Gagal load package.</p>
      </PageHeaderLayout>
    );
  }

  const activeSection =
    sections.find((section) => section.id === activeSectionId) ??
    sections[0] ??
    null;
  const questions = questionsQuery.data?.data ?? [];
  const activeSectionLimit = activeSection?.target_question_count ?? 0;
  const activeSectionCount = activeSection?.question_count ?? 0;
  const isActiveSectionFull =
    Boolean(activeSection) &&
    activeSectionLimit > 0 &&
    activeSectionCount >= activeSectionLimit;
  const nextStatus = item.status === "published" ? "archived" : "published";
  const parsedBaseScore = Math.max(0, Number(baseScoreInput) || 0);
  const parsedCorrectAnswerScore = Math.max(
    0,
    Number(correctAnswerScoreInput) || 0,
  );
  const maxScore =
    parsedBaseScore +
    (item.target_total_questions ?? 0) * parsedCorrectAnswerScore;

  return (
    <PageHeaderLayout
      title={`Paket Soal #${item.id}`}
      description={item.name}
      showBack
      onBack={() => router.push(backHref)}
    >
      <div className="space-y-4">
        <Card className="p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={item.status} />
                <Badge variant="outline">ID: {item.id}</Badge>
                <Badge variant="secondary">
                  {item.total_questions}/{item.target_total_questions ?? 0} soal
                </Badge>
                <Badge variant="secondary">
                  {item.total_duration_minutes} menit
                </Badge>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild type="button" variant="outline">
                <Link
                  href={`/exam-preview/question-packages/${item.id}?back=${encodeURIComponent(`${backHref}/${item.id}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  Preview Paket
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </Button>
              <Button
                type="button"
                variant={item.status === "published" ? "outline" : "blue"}
                disabled={statusMutation.isPending}
                onClick={() => statusMutation.mutate(nextStatus)}
              >
                {item.status === "published" ? "Nonaktifkan" : "Aktifkan"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="text-destructive"
                disabled={
                  deleteMutation.isPending || item.status === "published"
                }
                onClick={() => deleteMutation.mutate()}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Separator />

          <div className="grid gap-3 rounded-xl border p-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <div className="space-y-2">
              <Label>Nilai Template</Label>
              <Input
                type="number"
                min={0}
                value={baseScoreInput}
                onChange={(e) => setBaseScoreInput(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Nilai per Jawaban Benar</Label>
              <Input
                type="number"
                min={0}
                value={correctAnswerScoreInput}
                onChange={(e) => setCorrectAnswerScoreInput(e.target.value)}
              />
            </div>
            <Button
              type="button"
              className="md:min-w-32"
              disabled={updateScoringMutation.isPending}
              onClick={() => updateScoringMutation.mutate()}
            >
              {updateScoringMutation.isPending ? "Menyimpan..." : "Simpan Nilai"}
            </Button>
            <div className="text-sm text-muted-foreground md:col-span-3">
              Rumus nilai: {parsedBaseScore} + ({item.target_total_questions ?? 0} x{" "}
              {parsedCorrectAnswerScore}) = maksimal {maxScore}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            {sections.map((section: ExamSection) => (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSectionId(section.id)}
                className={`rounded-xl border p-3 text-left ${activeSectionId === section.id ? "border-blue-600 bg-blue-50" : "bg-white"}`}
              >
                <div className="text-sm font-semibold">{section.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {section.code}
                </div>
                <div className="mt-3 text-sm">
                  {section.question_count}/{section.target_question_count ?? 0}{" "}
                  soal / {section.duration_minutes} menit
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-semibold">
                Soal {activeSection?.name ?? ""}
              </div>
              <div className="text-sm text-muted-foreground">
                {activeSection
                  ? `Kelola soal untuk section aktif. ${activeSectionCount}/${activeSectionLimit} soal terisi.`
                  : "Kelola soal untuk section aktif."}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeSection ? (
                <QuestionFormDialog
                  packageId={item.id}
                  section={activeSection}
                  trigger={
                    <Button type="button" disabled={isActiveSectionFull}>
                      Tambah Soal
                    </Button>
                  }
                />
              ) : null}
              <ImportQuestionsDialog
                packageId={item.id}
                disabled={isActiveSectionFull}
              />
            </div>
          </div>

          {isActiveSectionFull ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Section {activeSection?.name} sudah penuh. Maksimal{" "}
              {activeSectionLimit} soal.
            </div>
          ) : null}

          {questionsQuery.isLoading ? (
            <div className="text-sm text-muted-foreground">Memuat soal...</div>
          ) : null}
          <div className="divide-y rounded-xl border">
            {questions.map((question) => (
              <div
                key={question.id}
                className="flex flex-col gap-3 p-4 md:flex-row md:items-start md:justify-between"
              >
                <QuestionPreview question={question} />
                <div className="flex shrink-0 gap-2">
                  <QuestionFormDialog
                    packageId={item.id}
                    section={activeSection ?? question.section ?? sections[0]}
                    question={question}
                    trigger={
                      <Button type="button" size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="text-destructive"
                    disabled={deleteQuestionMutation.isPending}
                    onClick={() => deleteQuestionMutation.mutate(question.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {!questions.length && !questionsQuery.isLoading ? (
              <div className="p-4 text-sm text-muted-foreground">
                Belum ada soal di section ini.
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    </PageHeaderLayout>
  );
}
