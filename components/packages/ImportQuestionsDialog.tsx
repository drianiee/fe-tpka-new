"use client";

import * as React from "react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { getApiErrorMessage } from "@/lib/api/errors";
import { questionsService } from "@/lib/services/questions.service";
import type { ImportQuestionsResponse } from "@/lib/types/questions";
import type { ExamSection } from "@/lib/types/question-packages";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "subtes";
}

export function ImportQuestionsDialog({
  packageId,
  section,
  disabled = false,
}: {
  packageId: number;
  section: ExamSection;
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [result, setResult] = React.useState<ImportQuestionsResponse | null>(null);
  const qc = useQueryClient();

  const remaining = Math.max(
    0,
    (section.target_question_count ?? 0) - (section.question_count ?? 0),
  );

  // Ganti subtes berarti file sebelumnya tidak relevan lagi.
  React.useEffect(() => {
    setFile(null);
    setResult(null);
  }, [section.id]);

  const importMutation = useMutation({
    mutationFn: () => {
      if (!file) throw new Error("Pilih file Excel terlebih dahulu.");
      return questionsService.importFile(section.id, file);
    },
    onSuccess: (res) => {
      setResult(res);
      // Import atomik per sheet, jadi sebagian sheet bisa gagal walau responsnya 2xx.
      if (res.errors?.length) toast.warning(res.message ?? "Sebagian sheet ditolak");
      else toast.success(res.message ?? "Import selesai");
      qc.invalidateQueries({ queryKey: [API_ENDPOINTS.QUESTION_PACKAGES.DETAIL(packageId)] });
      qc.invalidateQueries({ queryKey: [API_ENDPOINTS.QUESTION_PACKAGES.QUESTIONS(packageId)] });
    },
    onError: (e) => {
      const response = (e as { response?: { data?: ImportQuestionsResponse } }).response?.data;
      if (response?.errors) setResult(response);
      toast.error(getApiErrorMessage(e));
    },
  });

  const downloadTemplate = async () => {
    try {
      const { blob, filename } = await questionsService.downloadTemplate(
        section.id,
        `template-soal-${slugify(section.name)}.xlsx`,
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" disabled={disabled}>
          Import Soal
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Soal {section.name}</DialogTitle>
          <DialogDescription>
            Soal yang diimport di sini semuanya masuk ke subtes {section.name}. Subtes lain
            diimport terpisah dengan templatenya sendiri.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
            <span className="font-medium">Tujuan import: subtes {section.name}</span>
            <span className="text-blue-700">
              — sisa jatah {remaining} dari {section.target_question_count ?? 0} soal
            </span>
          </div>

          <div className="rounded-lg border bg-muted/30 p-3 text-sm">
            <div className="font-medium">Cara pakai</div>
            <ol className="mt-2 list-decimal space-y-1 pl-4 text-muted-foreground">
              <li>Unduh template di bawah, lalu buka dengan Excel atau Google Sheets.</li>
              <li>
                Isi sheet <span className="font-medium text-foreground">{section.name}</span> — satu
                baris untuk satu soal. Kolom Kunci Jawaban tinggal dipilih dari dropdown.
              </li>
              <li>
                Mau sekalian subtes lain? Tambahkan sheet baru dan beri nama sesuai subtesnya
                (Verbal, Kuantitatif, Logika, Spasial). Tiap sheet masuk ke subtesnya sendiri.
              </li>
              <li>
                Kalau pilihan jawabannya berupa gambar (biasanya Spasial), isi Pertanyaan dan Kunci
                Jawaban saja, biarkan kolom pilihan kosong. Gambarnya dilengkapi lewat tombol Edit
                pada soal itu.
              </li>
              <li>
                Sheet <span className="font-medium text-foreground">Petunjuk</span> berisi arti tiap
                kolom, dan sheet <span className="font-medium text-foreground">Contoh</span> berisi
                soal jadi sebagai acuan — keduanya diabaikan saat import.
              </li>
              <li>Simpan file, lalu unggah di sini.</li>
            </ol>
            <p className="mt-2 text-xs text-muted-foreground">
              Tidak ada kolom subtes di template. Nama sheet-lah yang menentukan soal masuk ke
              subtes mana, jadi tidak mungkin tertukar.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              File ini tidak punya kolom gambar. Soal yang pertanyaannya sendiri berupa gambar
              ditambahkan lewat tombol Tambah Soal.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={downloadTemplate}>
              Unduh Template {section.name}
            </Button>
          </div>

          <div className="space-y-2">
            <Label>File soal {section.name}</Label>
            <Input
              type="file"
              accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-muted-foreground">
              Format Excel (.xlsx) disarankan. File CSV lama tetap bisa diunggah.
            </p>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Import bersifat semua-atau-tidak-sama-sekali. Jika ada satu baris yang salah, tidak ada
            soal yang disimpan.
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Tutup</Button>
            <Button type="button" onClick={() => importMutation.mutate()} disabled={importMutation.isPending || !file}>
              {importMutation.isPending ? "Mengimport..." : `Import ke ${section.name}`}
            </Button>
          </div>

          {result?.results?.length ? (
            <div className="rounded-lg border p-3 text-sm">
              <div className="font-medium">Rincian per sheet</div>
              <div className="mt-2 space-y-1">
                {result.results.map((row) => (
                  <div key={row.sheet} className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">
                      Sheet <span className="font-medium text-foreground">{row.sheet}</span> →{" "}
                      {row.section}
                    </span>
                    <span className={row.failed ? "font-medium text-red-700" : "text-foreground"}>
                      {row.failed
                        ? "ditolak"
                        : `${row.imported} soal${row.blank_options ? ` (${row.blank_options} perlu gambar)` : ""}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {result?.errors.length ? (
            <div className="rounded-lg border border-red-200 p-3 text-sm">
              <div className="font-medium text-red-700">Baris yang perlu diperbaiki</div>
              <div className="mt-2 max-h-56 overflow-auto rounded border">
                {result.errors.map((error, index) => (
                  <div key={`${error.sheet}-${error.row}-${error.field}-${index}`} className="border-b p-2 last:border-b-0">
                    {error.sheet ? `[${error.sheet}] ` : ""}Baris {error.row} — {error.field}:{" "}
                    {error.message}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
