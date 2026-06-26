"use client";

import * as React from "react";
import Image from "next/image";
import { Clock, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { apiAssetUrl } from "@/lib/utils/api-asset";
import type { ExamQuestion, ExamSection } from "@/lib/types/exam";

type ExamWorkspaceProps = {
  title: string;
  accessLabel?: string;
  avatarLabel?: string;
  sections: ExamSection[];
  questions: ExamQuestion[];
  activeSectionId?: number | null;
  allowSectionSwitch?: boolean;
  currentId: number;
  selectedOptionId: number | null;
  answeredIds: Set<number>;
  flaggedIds: Set<number>;
  remainingMs?: number;
  timerMode?: "attempt" | "section";
  saving?: boolean;
  finishLabel?: string;
  finishDisabled?: boolean;
  footerStatus?: string;
  onCurrentIdChange: (id: number) => void;
  onSelectOption: (questionId: number, optionId: number) => void;
  onToggleFlag: (questionId: number) => void;
  onFinish: () => void;
};

function formatTimer(ms?: number) {
  if (ms == null) return "--:--";
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts = hours > 0 ? [hours, minutes, seconds] : [minutes, seconds];

  return parts.map((value) => String(value).padStart(2, "0")).join(":");
}

function sectionLabel(section: ExamSection, index: number) {
  return `Bagian ${section.order_number || index + 1}`;
}

export function ExamWorkspace({
  title,
  accessLabel = "Peserta",
  avatarLabel,
  sections,
  questions,
  activeSectionId: controlledActiveSectionId,
  allowSectionSwitch = true,
  currentId,
  selectedOptionId,
  answeredIds,
  flaggedIds,
  remainingMs,
  timerMode = "attempt",
  saving = false,
  finishLabel = "Selesaikan Sesi",
  finishDisabled = false,
  footerStatus,
  onCurrentIdChange,
  onSelectOption,
  onToggleFlag,
  onFinish,
}: ExamWorkspaceProps) {
  const [fontScale, setFontScale] = React.useState(1);
  const [activeSectionId, setActiveSectionId] = React.useState<number | null>(null);
  const current = questions.find((question) => question.id === currentId) ?? questions[0] ?? null;
  const effectiveActiveSectionId = controlledActiveSectionId ?? activeSectionId ?? current?.section_id ?? null;
  const currentSection = sections.find((section) => section.id === effectiveActiveSectionId) ?? sections[0] ?? null;
  const currentSectionIndex = currentSection ? sections.findIndex((section) => section.id === currentSection.id) : 0;
  const sectionQuestions = currentSection ? questions.filter((question) => question.section_id === currentSection.id) : questions;
  const currentInActiveSection = current && currentSection ? current.section_id === currentSection.id : false;
  const sectionQuestionIndex = currentInActiveSection ? sectionQuestions.findIndex((question) => question.id === current.id) : -1;
  const canGoPrev = sectionQuestionIndex > 0;
  const canGoNext = sectionQuestionIndex >= 0 && sectionQuestionIndex < sectionQuestions.length - 1;
  const avatarText = (avatarLabel || accessLabel).slice(0, 2).toUpperCase();
  const displayedRemainingMs = timerMode === "section" && remainingMs == null && currentSection
    ? currentSection.duration_minutes * 60_000
    : remainingMs;

  React.useEffect(() => {
    if (!activeSectionId && current?.section_id) {
      setActiveSectionId(current.section_id);
    }
  }, [activeSectionId, current?.section_id]);

  const goToSection = (sectionId: number) => {
    if (!allowSectionSwitch) return;
    setActiveSectionId(sectionId);
    const target = questions.find((question) => question.section_id === sectionId);
    if (target) onCurrentIdChange(target.id);
  };

  const goPrev = () => {
    if (canGoPrev) onCurrentIdChange(sectionQuestions[sectionQuestionIndex - 1].id);
  };

  const goNext = () => {
    if (canGoNext) onCurrentIdChange(sectionQuestions[sectionQuestionIndex + 1].id);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 h-16 border-b bg-white">
        <div className="mx-auto flex h-full items-center justify-between px-4 md:px-20">
          <Image src="/blue-logo.svg" alt="TPKA Logo" width={114} height={36} priority className="object-contain" />
        <div className="flex items-center gap-4">
          <div className="rounded-md border px-3 py-2 text-sm font-medium">
            <span className="text-muted-foreground">Akses:</span>{" "}
            {accessLabel}
          </div>
          <div className="grid h-9 w-9 place-items-center rounded-full bg-blue-100 text-sm font-semibold text-blue-900">{avatarText}</div>
        </div>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-4rem)] gap-0 lg:grid-cols-[1fr_332px]">
        <main className="space-y-5 p-4 md:p-8">
          <section className="rounded-xl border bg-white p-5 md:p-7">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <h1 className="text-xl font-bold">{currentSection ? sectionLabel(currentSection, currentSectionIndex) : title}</h1>
                {sections.map((section) => (
                  <button
                    key={section.id}
                    type="button"
                    disabled={!allowSectionSwitch && section.id !== currentSection?.id}
                    onClick={() => goToSection(section.id)}
                    className={cn(
                      "rounded-lg px-4 py-2 text-sm font-semibold transition",
                      section.id === currentSection?.id ? "bg-blue-100 text-blue-900" : "bg-muted text-muted-foreground hover:bg-blue-50 hover:text-blue-900",
                      !allowSectionSwitch && section.id !== currentSection?.id ? "cursor-not-allowed opacity-50 hover:bg-muted hover:text-muted-foreground" : ""
                    )}
                  >
                    Soal {section.name}
                  </button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                {currentSection ? `Waktu pengerjaan soal ${currentSection.name} adalah ${currentSection.duration_minutes} menit.` : title}
              </p>
            </div>
          </section>

          {!currentInActiveSection ? (
            <section className="rounded-xl border bg-white p-8 text-sm text-muted-foreground">
              Belum ada soal di section {currentSection?.name ?? "ini"}.
            </section>
          ) : (
            <section className="min-h-[640px] rounded-xl border bg-white p-5 md:p-7">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="text-base font-medium">Soal {sectionQuestionIndex + 1}</div>
                <button
                  type="button"
                  onClick={() => onToggleFlag(current.id)}
                  className={cn(
                    "inline-flex items-center gap-2 text-sm font-semibold",
                    flaggedIds.has(current.id) ? "text-red-700" : "text-destructive"
                  )}
                >
                  <Flag className={cn("h-4 w-4", flaggedIds.has(current.id) ? "fill-current" : "")} />
                  Flag Question
                </button>
              </div>

              <div style={{ fontSize: `${fontScale}rem` }} className="space-y-6">
                {current.question_text ? (
                  <p className="max-w-5xl whitespace-pre-wrap text-[1.05em] font-normal leading-8 tracking-normal text-slate-800">
                    {current.question_text}
                  </p>
                ) : null}
                {apiAssetUrl(current.question_image) ? (
                  <img src={apiAssetUrl(current.question_image)!} alt="Gambar soal" className="max-h-[420px] rounded-lg border object-contain" />
                ) : null}

                <div className="grid gap-4 md:grid-cols-2">
                  {current.options.map((option) => {
                    const imageUrl = apiAssetUrl(option.option_image);
                    const selected = selectedOptionId === option.id;

                    return (
                      <button
                        key={option.id}
                        type="button"
                        disabled={saving}
                        onClick={() => onSelectOption(current.id, option.id)}
                        className={cn(
                          "group min-h-16 rounded-lg border px-5 py-4 text-left text-[1em] transition",
                          selected ? "border-[#013880] bg-blue-50 ring-1 ring-[#013880]" : "bg-white hover:border-blue-900 hover:bg-blue-50"
                        )}
                      >
                        <span className="flex items-start gap-3">
                          <span
                            className={cn(
                              "mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border text-sm font-semibold",
                              selected ? "border-[#013880] bg-[#013880] text-white" : "bg-white text-blue-900 group-hover:border-blue-900"
                            )}
                          >
                            {option.option_label}
                          </span>
                          <span className="pt-0.5 font-normal leading-7 text-slate-800">
                            {option.option_text}
                          </span>
                        </span>
                        {imageUrl ? <img src={imageUrl} alt={`Opsi ${option.option_label}`} className="mt-3 max-h-44 rounded border bg-white object-contain" /> : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          <section className="rounded-xl border bg-white p-5">
            <div className="flex items-center justify-between">
              <Button type="button" variant="outline" onClick={goPrev} disabled={!canGoPrev}>Previous</Button>
              <div className="text-xs text-muted-foreground">{saving ? "Menyimpan jawaban..." : footerStatus}</div>
              <Button type="button" variant="outline" onClick={goNext} disabled={!canGoNext}>Next</Button>
            </div>
          </section>
        </main>

        <aside className="border-l bg-white p-5">
          <div className="sticky top-5 space-y-5">
            <section>
              <div className="mb-2 flex items-center gap-2 text-lg font-bold">
                <Clock className="h-5 w-5" />
                Sisa Waktu
              </div>
              <div className="rounded-md border px-4 py-2 text-center font-mono text-3xl font-bold">{formatTimer(displayedRemainingMs)}</div>
              <p className="mt-2 text-sm text-muted-foreground">Selesaikan sebelum waktu anda habis</p>
            </section>

            <section className="grid grid-cols-5 gap-2">
              {sectionQuestions.map((question, index) => {
                const active = currentInActiveSection && question.id === current?.id;
                const answered = answeredIds.has(question.id);
                const flagged = flaggedIds.has(question.id);

                return (
                  <button
                    key={question.id}
                    type="button"
                    onClick={() => onCurrentIdChange(question.id)}
                    title={flagged ? "Ditandai" : answered ? "Terjawab" : "Belum dijawab"}
                    className={cn(
                      "relative h-12 rounded-lg border text-sm font-semibold transition",
                      active || answered ? "border-[#013880] bg-[#013880] text-white" : "bg-white text-blue-900 hover:bg-blue-50"
                    )}
                  >
                    {index + 1}
                    {flagged ? <span className="absolute bottom-1 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded bg-red-500" /> : null}
                  </button>
                );
              })}
            </section>

            <section className="grid grid-cols-2 gap-3">
              <Button type="button" variant="outline" onClick={() => setFontScale((value) => Math.min(1.35, value + 0.1))}>A^ Upsize</Button>
              <Button type="button" variant="outline" onClick={() => setFontScale((value) => Math.max(0.85, value - 0.1))}>A˅ Downsize</Button>
            </section>

            <Button
              type="button"
              className="h-12 w-full"
              onClick={onFinish}
              disabled={finishDisabled}
            >
              {finishLabel}
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
