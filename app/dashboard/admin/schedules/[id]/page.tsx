// app/dashboard/admin/schedules/[id]/page.tsx
"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { schedulesService } from "@/lib/services/schedules.service";
import { participantsService } from "@/lib/services/participants.service";
import type { PartnerImportResponse } from "@/lib/types/schedules";
import type {
  AddParticipantRequest,
  ScheduleDetail,
  ScheduleParticipant,
} from "@/lib/types/schedules";
import type { ParticipantListItem } from "@/lib/types/participants";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { getApiErrorMessage } from "@/lib/api/errors";
import { formatRupiah, hhmm } from "@/lib/utils/format";
import { formatDateId, formatDateTime } from "@/lib/utils/datetime";
import { downloadWithBearer, openWithBearer } from "@/lib/utils/download";

import { PageHeaderLayout } from "@/components/layouts/PageHeaderLayout";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import { DataTable, type DataTableColumn } from "@/components/common/DataTable";

function useDebouncedValue<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);

  return debounced;
}

const importSchema = z.object({
  file: z
    .instanceof(File, { message: "File wajib di-upload" })
    .refine((f) => /\.(xlsx|xls)$/i.test(f.name), "File harus .xlsx / .xls"),
});

type ImportForm = z.infer<typeof importSchema>;

const addParticipantSchema = z
  .object({
    user_id: z.number().nullable().optional(),
    email: z.string().trim().email("Email peserta tidak valid."),
    name: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.user_id && !data.name) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["name"],
        message: "Nama peserta wajib diisi untuk email baru.",
      });
    }
  });

type AddParticipantForm = z.infer<typeof addParticipantSchema>;

function importSummaryText(res: PartnerImportResponse) {
  const s = res.summary;
  if (!s) return "";
  const parts: string[] = [];
  if (typeof s.attached_to_schedule === "number")
    parts.push(`Terpasang: ${s.attached_to_schedule}`);
  if (typeof s.created_users === "number") parts.push(`User dibuat: ${s.created_users}`);
  if (typeof s.sent_invitations === "number")
    parts.push(`Invitation: ${s.sent_invitations}`);
  if (typeof s.skipped_rows === "number") parts.push(`Skip: ${s.skipped_rows}`);
  return parts.join(" • ");
}

function scoreCell(v?: number | null) {
  if (v === null || v === undefined) return "-";
  return String(v);
}
function resolveDetailScheduleWindowStatus(schedule: Pick<ScheduleDetail, "date" | "end_time">) {
  const now = new Date();
  const startAt = schedule.date ? new Date(schedule.date) : null;

  let endAt: Date | null = null;
  if (startAt && schedule.end_time) {
    const [hours = "0", minutes = "0", seconds = "0"] = schedule.end_time.split(":");
    endAt = new Date(startAt);
    endAt.setHours(Number(hours), Number(minutes), Number(seconds), 0);
  }

  if (!startAt || !endAt) {
    return { label: "-", variant: "muted" as const };
  }

  if (now < startAt) {
    return { label: "Belum Dimulai", variant: "muted" as const };
  }

  if (now >= endAt) {
    return { label: "Selesai", variant: "success" as const };
  }

  return { label: "Sedang Berlangsung", variant: "warning" as const };
}

function hasScheduleStarted(schedule: Pick<ScheduleDetail, "date">) {
  const startAt = schedule.date ? new Date(schedule.date) : null;
  if (!startAt) return false;

  return Date.now() >= startAt.getTime();
}

function normalizeStatus(status?: string | null) {
  return (status ?? "").trim().toLowerCase();
}

function statusVariant(status?: string | null): "muted" | "warning" | "success" {
  const s = normalizeStatus(status);
  if (!s) return "muted";
  if (s === "peserta belum terdaftar") return "muted";
  if (s === "peserta terdaftar") return "success";
  if (s === "peserta mengakses tes") return "warning";
  if (s === "peserta selesai tes") return "success";
  return "muted";
}

function statusLabel(status?: string | null) {
  const s = normalizeStatus(status);
  if (!s) return "-";
  if (s === "peserta belum terdaftar") return "Peserta Belum Terdaftar";
  if (s === "peserta terdaftar") return "Peserta Terdaftar";
  if (s === "peserta mengakses tes") return "Peserta Mengakses Tes";
  if (s === "peserta selesai tes") return "Peserta Selesai Tes";
  return status ?? "-";
}

function buildPages(page: number, lastPage: number) {
  const total = Math.max(1, lastPage);
  const current = Math.min(Math.max(1, page), total);
  const windowSize = 1;

  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1) as Array<number | "ellipsis">;
  }

  const start = Math.max(2, current - windowSize);
  const end = Math.min(total - 1, current + windowSize);

  const result: Array<number | "ellipsis"> = [1];
  if (start > 2) result.push("ellipsis");
  for (let p = start; p <= end; p++) result.push(p);
  if (end < total - 1) result.push("ellipsis");
  result.push(total);

  return result;
}

const VIOLATION_REASON_LABEL: Record<string, string> = {
  tab_hidden: "Pindah tab / minimize browser",
  fullscreen_exit: "Keluar dari fullscreen",
  window_blur: "Jendela kehilangan fokus",
};

function violationReasonLabel(reason?: string | null) {
  if (!reason) return "-";
  return VIOLATION_REASON_LABEL[reason] ?? reason;
}

function formatRemaining(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes} menit ${seconds} detik`;
}

export default function AdminScheduleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const scheduleId = Number(id);
  const [importOpen, setImportOpen] = React.useState(false);
  const [addParticipantOpen, setAddParticipantOpen] = React.useState(false);
  const [participantSearch, setParticipantSearch] = React.useState("");
  const [participantEmailDropdownOpen, setParticipantEmailDropdownOpen] =
    React.useState(false);
  const [retakeDialogOpen, setRetakeDialogOpen] = React.useState(false);
  const [retakeCandidate, setRetakeCandidate] =
    React.useState<ScheduleParticipant | null>(null);
  const [resumeDialogOpen, setResumeDialogOpen] = React.useState(false);
  const [resumeCandidate, setResumeCandidate] =
    React.useState<ScheduleParticipant | null>(null);

  const [qText, setQText] = React.useState("");
  const qDebounced = useDebouncedValue(qText, 350);

  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(10);

  React.useEffect(() => {
    setPage(1);
  }, [qDebounced, perPage]);

  const params = React.useMemo(
    () => ({
      q: qDebounced.trim() || undefined,
      per_page: perPage,
      page,
    }),
    [qDebounced, perPage, page]
  );

  const exportParticipantsMut = useMutation({
    mutationFn: () =>
      schedulesService.exportParticipants(scheduleId, { q: params.q }),
    onSuccess: ({ blob, filename }) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Berhasil export peserta");
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const downloadCertMut = useMutation({
    mutationFn: (url: string) => openWithBearer(url),
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });
  const retakeMut = useMutation({
    mutationFn: (userId: number) => schedulesService.grantRetake(scheduleId, userId),
    onSuccess: (res) => {
      toast.success(res.message ?? "Peserta diizinkan mengulang ujian");
      qc.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          q.queryKey[0] === API_ENDPOINTS.SCHEDULES.DETAIL(scheduleId),
      });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const resumeMut = useMutation({
    mutationFn: (userId: number) => schedulesService.grantResume(scheduleId, userId),
    onSuccess: (res) => {
      toast.success(res.message ?? "Peserta diizinkan melanjutkan ujian");
      qc.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          q.queryKey[0] === API_ENDPOINTS.SCHEDULES.DETAIL(scheduleId),
      });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  // ✅ per-row loading (biar nggak disable semua tombol)
  const [downloadingUrl, setDownloadingUrl] = React.useState<string | null>(null);
  const [retakingUserId, setRetakingUserId] = React.useState<number | null>(null);
  const [resumingUserId, setResumingUserId] = React.useState<number | null>(null);

  const handleDownloadCert = React.useCallback(
    async (url: string) => {
      try {
        setDownloadingUrl(url);
        await downloadCertMut.mutateAsync(url);
      } finally {
        setDownloadingUrl(null);
      }
    },
    [downloadCertMut]
  );

  const handleOpenRetakeDialog = React.useCallback(
    (participant: ScheduleParticipant) => {
      setRetakeCandidate(participant);
      setRetakeDialogOpen(true);
    },
    []
  );

  const handleOpenResumeDialog = React.useCallback(
    (participant: ScheduleParticipant) => {
      setResumeCandidate(participant);
      setResumeDialogOpen(true);
    },
    []
  );

  const handleConfirmResume = React.useCallback(async () => {
    if (!resumeCandidate) return;

    try {
      setResumingUserId(resumeCandidate.id);
      await resumeMut.mutateAsync(resumeCandidate.id);
      setResumeDialogOpen(false);
      setResumeCandidate(null);
    } finally {
      setResumingUserId(null);
    }
  }, [resumeCandidate, resumeMut]);

  const handleConfirmRetake = React.useCallback(async () => {
    if (!retakeCandidate) return;

    try {
      setRetakingUserId(retakeCandidate.id);
      await retakeMut.mutateAsync(retakeCandidate.id);
      setRetakeDialogOpen(false);
      setRetakeCandidate(null);
    } finally {
      setRetakingUserId(null);
    }
  }, [retakeCandidate, retakeMut]);

  const columns = React.useMemo<DataTableColumn<ScheduleParticipant>[]>(() => {
    return [
      {
        key: "no",
        header: "No",
        headerClassName: "w-11 text-center",
        className: "whitespace-nowrap text-center",
        cell: (_row, idx) => (page - 1) * perPage + (idx + 1),
      },
      {
        key: "name",
        header: "Nama",
        headerClassName: "w-35",
        className: "truncate font-medium",
        cell: (row) => (
          <div className="truncate" title={row.name}>
            {row.name}
          </div>
        ),
      },
      {
        key: "email",
        header: "Email",
        headerClassName: "w-42.5",
        className: "truncate",
        cell: (row) => (
          <div className="truncate" title={row.email}>
            {row.email}
          </div>
        ),
      },
      {
        key: "status",
        header: "Status Peserta",
        headerClassName: "w-32.5 text-center",
        className: "truncate text-center",
        cell: (row) => {
          const label = row.status_label ?? statusLabel(row.status);
          const variant = row.status_variant ?? statusVariant(row.status);

          return (
            <div className="flex justify-center">
              <Badge variant={variant} className="capitalize whitespace-nowrap">
                {label}
              </Badge>
            </div>
          );
        },
      },
      {
        key: "package",
        header: "Paket",
        headerClassName: "w-28 text-center",
        className: "text-center whitespace-nowrap",
        cell: (row) => (
          row.question_package ? (
            <Badge variant="outline" className="max-w-28 truncate">
              {row.question_package.name}
            </Badge>
          ) : (
            <span className="text-sm text-muted-foreground">-</span>
          )
        ),
      },
      {
        key: "verbal",
        header: "Verbal",
        headerClassName: "w-14.5 text-center",
        className: "text-center whitespace-nowrap",
        cell: (row) => scoreCell(row.scores?.verbal),
      },
      {
        key: "kuantitatif",
        header: "Kuantitatif",
        headerClassName: "w-14.5 text-center",
        className: "text-center whitespace-nowrap",
        cell: (row) => scoreCell(row.scores?.kuantitatif),
      },
      {
        key: "logika",
        header: "Logika",
        headerClassName: "w-14.5 text-center",
        className: "text-center whitespace-nowrap",
        cell: (row) => scoreCell(row.scores?.logika),
      },
      {
        key: "spasial",
        header: "Spatial",
        headerClassName: "w-14.5 text-center",
        className: "text-center whitespace-nowrap",
        cell: (row) => scoreCell(row.scores?.spasial),
      },
      {
        key: "total",
        header: "Total",
        headerClassName: "w-14.5 text-center",
        className: "text-center whitespace-nowrap",
        cell: (row) => scoreCell(row.scores?.total),
      },
      {
        key: "certificate",
        header: "Sertifikat",
        headerClassName: "w-30 text-center",
        className: "text-center whitespace-nowrap",
        cell: (row) => {
          const certUrl = row.certificate_download_url ?? null;
          const isRowDownloading = Boolean(certUrl && downloadingUrl === certUrl);

          return certUrl ? (
            <Button
              size="sm"
              variant="outline"
              disabled={isRowDownloading}
              onClick={() => handleDownloadCert(certUrl)}
            >
              {isRowDownloading ? "Membuka..." : "Unduh"}
            </Button>
          ) : (
            <span className="text-sm text-muted-foreground">-</span>
          );
        },
      },
      {
        key: "actions",
        header: "Aksi",
        headerClassName: "w-56 text-center",
        className: "text-center whitespace-nowrap",
        cell: (row) => {
          const pending = retakingUserId === row.id && retakeMut.isPending;
          const resumePending = resumingUserId === row.id && resumeMut.isPending;
          const certificateIssued = Boolean(row.certificate_issued_at);
          const canResume = Boolean(row.can_resume) && !certificateIssued;

          return (
            <div className="flex items-center justify-center gap-2">
              {canResume ? (
                <Button
                  size="sm"
                  variant="blue"
                  disabled={resumePending || pending}
                  title="Lanjutkan attempt yang terhenti: jawaban dan sisa waktu dipertahankan."
                  onClick={() => handleOpenResumeDialog(row)}
                >
                  {resumePending ? "Memproses..." : "Lanjutkan Tes"}
                </Button>
              ) : null}
              <Button
                size="sm"
                variant="red"
                disabled={pending || resumePending || certificateIssued || row.can_retake === false}
                title={
                  certificateIssued
                    ? "Sertifikat sudah terbit, peserta tidak dapat mengulang tes."
                    : undefined
                }
                onClick={() => handleOpenRetakeDialog(row)}
              >
                {pending ? "Memproses..." : "Ulangi Tes"}
              </Button>
            </div>
          );
        },
      },
    ];
  }, [
    page,
    perPage,
    downloadingUrl,
    handleDownloadCert,
    handleOpenRetakeDialog,
    handleOpenResumeDialog,
    retakeMut,
    retakingUserId,
    resumeMut,
    resumingUserId,
  ]);

  const detailQuery = useQuery({
    queryKey: [API_ENDPOINTS.SCHEDULES.DETAIL(scheduleId), params],
    queryFn: () => schedulesService.detail(scheduleId, params),
    enabled: Number.isFinite(scheduleId),
    placeholderData: keepPreviousData,
  });

  const importForm = useForm<ImportForm>({
    resolver: zodResolver(importSchema),
    defaultValues: {},
    mode: "onSubmit",
  });

  const addParticipantForm = useForm<AddParticipantForm>({
    resolver: zodResolver(addParticipantSchema),
    defaultValues: {
      user_id: null,
      email: "",
      name: "",
    },
    mode: "onSubmit",
  });

  const participantLookupQuery = useQuery({
    queryKey: [API_ENDPOINTS.PARTICIPANTS.BASE, participantSearch],
    queryFn: () =>
      participantsService.list({
        q: participantSearch.trim(),
        per_page: 10,
        page: 1,
      }),
    enabled: addParticipantOpen && participantSearch.trim().length >= 1,
    placeholderData: keepPreviousData,
  });

  const watchedParticipantEmail = addParticipantForm.watch("email");
  const selectedExistingParticipant = React.useMemo<ParticipantListItem | null>(() => {
    const email = watchedParticipantEmail?.trim().toLowerCase();
    if (!email) return null;

    return (
      participantLookupQuery.data?.data.find(
        (participant) => participant.email.trim().toLowerCase() === email
      ) ?? null
    );
  }, [participantLookupQuery.data, watchedParticipantEmail]);
  const participantSuggestions = participantLookupQuery.data?.data ?? [];

  React.useEffect(() => {
    if (!addParticipantOpen) return;

    if (selectedExistingParticipant) {
      addParticipantForm.setValue("user_id", selectedExistingParticipant.id, {
        shouldDirty: true,
        shouldValidate: true,
      });
      addParticipantForm.setValue("name", selectedExistingParticipant.name, {
        shouldDirty: true,
        shouldValidate: true,
      });
      return;
    }

    addParticipantForm.setValue("user_id", null, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }, [addParticipantForm, addParticipantOpen, selectedExistingParticipant]);

  const importMut = useMutation({
    mutationFn: (file: File) => schedulesService.partnerImport(scheduleId, file),
    onSuccess: (res) => {
      const sum = importSummaryText(res);
      toast.success(sum ? `${res.message} (${sum})` : res.message ?? "Import berhasil");

      qc.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          q.queryKey[0] === API_ENDPOINTS.SCHEDULES.DETAIL(scheduleId),
      });

      importForm.reset();
      setImportOpen(false);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const addParticipantMut = useMutation({
    mutationFn: (payload: AddParticipantRequest) =>
      schedulesService.addParticipant(scheduleId, payload),
    onSuccess: (res) => {
      const meta = res.participant;
      const suffix = meta?.created_user
        ? " Undangan onboarding telah dikirim ke email peserta."
        : meta?.sent_confirmation
          ? " Email konfirmasi jadwal telah dikirim."
          : "";
      toast.success(`${res.message ?? "Peserta ditambahkan."}${suffix}`);
      qc.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          q.queryKey[0] === API_ENDPOINTS.SCHEDULES.DETAIL(scheduleId),
      });
      addParticipantForm.reset({
        user_id: null,
        email: "",
        name: "",
      });
      setParticipantSearch("");
      setParticipantEmailDropdownOpen(false);
      setAddParticipantOpen(false);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  if (detailQuery.isLoading) {
    return (
      <PageHeaderLayout title="Detail Jadwal" description="Memuat detail jadwal...">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </PageHeaderLayout>
    );
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <PageHeaderLayout title="Detail Jadwal" description="Gagal memuat detail jadwal">
        <p className="text-sm text-destructive">Gagal load schedule</p>
      </PageHeaderLayout>
    );
  }

  const d: ScheduleDetail = detailQuery.data;

  const participantsPage = d.participants;
  const rows = participantsPage?.data ?? [];

  const lastPage = participantsPage?.last_page ?? 1;
  const canPrev = page > 1;
  const canNext = page < lastPage;
  const pages = buildPages(page, lastPage);

  const busy = detailQuery.isFetching;

  const packages = d.packages ?? [];
  const isPartnerSchedule = Boolean(d.partner?.id);

  const title = `Schedule #${d.id}`;
  const description = `${formatDateId(d.date)} • ${hhmm(d.start_time)} - ${hhmm(d.end_time)}`;
  const retakePending = Boolean(
    retakeCandidate &&
      retakingUserId === retakeCandidate.id &&
      retakeMut.isPending
  );
  const resumePending = Boolean(
    resumeCandidate &&
      resumingUserId === resumeCandidate.id &&
      resumeMut.isPending
  );
  const resumeViolation = resumeCandidate?.last_violation ?? null;
  const scheduleWindowStatus = resolveDetailScheduleWindowStatus(d);
  const scheduleStarted = hasScheduleStarted(d);

  const actions = (
    <div className="flex flex-wrap items-center gap-2">
      {!isPartnerSchedule ? (
        <Dialog
          open={addParticipantOpen}
          onOpenChange={(open) => {
            setAddParticipantOpen(open);
            if (!open && !addParticipantMut.isPending) {
              addParticipantForm.reset({
                user_id: null,
                email: "",
                name: "",
              });
              setParticipantSearch("");
              setParticipantEmailDropdownOpen(false);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button disabled={addParticipantMut.isPending || scheduleStarted}>
              Input Peserta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Input Peserta Manual</DialogTitle>
              <DialogDescription>
                Jika email sudah pernah terdaftar, nama akan terisi otomatis.
                Jika belum, isi email dan nama lalu sistem akan mengirim email onboarding.
              </DialogDescription>
            </DialogHeader>

            <form
              className="space-y-5"
              onSubmit={addParticipantForm.handleSubmit((values) =>
                addParticipantMut.mutate({
                  user_id: values.user_id ?? undefined,
                  email: values.email,
                  name: values.name?.trim() || undefined,
                })
              )}
            >
              <div className="space-y-2">
                <Label htmlFor="manual-participant-email">
                  Email Peserta <span className="text-destructive">*</span>
                </Label>
                <Controller
                  control={addParticipantForm.control}
                  name="email"
                  render={({ field }) => (
                    <div className="relative">
                      <Input
                        {...field}
                        id="manual-participant-email"
                        type="email"
                        placeholder="peserta@example.com"
                        disabled={addParticipantMut.isPending || scheduleStarted}
                        autoComplete="off"
                        onFocus={() => setParticipantEmailDropdownOpen(true)}
                        onBlur={() => {
                          window.setTimeout(
                            () => setParticipantEmailDropdownOpen(false),
                            150
                          );
                        }}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value);
                          setParticipantSearch(value);
                          setParticipantEmailDropdownOpen(true);
                        }}
                      />
                      {participantEmailDropdownOpen &&
                      !scheduleStarted &&
                      participantSearch.trim().length > 0 ? (
                        <div className="absolute z-50 mt-2 max-h-56 w-full overflow-auto rounded-md border bg-background shadow-md">
                          {participantLookupQuery.isFetching ? (
                            <div className="px-3 py-2 text-sm text-muted-foreground">
                              Mencari peserta...
                            </div>
                          ) : participantSuggestions.length > 0 ? (
                            participantSuggestions.map((participant) => (
                              <button
                                key={participant.id}
                                type="button"
                                className="flex w-full flex-col px-3 py-2 text-left hover:bg-muted/50"
                                onMouseDown={(event) => {
                                  event.preventDefault();
                                  addParticipantForm.setValue(
                                    "email",
                                    participant.email,
                                    {
                                      shouldDirty: true,
                                      shouldValidate: true,
                                    }
                                  );
                                  addParticipantForm.setValue(
                                    "user_id",
                                    participant.id,
                                    {
                                      shouldDirty: true,
                                      shouldValidate: true,
                                    }
                                  );
                                  addParticipantForm.setValue(
                                    "name",
                                    participant.name,
                                    {
                                      shouldDirty: true,
                                      shouldValidate: true,
                                    }
                                  );
                                  setParticipantSearch(participant.email);
                                  setParticipantEmailDropdownOpen(false);
                                }}
                              >
                                <span className="text-sm font-medium">
                                  {participant.email}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {participant.name}
                                </span>
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-sm text-muted-foreground">
                              Email tidak ditemukan. Tetap bisa ketik email manual.
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  )}
                />
                {addParticipantForm.formState.errors.email?.message ? (
                  <p className="text-sm text-destructive">
                    {addParticipantForm.formState.errors.email.message}
                  </p>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  Ketik email peserta. Jika email sudah terdaftar, suggestion akan
                  muncul di input ini dan nama akan terisi otomatis.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="manual-participant-name">
                  Nama Peserta <span className="text-destructive">*</span>
                </Label>
                <Controller
                  control={addParticipantForm.control}
                  name="name"
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="manual-participant-name"
                      placeholder="Nama lengkap peserta"
                      disabled={
                        addParticipantMut.isPending ||
                        scheduleStarted ||
                        Boolean(addParticipantForm.watch("user_id"))
                      }
                    />
                  )}
                />
                {addParticipantForm.formState.errors.name?.message ? (
                  <p className="text-sm text-destructive">
                    {addParticipantForm.formState.errors.name.message}
                  </p>
                ) : null}
                {selectedExistingParticipant ? (
                  <p className="text-xs text-muted-foreground">
                    Nama diambil dari akun peserta yang sudah ada.
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Jika email belum terdaftar, peserta akan menerima email untuk
                    konfirmasi akun dan melengkapi profil.
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setAddParticipantOpen(false);
                    addParticipantForm.reset({
                      user_id: null,
                      email: "",
                      name: "",
                    });
                    setParticipantSearch("");
                    setParticipantEmailDropdownOpen(false);
                  }}
                  disabled={addParticipantMut.isPending}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={addParticipantMut.isPending || scheduleStarted}>
                  {addParticipantMut.isPending ? "Menyimpan..." : "Simpan Peserta"}
                </Button>
              </DialogFooter>
              {scheduleStarted ? (
                <p className="text-xs text-destructive">
                  Peserta tidak bisa ditambahkan lagi karena waktu tes sudah dimulai.
                </p>
              ) : null}
            </form>
          </DialogContent>
        </Dialog>
      ) : null}

      {isPartnerSchedule ? (
        <Dialog
          open={importOpen}
          onOpenChange={(v) => {
            setImportOpen(v);
            if (!v) importForm.reset();
          }}
        >
          <DialogTrigger asChild>
            <Button variant="excel" disabled={importMut.isPending || scheduleStarted}>
              Import Peserta Mitra (XLSX)
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Import Peserta Mitra</DialogTitle>
              <DialogDescription>
                Upload file Excel untuk menambahkan peserta ke jadwal ini.
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="text-sm font-medium">Aturan file</div>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
                  Format: <span className="font-medium text-foreground">.xlsx</span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
                  Kolom wajib: <span className="font-medium text-foreground">name</span>,{" "}
                  <span className="font-medium text-foreground">email</span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
                  Baris dengan email tidak valid akan{" "}
                  <span className="font-medium text-foreground">di-skip</span>
                </li>
              </ul>
              <div className="mt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    downloadWithBearer(
                      schedulesService.partnerImportTemplateUrl(scheduleId),
                      "template-import-peserta-mitra.xlsx",
                    ).catch((error) =>
                      toast.error(getApiErrorMessage(error)),
                    )
                  }
                  disabled={scheduleStarted}
                >
                  Download Template Excel
                </Button>
              </div>
            </div>

            <form
              className="mt-4 space-y-5"
              onSubmit={importForm.handleSubmit((v) => importMut.mutate(v.file))}
            >
              <div className="space-y-2">
                <Label htmlFor="partner-import-file">
                  File Excel <span className="text-destructive">*</span>
                </Label>

                <div className="rounded-lg border bg-white p-3">
                  <Controller
                    control={importForm.control}
                    name="file"
                    render={({ field }) => (
                      <Input
                        id="partner-import-file"
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        disabled={importMut.isPending || scheduleStarted}
                        className="cursor-pointer"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          field.onChange(file ?? undefined);
                        }}
                      />
                    )}
                  />

                  {importForm.formState.errors.file?.message ? (
                    <p className="mt-2 text-sm text-destructive">
                      {importForm.formState.errors.file.message}
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Pastikan header kolom sesuai agar proses import berjalan lancar.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setImportOpen(false)}
                  disabled={importMut.isPending}
                >
                  Batal
                </Button>

                <Button type="submit" disabled={importMut.isPending || scheduleStarted}>
                  {importMut.isPending ? "Mengimpor..." : "Import"}
                </Button>
              </div>
              {scheduleStarted ? (
                <p className="text-xs text-destructive">
                  Peserta mitra tidak bisa diupload lagi karena waktu tes sudah dimulai.
                </p>
              ) : null}
            </form>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );

  return (
    <PageHeaderLayout title={title} description={description} actions={actions}>
      <Dialog
        open={resumeDialogOpen}
        onOpenChange={(open) => {
          setResumeDialogOpen(open);
          if (!open && !resumePending) {
            setResumeCandidate(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lanjutkan ujian peserta?</DialogTitle>
            <DialogDescription>
              {resumeCandidate
                ? `Attempt ${resumeCandidate.name} yang terhenti akan dibuka kembali. Jawaban yang sudah tersimpan dipertahankan dan sisa waktu saat terhenti dikembalikan. Gunakan ini jika ujian terhenti karena koneksi, listrik, atau salah deteksi, bukan karena kecurangan.`
                : "Pilih peserta yang ingin dilanjutkan ujiannya."}
            </DialogDescription>
          </DialogHeader>
          {resumeViolation ? (
            <div className="rounded-lg border bg-muted/40 p-3 text-sm">
              <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                <span className="text-muted-foreground">Penyebab</span>
                <span>{violationReasonLabel(resumeViolation.reason)}</span>
                <span className="text-muted-foreground">Waktu kejadian</span>
                <span>{formatDateTime(resumeViolation.violated_at)}</span>
                <span className="text-muted-foreground">Sisa waktu</span>
                <span>{formatRemaining(resumeViolation.remaining_ms)}</span>
                <span className="text-muted-foreground">Soal terjawab</span>
                <span>
                  {resumeViolation.answered_count} dari {resumeViolation.total_questions}
                </span>
                <span className="text-muted-foreground">Indikasi koneksi</span>
                <span>
                  {resumeViolation.network_suspect ? (
                    <Badge variant="warning" className="whitespace-nowrap">
                      Ya
                      {resumeViolation.heartbeat_gap_seconds != null
                        ? ` (heartbeat terputus ${resumeViolation.heartbeat_gap_seconds} detik)`
                        : ""}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">Tidak terdeteksi</span>
                  )}
                </span>
                {resumeViolation.resume_count > 0 ? (
                  <>
                    <span className="text-muted-foreground">Pernah dilanjutkan</span>
                    <span>{resumeViolation.resume_count} kali</span>
                  </>
                ) : null}
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setResumeDialogOpen(false);
                setResumeCandidate(null);
              }}
              disabled={resumePending}
            >
              Batal
            </Button>
            <Button onClick={handleConfirmResume} disabled={resumePending} variant="blue">
              {resumePending ? "Memproses..." : "Lanjutkan Ujian"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={retakeDialogOpen}
        onOpenChange={(open) => {
          setRetakeDialogOpen(open);
          if (!open && !retakePending) {
            setRetakeCandidate(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Izinkan peserta mengulang ujian?</DialogTitle>
            <DialogDescription>
              {retakeCandidate
                ? `Izinkan ${retakeCandidate.name} mengulang ujian dari awal? Attempt sebelumnya ditutup, jawaban tidak dibawa, soal diacak ulang, dan peserta memakai durasi penuh. Jika ujian terhenti karena koneksi, gunakan Lanjutkan Tes.`
                : "Pilih peserta yang ingin diizinkan mengulang ujian."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRetakeDialogOpen(false);
                setRetakeCandidate(null);
              }}
              disabled={retakePending}
            >
              Batal
            </Button>
            <Button onClick={handleConfirmRetake} disabled={retakePending} variant="red">
              {retakePending ? "Memproses..." : "Izinkan Ulangi Tes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
          <div>
            <div className="text-muted-foreground">Harga</div>
            <div>{formatRupiah(d.price)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Kapasitas</div>
            <div>{d.capacity}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Peserta</div>
            <div>{d.current_participants}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Partner</div>
            <div>{d.partner?.name ?? "-"}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Status</div>
            <Badge variant={scheduleWindowStatus.variant}>
              {scheduleWindowStatus.label}
            </Badge>
          </div>
        </div>

        <div>
          <div className="text-muted-foreground text-sm mb-1">Pool Paket Soal</div>
          {packages.length === 0 ? (
            <span className="text-sm text-muted-foreground">-</span>
          ) : (
            <div className="flex flex-wrap gap-1">
              {packages.map((p) => (
                <Badge key={p.id} variant="outline">
                  {p.name}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">Attempt: {d.attempt_count ?? 0}</Badge>
          <Badge variant="secondary">Submit: {d.submitted_count ?? 0}</Badge>
        </div>
      </Card>

      <div className="rounded-xl border overflow-hidden flex flex-col mt-4">
        <div className="p-4 space-y-2">
          <div className="flex flex-col sm:flex-row gap-3 lg:items-center">
            <div className="flex-1">
              <Input
                value={qText}
                onChange={(e) => setQText(e.target.value)}
                placeholder="Cari peserta (nama / email)…"
                className="w-full"
              />
            </div>

            <Button
              variant="excel"
              onClick={() => exportParticipantsMut.mutate()}
              disabled={exportParticipantsMut.isPending}
            >
              {exportParticipantsMut.isPending ? "Exporting..." : "Export Peserta (XLSX)"}
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            {participantsPage ? (
              <>
                Menampilkan{" "}
                <span className="font-medium text-foreground">{participantsPage.from ?? 0}</span>–
                <span className="font-medium text-foreground">{participantsPage.to ?? 0}</span> dari{" "}
                <span className="font-medium text-foreground">{participantsPage.total ?? 0}</span>
              </>
            ) : null}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-auto border-t">
          <DataTable
            columns={columns}
            rows={rows}
            getRowKey={(r) => r.id}
            loading={detailQuery.isFetching}
            emptyText="Data tidak ditemukan"
            stickyHeader
          />
        </div>

        <div className="border-t bg-white">
          <div className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm text-muted-foreground">Per halaman</span>
              <select
                className="h-9 rounded-md border bg-background px-3 text-sm"
                value={perPage}
                onChange={(e) => setPerPage(Number(e.target.value))}
                disabled={busy}
              >
                {[10, 20, 50, 100, 200].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <Pagination className="ml-auto w-full justify-end">
              <PaginationContent className="justify-end w-auto flex-nowrap">
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (!canPrev || busy) return;
                      setPage((p) => Math.max(1, p - 1));
                    }}
                    className={!canPrev || busy ? "pointer-events-none opacity-50" : undefined}
                  />
                </PaginationItem>

                {pages.map((p, i) => {
                  if (p === "ellipsis") {
                    return (
                      <PaginationItem key={`el-${i}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }

                  return (
                    <PaginationItem key={p}>
                      <PaginationLink
                        href="#"
                        isActive={p === page}
                        onClick={(e) => {
                          e.preventDefault();
                          if (busy) return;
                          setPage(p);
                        }}
                        className={busy ? "pointer-events-none opacity-50" : undefined}
                      >
                        {String(p)}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (!canNext || busy) return;
                      setPage((p) => p + 1);
                    }}
                    className={!canNext || busy ? "pointer-events-none opacity-50" : undefined}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </div>
    </PageHeaderLayout>
  );
}
