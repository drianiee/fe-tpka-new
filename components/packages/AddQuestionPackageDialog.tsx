"use client";

import * as React from "react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { getApiErrorMessage } from "@/lib/api/errors";
import { questionPackagesService } from "@/lib/services/questionPackages.service";
import type { SectionCode } from "@/lib/types/question-packages";
import { Button } from "@/components/ui/button";
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

const DEFAULT_SECTIONS: Array<{
  code: SectionCode;
  name: string;
  duration_minutes: number;
  target_question_count: number;
}> = [
  {
    code: "verbal",
    name: "Verbal",
    duration_minutes: 25,
    target_question_count: 50,
  },
  {
    code: "kuantitatif",
    name: "Kuantitatif",
    duration_minutes: 60,
    target_question_count: 70,
  },
  {
    code: "logika",
    name: "Logika",
    duration_minutes: 40,
    target_question_count: 60,
  },
  {
    code: "spasial",
    name: "Spasial",
    duration_minutes: 25,
    target_question_count: 20,
  },
];

export function AddQuestionPackageDialog() {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [baseScore, setBaseScore] = React.useState(200);
  const [scoreSpan, setScoreSpan] = React.useState(600);
  const [sections, setSections] = React.useState(DEFAULT_SECTIONS);
  const qc = useQueryClient();

  const totalDuration = sections.reduce(
    (sum, section) => sum + section.duration_minutes,
    0,
  );
  const totalTarget = sections.reduce(
    (sum, section) => sum + section.target_question_count,
    0,
  );

  const reset = () => {
    setName("");
    setBaseScore(200);
    setScoreSpan(600);
    setSections(DEFAULT_SECTIONS);
  };

  const mutation = useMutation({
    mutationFn: () => {
      if (!name.trim()) throw new Error("Nama paket wajib diisi.");
      return questionPackagesService.create({
        name: name.trim(),
        total_duration_minutes: totalDuration,
        target_total_questions: totalTarget,
        base_score: Math.max(0, baseScore || 0),
        score_span: Math.max(0, scoreSpan || 0),
        sections: sections.map(
          ({ code, duration_minutes, target_question_count }) => ({
            code,
            duration_minutes,
            target_question_count,
          }),
        ),
      });
    },
    onSuccess: (res) => {
      toast.success(res.message ?? "Paket dibuat");
      qc.invalidateQueries({
        queryKey: [API_ENDPOINTS.QUESTION_PACKAGES.BASE],
      });
      setOpen(false);
      reset();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const updateSection = (
    code: SectionCode,
    key: "duration_minutes" | "target_question_count",
    value: number,
  ) => {
    setSections((current) =>
      current.map((section) =>
        section.code === code
          ? { ...section, [key]: Math.max(0, value || 0) }
          : section,
      ),
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>+ Tambah Paket</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tambah Paket Soal</DialogTitle>
          <DialogDescription>
            Durasi dan target soal per subtes bisa diatur di sini.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nama Paket</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Paket TPA A"
            />
          </div>
                    <div className="rounded-xl border p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="font-medium">Pembagian Subtes</div>
              <div className="text-sm text-muted-foreground">
                {totalDuration} menit / {totalTarget} soal
              </div>
            </div>
            <div className="grid gap-3">
              {sections.map((section) => (
                <div
                  key={section.code}
                  className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[1fr_140px_140px] sm:items-end"
                >
                  <div className="sm:self-center">
                    <div className="font-medium">{section.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {section.code}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Durasi menit</Label>
                    <Input
                      type="number"
                      min={1}
                      value={section.duration_minutes}
                      onChange={(e) =>
                        updateSection(
                          section.code,
                          "duration_minutes",
                          Number(e.target.value),
                        )
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Jumlah soal</Label>
                    <Input
                      type="number"
                      min={0}
                      value={section.target_question_count}
                      onChange={(e) =>
                        updateSection(
                          section.code,
                          "target_question_count",
                          Number(e.target.value),
                        )
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border p-4">
            <div className="mb-3">
              <div className="font-medium">Konfigurasi Skor</div>
              <div className="text-sm text-muted-foreground">
                Atur nilai awal subtes dan rentang kenaikan skor sampai nilai maksimum.
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nilai dasar subtes</Label>
                <Input
                  type="number"
                  min={0}
                  value={baseScore}
                  onChange={(e) =>
                    setBaseScore(Math.max(0, Number(e.target.value) || 0))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Nilai yang tetap didapat peserta jika tidak ada jawaban benar.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Rentang kenaikan skor</Label>
                <Input
                  type="number"
                  min={0}
                  value={scoreSpan}
                  onChange={(e) =>
                    setScoreSpan(Math.max(0, Number(e.target.value) || 0))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Nilai tambahan dari 0% sampai 100% jawaban benar.
                </p>
              </div>
            </div>
            <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm">
              <div className="font-medium">
                Nilai maksimum subtes: {baseScore + scoreSpan}
              </div>
              <div className="mt-1 text-muted-foreground">
                Rumus:{" "}
                <code>{`round(${baseScore} + (benar / total_soal) × ${scoreSpan})`}</code>
              </div>
              <div className="mt-1 text-muted-foreground">
                Skor total TPKA = rata-rata seluruh skor subtes, lalu dibulatkan ke bilangan bulat.
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-dashed p-4 text-sm">
            <div className="font-medium">Skoring TPKA Otomatis</div>
            <div className="mt-2 space-y-1 text-muted-foreground">
              <div>
                Setiap subtes memakai nilai dasar {baseScore} dan nilai maksimum{" "}
                {baseScore + scoreSpan}.
              </div>
              <div>
                Rumus per subtes:{" "}
                <code>{`round(${baseScore} + (benar / total_soal) × ${scoreSpan})`}</code>
              </div>
              <div>Skor total dihitung dari rata-rata 4 skor subtes.</div>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {sections.map((section) => (
                <div key={section.code} className="rounded-lg border bg-white p-3">
                  <div className="font-medium">{section.name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {`round(${baseScore} + (benar / ${section.target_question_count || 0}) × ${scoreSpan})`}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              Perhitungan skor final wajib dilakukan di backend. Frontend hanya menampilkan hasil.
            </div>
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
              disabled={mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
