"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ExamWorkspace } from "@/components/exam/ExamWorkspace";
import { SubmitExamDialog } from "@/components/exam/SubmitExamDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getApiErrorMessage } from "@/lib/api/errors";
import { useAutosaveAnswer } from "@/lib/hooks/useAutosaveAnswer";
import { useExamAttempt } from "@/lib/hooks/useExamAttempt";
import { useExamTimer } from "@/lib/hooks/useExamTimer";
import { examService } from "@/lib/services/exam.service";
import type { ExamAnswer, ExamResult, ExamSection } from "@/lib/types/exam";

function durationMs(section?: ExamSection | null) {
  return Math.max(1, Number(section?.duration_minutes ?? 0)) * 60_000;
}

function sectionStorageKey(attemptId: string) {
  return `tpka:attempt:${attemptId}:section-session`;
}

export function ExamPlayer({ attemptId }: { attemptId: string }) {
  const router = useRouter();
  const query = useExamAttempt(attemptId);
  const save = useAutosaveAnswer(attemptId);

  const [answers, setAnswers] = React.useState<Record<number, ExamAnswer>>({});
  const [currentId, setCurrentId] = React.useState(0);
  const [activeSectionIndex, setActiveSectionIndex] = React.useState(0);
  const [sectionDeadline, setSectionDeadline] = React.useState<number | null>(null);
  const [sectionRemaining, setSectionRemaining] = React.useState(0);
  const [finishSessionOpen, setFinishSessionOpen] = React.useState(false);
  const [submitOpen, setSubmitOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [result, setResult] = React.useState<ExamResult | null>(null);
  const [online, setOnline] = React.useState(true);
  const initializedAttempt = React.useRef<string | null>(null);
  const autoAdvanceLock = React.useRef(false);

  const attempt = query.data;
  const orderedSections = React.useMemo(
    () => [...(attempt?.sections ?? [])].sort((a, b) => a.order_number - b.order_number),
    [attempt?.sections]
  );
  const activeSection = orderedSections[activeSectionIndex] ?? orderedSections[0] ?? null;
  const activeQuestions = React.useMemo(
    () => (activeSection ? (attempt?.questions ?? []).filter((question) => question.section_id === activeSection.id) : []),
    [activeSection, attempt?.questions]
  );

  const submit = React.useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const value = await examService.submit(attemptId);
      setResult(value);
      setSubmitOpen(false);
      window.localStorage.removeItem(sectionStorageKey(attemptId));
      router.replace("/dashboard/peserta/certificates");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }, [attemptId, router, submitting]);

  const attemptRemaining = useExamTimer(attempt?.server_time, attempt?.expires_at, submit);

  React.useEffect(() => {
    if (!attempt) return;
    setAnswers(Object.fromEntries(attempt.answers.map((answer) => [answer.question_id, answer])));
  }, [attempt]);

  React.useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  React.useEffect(() => {
    if (!attempt || attempt.status !== "in_progress") return;
    const id = window.setInterval(() => examService.heartbeat(attemptId).catch(() => setOnline(false)), 30_000);
    return () => window.clearInterval(id);
  }, [attemptId, attempt]);

  React.useEffect(() => {
    if (!attempt || orderedSections.length === 0 || initializedAttempt.current === attemptId) return;
    initializedAttempt.current = attemptId;

    const storageKey = sectionStorageKey(attemptId);
    const saved = window.localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { index?: number; deadline?: number };
        if (Number.isInteger(parsed.index) && parsed.deadline && parsed.deadline > Date.now()) {
          const safeIndex = Math.min(Math.max(0, parsed.index ?? 0), orderedSections.length - 1);
          setActiveSectionIndex(safeIndex);
          setSectionDeadline(parsed.deadline);
          return;
        }
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    }

    const serverNow = new Date(attempt.server_time).getTime();
    const startedAt = new Date(attempt.started_at).getTime();
    const elapsed = Math.max(0, serverNow - startedAt);
    let cumulative = 0;
    let index = orderedSections.length - 1;

    for (let i = 0; i < orderedSections.length; i += 1) {
      cumulative += durationMs(orderedSections[i]);
      if (elapsed < cumulative) {
        index = i;
        break;
      }
    }

    const scheduledDeadline = startedAt + cumulative;
    const deadline = Date.now() + Math.max(0, scheduledDeadline - serverNow);
    setActiveSectionIndex(index);
    setSectionDeadline(deadline);
  }, [attempt, attemptId, orderedSections]);

  React.useEffect(() => {
    if (!activeSection || activeQuestions.length === 0) return;
    if (!activeQuestions.some((question) => question.id === currentId)) {
      setCurrentId(activeQuestions[0].id);
    }
  }, [activeQuestions, activeSection, currentId]);

  const moveToNextSection = React.useCallback(
    (automatic = false) => {
      if (!attempt || orderedSections.length === 0) return;
      const isLast = activeSectionIndex >= orderedSections.length - 1;
      if (isLast) {
        if (automatic) void submit();
        else setSubmitOpen(true);
        return;
      }

      const nextIndex = activeSectionIndex + 1;
      const attemptEnd = new Date(attempt.expires_at).getTime();
      const nextDeadline = Math.min(Date.now() + durationMs(orderedSections[nextIndex]), attemptEnd);
      setActiveSectionIndex(nextIndex);
      setSectionDeadline(nextDeadline);
      autoAdvanceLock.current = false;
      window.localStorage.setItem(sectionStorageKey(attemptId), JSON.stringify({ index: nextIndex, deadline: nextDeadline }));
      toast.info(`Masuk ke sesi ${orderedSections[nextIndex].name}.`);
    },
    [activeSectionIndex, attempt, attemptId, orderedSections, submit]
  );

  React.useEffect(() => {
    if (!sectionDeadline || !attempt || attempt.status !== "in_progress") return;

    const tick = () => {
      const next = Math.max(0, sectionDeadline - Date.now());
      setSectionRemaining(next);
      if (next === 0 && !autoAdvanceLock.current) {
        autoAdvanceLock.current = true;
        moveToNextSection(true);
      }
    };

    tick();
    const id = window.setInterval(tick, 1_000);
    return () => window.clearInterval(id);
  }, [attempt, moveToNextSection, sectionDeadline]);

  React.useEffect(() => {
    if (!attempt || result) return;
    if (attempt.status !== "in_progress") {
      router.replace("/dashboard/peserta/certificates");
    }
  }, [attempt, result, router]);

  if (query.isLoading) return <div className="p-8 text-sm text-muted-foreground">Memuat attempt...</div>;
  if (query.isError || !attempt) return <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{getApiErrorMessage(query.error)}</div>;
  if (result || attempt.status !== "in_progress") {
    return <div className="p-8 text-sm text-muted-foreground">Mengalihkan ke sertifikat...</div>;
  }

  const current = activeQuestions.find((question) => question.id === currentId) ?? activeQuestions[0] ?? null;
  if (!current) return <div>Paket ujian tidak memiliki soal untuk sesi ini.</div>;

  const answeredIds = new Set(Object.values(answers).filter((answer) => answer.question_option_id != null || answer.answer_text).map((answer) => answer.question_id));
  const flaggedIds = new Set(Object.values(answers).filter((answer) => answer.is_flagged).map((answer) => answer.question_id));
  const isLastSection = activeSectionIndex >= orderedSections.length - 1;
  const activeAnsweredCount = activeQuestions.filter((question) => answeredIds.has(question.id)).length;
  const activeUnansweredCount = Math.max(0, activeQuestions.length - activeAnsweredCount);
  const canFinishActiveSection = activeQuestions.length > 0 && activeUnansweredCount === 0;

  const saveValue = (questionId: number, patch: Partial<ExamAnswer>) => {
    const previous = answers[questionId];
    const next: ExamAnswer = {
      question_id: questionId,
      question_option_id: patch.question_option_id ?? previous?.question_option_id ?? null,
      answer_text: patch.answer_text ?? previous?.answer_text ?? null,
      is_flagged: patch.is_flagged ?? previous?.is_flagged ?? false,
    };
    setAnswers((value) => ({ ...value, [questionId]: next }));
    save.mutate(
      { questionId, answer: { question_option_id: next.question_option_id, answer_text: next.answer_text, is_flagged: next.is_flagged } },
      { onError: (error) => toast.error(getApiErrorMessage(error)) }
    );
  };

  return (
    <>
      <ExamWorkspace
        title={attempt.schedule.title}
        accessLabel="Peserta"
        sections={orderedSections}
        questions={attempt.questions}
        activeSectionId={activeSection?.id}
        allowSectionSwitch={false}
        currentId={current.id}
        selectedOptionId={answers[current.id]?.question_option_id ?? null}
        answeredIds={answeredIds}
        flaggedIds={flaggedIds}
        remainingMs={Math.min(sectionRemaining, attemptRemaining || sectionRemaining)}
        timerMode="section"
        saving={save.isPending}
        finishLabel={isLastSection ? "Selesaikan Ujian" : "Selesaikan Sesi"}
        finishDisabled={!canFinishActiveSection}
        footerStatus={online ? "Jawaban tersimpan otomatis" : "Koneksi terputus, mencoba sinkron ulang"}
        onCurrentIdChange={setCurrentId}
        onSelectOption={(questionId, optionId) => saveValue(questionId, { question_option_id: optionId })}
        onToggleFlag={(questionId) => saveValue(questionId, { is_flagged: !answers[questionId]?.is_flagged })}
        onFinish={() => {
          if (isLastSection) moveToNextSection(false);
          else setFinishSessionOpen(true);
        }}
      />
      <Dialog open={finishSessionOpen} onOpenChange={setFinishSessionOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Selesaikan sesi ini?</DialogTitle>
            <DialogDescription>
              Pastikan jawaban pada sesi {activeSection?.name ?? "ini"} sudah
              sesuai. Setelah lanjut ke sesi berikutnya, Anda tidak bisa
              kembali ke sesi ini.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setFinishSessionOpen(false)}
            >
              Cek Lagi
            </Button>
            <Button
              type="button"
              onClick={() => {
                setFinishSessionOpen(false);
                moveToNextSection(false);
              }}
            >
              Lanjut Sesi Berikutnya
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <SubmitExamDialog
        open={submitOpen}
        answered={answeredIds.size}
        total={attempt.questions.length}
        submitting={submitting}
        onOpenChange={setSubmitOpen}
        onConfirm={submit}
      />
    </>
  );
}
