"use client";

import * as React from "react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { getApiErrorMessage } from "@/lib/api/errors";
import { questionsService } from "@/lib/services/questions.service";
import type { ImportQuestionsResponse } from "@/lib/types/questions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ImportQuestionsDialog({
  packageId,
  disabled = false,
}: {
  packageId: number;
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [result, setResult] = React.useState<ImportQuestionsResponse | null>(null);
  const qc = useQueryClient();

  const importMutation = useMutation({
    mutationFn: () => {
      if (!file) throw new Error("Pilih file CSV terlebih dahulu.");
      return questionsService.importCsv(packageId, file);
    },
    onSuccess: (res) => {
      setResult(res);
      toast.success(res.message ?? "Import selesai");
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
      const blob = await questionsService.downloadTemplate(packageId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "template-import-soal-tpa.csv";
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
          <DialogTitle>Import Soal CSV</DialogTitle>
          <DialogDescription>
            Import bersifat all-or-nothing. Jika ada row invalid, tidak ada soal yang disimpan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-3 text-sm">
            <div className="font-medium">Kolom CSV</div>
            <div className="mt-1 text-muted-foreground">
              section_code, order_number, question_text, question_image, option_a_text, option_a_image,
              option_b_text, option_b_image, option_c_text, option_c_image, option_d_text, option_d_image,
              correct_option, score.
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={downloadTemplate}>
              Download Template
            </Button>
          </div>

          <div className="space-y-2">
            <Label>File CSV</Label>
            <Input type="file" accept=".csv,text/csv" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Tutup</Button>
            <Button type="button" onClick={() => importMutation.mutate()} disabled={importMutation.isPending || !file}>
              {importMutation.isPending ? "Mengimport..." : "Import"}
            </Button>
          </div>

          {result ? (
            <div className="rounded-lg border p-3 text-sm">
              <div className="font-medium">Hasil Import</div>
              <div className="mt-1">Berhasil: {result.imported} row, Gagal: {result.failed}</div>
              {result.errors.length ? (
                <div className="mt-3 max-h-56 overflow-auto rounded border">
                  {result.errors.map((error, index) => (
                    <div key={`${error.row}-${error.field}-${index}`} className="border-b p-2 last:border-b-0">
                      Row {error.row} - {error.field}: {error.message}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
