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
import { getApiErrorMessage, isNetworkError } from "@/lib/api/errors";
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

// Anchor timer section digeser sebesar total jeda (paused_ms) supaya attempt yang
// dilanjutkan admin masuk ke section yang benar dengan sisa waktu yang benar.
function attemptAnchorMs(startAt?: string, pausedMs = 0) {
  return (startAt ? new Date(startAt).getTime() : Date.now()) + pausedMs;
}

const RECONNECT_POLL_MS = 5_000;

type OfflineEvent = { reason: string; at: string };

function sectionEndMs(sections: ExamSection[], index: number, anchorMs: number) {
  const elapsedBefore = sections
    .slice(0, index + 1)
    .reduce((total, section) => total + durationMs(section), 0);

  return anchorMs + elapsedBefore;
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
  const [strictNoticeOpen, setStrictNoticeOpen] = React.useState(false);
  const [fullscreenPromptOpen, setFullscreenPromptOpen] = React.useState(false);
  const [strictArmed, setStrictArmed] = React.useState(false);
  const [fullscreenLoading, setFullscreenLoading] = React.useState(false);
  const [violationDialogOpen, setViolationDialogOpen] = React.useState(false);
  const [violationMessage, setViolationMessage] = React.useState("");
  const [connectionLostOpen, setConnectionLostOpen] = React.useState(false);
  const [reconnected, setReconnected] = React.useState(false);
  const [resuming, setResuming] = React.useState(false);
  const onlineRef = React.useRef(true);
  const offlineSinceRef = React.useRef<number | null>(null);
  const offlineEventsRef = React.useRef<OfflineEvent[]>([]);
  const initializedAttempt = React.useRef<string | null>(null);
  const autoAdvanceLock = React.useRef(false);
  const strictInitialized = React.useRef<string | null>(null);
  const violationLock = React.useRef(false);

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
  const scheduleDetailHref = attempt
    ? `/dashboard/peserta/my-schedules/${attempt.schedule.id}`
    : "/dashboard/peserta/my-schedules?status=all";

  const submit = React.useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const value = await examService.submit(attemptId);
      setResult(value);
      setSubmitOpen(false);
      setStrictArmed(false);
      window.localStorage.removeItem(sectionStorageKey(attemptId));
      if (document.fullscreenElement) {
        await document.exitFullscreen().catch(() => undefined);
      }
      router.replace(scheduleDetailHref);
      router.refresh();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }, [attemptId, router, scheduleDetailHref, submitting]);

  const activateFullscreen = React.useCallback(async (silent = false) => {
    setFullscreenLoading(true);
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
      setFullscreenPromptOpen(false);
      setStrictNoticeOpen(true);
    } catch (error) {
      setFullscreenPromptOpen(true);
      if (!silent) {
        toast.error("Fullscreen wajib aktif sebelum ujian dimulai.");
      }
      throw error;
    } finally {
      setFullscreenLoading(false);
    }
  }, []);

  // Koneksi putus bukan pelanggaran: matikan pengawasan, tahan peserta di overlay,
  // dan catat event yang terjadi selama offline untuk audit admin.
  const enterConnectionLost = React.useCallback((event?: OfflineEvent) => {
    if (event) offlineEventsRef.current.push(event);
    if (offlineSinceRef.current === null) offlineSinceRef.current = Date.now();
    onlineRef.current = false;
    setOnline(false);
    setReconnected(false);
    setStrictArmed(false);
    setConnectionLostOpen(true);
  }, []);

  const handleViolation = React.useCallback(
    async (reason: string, context: Record<string, unknown> = {}) => {
      if (violationLock.current) return;
      const now = new Date().toISOString();

      if (!navigator.onLine || !onlineRef.current) {
        enterConnectionLost({ reason, at: now });
        return;
      }

      violationLock.current = true;
      setStrictArmed(false);

      try {
        await examService.violation(attemptId, { reason, context: { ...context, client_time: now } });
      } catch (error) {
        if (isNetworkError(error)) {
          // Laporan tidak sampai ke server: attempt masih berjalan, perlakukan sebagai koneksi putus.
          violationLock.current = false;
          enterConnectionLost({ reason, at: now });
          return;
        }
        // Server merespons error (mis. attempt sudah berakhir): tetap keluarkan peserta.
      }

      window.localStorage.removeItem(sectionStorageKey(attemptId));
      if (document.fullscreenElement) {
        await document.exitFullscreen().catch(() => undefined);
      }
      setViolationMessage(
        "Ujian diakhiri karena pelanggaran mode pengawasan. Anda tidak dapat masuk lagi ke ujian ini. Silakan hubungi admin jika membutuhkan ujian ulang."
      );
      setViolationDialogOpen(true);
    },
    [attemptId, enterConnectionLost]
  );

  // Setelah koneksi pulih: masuk fullscreen dulu (harus dekat dengan klik user),
  // lalu kirim jejak offline ke server dan muat ulang attempt.
  const resumeAfterReconnect = React.useCallback(async () => {
    setResuming(true);
    setConnectionLostOpen(false);
    try {
      await activateFullscreen().catch(() => undefined);
      const offlineMs = offlineSinceRef.current ? Date.now() - offlineSinceRef.current : 0;
      const status = await examService.heartbeat(attemptId, {
        event: "connection_restored",
        payload: { offline_ms: offlineMs, offline_events: offlineEventsRef.current },
      });
      offlineSinceRef.current = null;
      offlineEventsRef.current = [];
      onlineRef.current = true;
      setOnline(true);
      if (status.status !== "in_progress") {
        router.replace(scheduleDetailHref);
        router.refresh();
        return;
      }
      void query.refetch();
    } catch (error) {
      if (isNetworkError(error)) {
        toast.error("Koneksi belum stabil, coba lagi.");
        enterConnectionLost();
      } else {
        toast.error(getApiErrorMessage(error));
      }
    } finally {
      setResuming(false);
    }
  }, [activateFullscreen, attemptId, enterConnectionLost, query, router, scheduleDetailHref]);

  const attemptRemaining = useExamTimer(attempt?.server_time, attempt?.expires_at, submit);

  React.useEffect(() => {
    if (!attempt) return;
    setAnswers(Object.fromEntries(attempt.answers.map((answer) => [answer.question_id, answer])));
  }, [attempt]);

  React.useEffect(() => {
    const onOffline = () => enterConnectionLost();
    const onOnline = () => {
      onlineRef.current = true;
      setOnline(true);
    };
    if (!navigator.onLine) enterConnectionLost();
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [enterConnectionLost]);

  React.useEffect(() => {
    if (!attempt || attempt.status !== "in_progress" || connectionLostOpen) return;
    const id = window.setInterval(() => {
      examService
        .heartbeat(attemptId)
        .then(() => {
          onlineRef.current = true;
          setOnline(true);
        })
        .catch((error) => {
          if (isNetworkError(error)) enterConnectionLost();
        });
    }, 30_000);
    return () => window.clearInterval(id);
  }, [attemptId, attempt, connectionLostOpen, enterConnectionLost]);

  // Selama overlay koneksi terbuka: poll server sampai bisa dihubungi, dan catat
  // event tab/fullscreen (tanpa menghentikan ujian) sebagai jejak audit.
  React.useEffect(() => {
    if (!connectionLostOpen || reconnected) return;

    const probe = () => {
      examService
        .heartbeat(attemptId)
        .then(() => setReconnected(true))
        .catch(() => undefined);
    };
    probe();
    const id = window.setInterval(probe, RECONNECT_POLL_MS);

    const record = (reason: string) => () => {
      if (reason === "tab_hidden" && !document.hidden) return;
      if (reason === "fullscreen_exit" && document.fullscreenElement) return;
      offlineEventsRef.current.push({ reason, at: new Date().toISOString() });
    };
    const onHidden = record("tab_hidden");
    const onFullscreen = record("fullscreen_exit");
    document.addEventListener("visibilitychange", onHidden);
    document.addEventListener("fullscreenchange", onFullscreen);

    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onHidden);
      document.removeEventListener("fullscreenchange", onFullscreen);
    };
  }, [attemptId, connectionLostOpen, reconnected]);

  React.useEffect(() => {
    if (!attempt || attempt.status !== "in_progress") return;
    if (strictInitialized.current === attemptId) return;
    strictInitialized.current = attemptId;

    void activateFullscreen(true).catch(() => undefined);
  }, [activateFullscreen, attempt, attemptId]);

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
    const anchorMs = attemptAnchorMs(attempt.started_at, attempt.paused_ms ?? 0);
    const elapsed = Math.max(0, serverNow - anchorMs);
    let cumulative = 0;
    let index = orderedSections.length - 1;

    for (let i = 0; i < orderedSections.length; i += 1) {
      cumulative += durationMs(orderedSections[i]);
      if (elapsed < cumulative) {
        index = i;
        break;
      }
    }

    const scheduledDeadline = anchorMs + cumulative;
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
      const anchorMs = attemptAnchorMs(attempt.started_at, attempt.paused_ms ?? 0);
      const nextDeadline = Math.min(
        sectionEndMs(orderedSections, nextIndex, anchorMs),
        attemptEnd
      );
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
      router.replace(scheduleDetailHref);
      router.refresh();
    }
  }, [attempt, result, router, scheduleDetailHref]);

  React.useEffect(() => {
    if (!attempt || attempt.status !== "in_progress" || !strictArmed) return;

    const onVisibilityChange = () => {
      if (document.hidden) {
        void handleViolation("tab_hidden", {
          event: "visibilitychange",
          visibilityState: document.visibilityState,
        });
      }
    };

    const onFullscreenChange = () => {
      if (!document.fullscreenElement) {
        void handleViolation("fullscreen_exit", { event: "fullscreenchange" });
      }
    };

    // window "blur" sengaja tidak dipakai: notifikasi OS, dialog browser, atau popup
    // jaringan memicunya tanpa peserta meninggalkan halaman ujian.
    document.addEventListener("visibilitychange", onVisibilityChange);
    document.addEventListener("fullscreenchange", onFullscreenChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, [attempt, handleViolation, strictArmed]);

  React.useEffect(() => {
    return () => {
      if (document.fullscreenElement) {
        void document.exitFullscreen().catch(() => undefined);
      }
    };
  }, []);

  if (query.isLoading) return <div className="p-8 text-sm text-muted-foreground">Memuat attempt...</div>;
  if (query.isError || !attempt) return <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{getApiErrorMessage(query.error)}</div>;
  if (result || attempt.status !== "in_progress") {
    return <div className="p-8 text-sm text-muted-foreground">Memuat hasil terbaru...</div>;
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
      <Dialog open={fullscreenPromptOpen} onOpenChange={() => undefined}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Aktifkan fullscreen</DialogTitle>
            <DialogDescription>
              Ujian hanya bisa dimulai dalam mode fullscreen. Aktifkan
              fullscreen untuk melanjutkan ke sesi ujian.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              onClick={() => void activateFullscreen()}
              disabled={fullscreenLoading}
            >
              {fullscreenLoading ? "Mengaktifkan..." : "Aktifkan Fullscreen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={strictNoticeOpen} onOpenChange={() => undefined}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Mode pengawasan strict aktif</DialogTitle>
            <DialogDescription>
              Anda tidak boleh keluar fullscreen, pindah tab, pindah window,
              minimize browser, atau membuka aplikasi lain selama ujian
              berlangsung.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Pelanggaran pertama akan langsung mengakhiri ujian dan status
            peserta dicatat sebagai selesai dengan pelanggaran. Jika koneksi
            internet terputus, jangan tutup atau refresh halaman ini; ujian
            akan dilanjutkan otomatis saat koneksi pulih.
          </div>
          <DialogFooter>
            <Button
              type="button"
              onClick={() => {
                if (!document.fullscreenElement) {
                  setStrictNoticeOpen(false);
                  setFullscreenPromptOpen(true);
                  return;
                }
                setStrictNoticeOpen(false);
                setStrictArmed(true);
              }}
            >
              Saya Mengerti, Mulai Tes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={connectionLostOpen} onOpenChange={() => undefined}>
        <DialogContent className="sm:max-w-lg" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>
              {reconnected ? "Koneksi pulih" : "Koneksi internet terputus"}
            </DialogTitle>
            <DialogDescription>
              {reconnected
                ? "Server sudah bisa dihubungi kembali. Klik tombol di bawah untuk masuk fullscreen dan melanjutkan ujian. Jawaban yang sudah tersimpan tetap ada."
                : "Jangan tutup atau refresh halaman ini. Sistem akan mencoba menghubungi server secara otomatis. Waktu ujian tetap berjalan selama koneksi terputus."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              onClick={() => void resumeAfterReconnect()}
              disabled={!reconnected || resuming}
            >
              {resuming
                ? "Menyambungkan..."
                : reconnected
                  ? "Lanjutkan Ujian"
                  : "Menunggu koneksi..."}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={violationDialogOpen} onOpenChange={() => undefined}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Ujian dihentikan</DialogTitle>
            <DialogDescription>{violationMessage}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              onClick={() => router.replace("/dashboard/peserta/my-schedules?status=all")}
            >
              Kembali ke Jadwal Tes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
