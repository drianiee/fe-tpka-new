"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, ExternalLink, Settings2, Trash } from "lucide-react";
import { MathText } from "@/components/common/MathText";
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
import { Separator } from "@/components/ui/separator";
import { PageHeaderLayout } from "@/components/layouts/PageHeaderLayout";

function StatusBadge({ status }: { status: QuestionPackage["status"] }) {
  if (status === "published") return <Badge variant="success">Aktif</Badge>;
  return <Badge variant="muted">Nonaktif</Badge>;
}

function QuestionPreview({ question }: { question: QuestionAdmin }) {
  return (
    <div>
      <div className="font-medium space-y-1">
        <div>#{question.order_number}</div>
        {question.question_text ? (
          <MathText value={question.question_text} className="text-sm" />
        ) : (
          <div className="text-sm text-muted-foreground">(Soal gambar)</div>
        )}
      </div>
      {question.question_image ? (
        <div className="mt-1 text-xs text-muted-foreground">
          Gambar: {question.question_image}
        </div>
      ) : null}
      <div className="mt-2 grid gap-1 text-xs text-muted-foreground md:grid-cols-2">
        {question.options.map((option) => (
          <div key={option.option_label} className="space-y-1">
            <span className="font-semibold">{option.option_label}.</span>{" "}
            {option.option_text ? (
              <MathText value={option.option_text} inline className="text-xs" />
            ) : (
              option.option_image || "-"
            )}
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
  const [isScoringDialogOpen, setIsScoringDialogOpen] = React.useState(false);
  const [baseScoreInput, setBaseScoreInput] = React.useState("200");
  const [scoreSpanInput, setScoreSpanInput] = React.useState("600");

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
    setBaseScoreInput(String(item.base_score ?? 200));
    setScoreSpanInput(String(item.score_span ?? 600));
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

  const scoringMutation = useMutation({
    mutationFn: () =>
      questionPackagesService.update(packageId, {
        name: item?.name ?? "",
        total_duration_minutes: item?.total_duration_minutes ?? 0,
        target_total_questions: item?.target_total_questions ?? 0,
        base_score: Math.max(0, Number(baseScoreInput) || 0),
        score_span: Math.max(0, Number(scoreSpanInput) || 0),
        sections: sections.map((section) => ({
          code: section.code as "verbal" | "kuantitatif" | "logika" | "spasial",
          duration_minutes: section.duration_minutes,
          target_question_count: section.target_question_count,
        })),
      }),
    onSuccess: (res) => {
      toast.success(res.message ?? "Konfigurasi skor diperbarui");
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
  const baseScore = Math.max(0, Number(baseScoreInput) || 0);
  const scoreSpan = Math.max(0, Number(scoreSpanInput) || 0);
  const maxScore = baseScore + scoreSpan;

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
              <Dialog
                open={isScoringDialogOpen}
                onOpenChange={setIsScoringDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button type="button" variant="outline" className="gap-2">
                    <Settings2 className="h-4 w-4" />
                    Settings
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Konfigurasi Skor TPKA</DialogTitle>
                    <DialogDescription>
                      Atur nilai dasar dan rentang kenaikan skor untuk semua
                      subtes. Perhitungan tetap dilakukan di backend saat submit
                      ujian.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="rounded-xl border p-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex-1">
                          <div className="font-medium">
                            Konfigurasi Skor TPKA
                          </div>
                          <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                            <div>
                              Setiap subtes dihitung dari nilai dasar ditambah
                              proporsi jawaban benar.
                            </div>
                            <div>
                              Skor total dihitung dari rata-rata seluruh skor
                              subtes, lalu dibulatkan ke bilangan bulat.
                            </div>
                          </div>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2 lg:min-w-[420px]">
                          <div className="space-y-2">
                            <Label>Nilai dasar subtes</Label>
                            <Input
                              type="number"
                              min={0}
                              value={baseScoreInput}
                              onChange={(e) =>
                                setBaseScoreInput(e.target.value)
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Rentang kenaikan skor</Label>
                            <Input
                              type="number"
                              min={0}
                              value={scoreSpanInput}
                              onChange={(e) =>
                                setScoreSpanInput(e.target.value)
                              }
                            />
                          </div>
                          <div className="rounded-lg border bg-slate-50 p-3 text-sm md:col-span-2">
                            <div className="font-medium">
                              Nilai maksimum subtes: {maxScore}
                            </div>
                            <div className="mt-1 text-muted-foreground">
                              Rumus umum:{" "}
                              <code>{`round(${baseScore} + (benar / total_soal) × ${scoreSpan})`}</code>
                            </div>
                          </div>
                          <div className="md:col-span-2 flex justify-end">
                            <Button
                              type="button"
                              onClick={() => scoringMutation.mutate()}
                              disabled={scoringMutation.isPending}
                            >
                              {scoringMutation.isPending
                                ? "Menyimpan..."
                                : "Simpan Konfigurasi Nilai"}
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        {sections.map((section) => (
                          <div
                            key={section.id}
                            className="rounded-lg border bg-slate-50 p-3"
                          >
                            <div className="font-medium">{section.name}</div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {`round(${baseScore} + (benar / ${section.target_question_count}) × ${scoreSpan})`}
                            </div>
                            <div className="mt-2 text-xs text-muted-foreground">
                              Skor minimum {baseScore}, maksimum {maxScore}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
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
              {activeSection ? (
                <ImportQuestionsDialog
                  packageId={item.id}
                  section={activeSection}
                  disabled={isActiveSectionFull}
                />
              ) : null}
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
