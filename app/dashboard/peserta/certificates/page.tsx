// app/dashboard/peserta/certificates/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Eye, Download, Search, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { getApiErrorMessage } from "@/lib/api/errors";
import { getToken } from "@/lib/utils/storage";
import { hhmm } from "@/lib/utils/format";
import { formatDateId } from "@/lib/utils/datetime";

import { api } from "@/lib/api/client";

import { PageHeaderLayout } from "@/components/layouts/PageHeaderLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";

type StatusFilter = "all" | "upcoming" | "done";

function isStatusFilter(v: string): v is StatusFilter {
  return v === "all" || v === "upcoming" || v === "done";
}

type ParticipantScoreItem = {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  partner: { id: number; name: string } | null;
  scores: {
    verbal: number | null;
    kuantitatif: number | null;
    logika: number | null;
    spasial: number | null;
    total: number | null;
  };
  certificate: {
    certificate_no: string;
    verify_url: string;
    download_url: string;
  } | null;
};

type ParticipantScoresResponse = {
  status: string;
  count: number;
  data: ParticipantScoreItem[];
};

function normalizeStatus(status?: string | null) {
  return (status ?? "").trim().toLowerCase();
}

function statusLabel(status?: string | null) {
  const s = normalizeStatus(status);
  if (s === "submitted" || s === "expired") return "Selesai";
  return status || "-";
}

function statusVariant(status?: string | null): "muted" | "warning" | "success" {
  const s = normalizeStatus(status);
  if (!s) return "muted";
  if (s === "submitted" || s === "expired") return "success";
  if (s.includes("belum")) return "warning";
  if (s.includes("selesai") || s.includes("done")) return "success";
  return "muted";
}

function scoreCell(v?: number | null) {
  if (v === null || v === undefined) return "-";
  return String(v);
}

function useDebouncedValue<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);

  return debounced;
}

// ✅ download/open file via Bearer token (karena endpoint sertifikat butuh auth)
async function openWithBearer(url: string) {
  const token = getToken();
  if (!token) throw new Error("Token tidak ditemukan. Silakan login ulang.");

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "*/*",
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Gagal mengunduh. HTTP ${res.status}`);
  }

  const blob = await res.blob();
  const objUrl = URL.createObjectURL(blob);
  window.open(objUrl, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(objUrl), 60_000);
}

const participantCertificatesService = {
  list(params: { status: StatusFilter; q?: string }): Promise<ParticipantScoresResponse> {
    // kamu bisa pakai API_ENDPOINTS kalau udah ada, ini aman pakai string langsung
    return api
      .get("/api/participant/scores", { params })
      .then((r) => r.data as ParticipantScoresResponse);
  },

  detail(id: number | string): Promise<ParticipantScoreItem> {
    return api.get(`/api/participant/scores/${id}`).then((r) => r.data as ParticipantScoreItem);
  },
};

export default function ParticipantCertificatesPage() {
  const [status, setStatus] = React.useState<StatusFilter>("all");
  const [q, setQ] = React.useState("");
  const qDebounced = useDebouncedValue(q, 350);

  const listQuery = useQuery({
    queryKey: [API_ENDPOINTS.PARTICIPANT?.SCORES ?? "participant-scores", status, qDebounced],
    queryFn: () => participantCertificatesService.list({ status, q: qDebounced.trim() || undefined }),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const rows = React.useMemo(() => listQuery.data?.data ?? [], [listQuery.data]);

  const cols = React.useMemo<DataTableColumn<ParticipantScoreItem>[]>(() => {
    return [
      {
        key: "date",
        header: "Date",
        headerClassName: "w-44",
        className: "whitespace-nowrap",
        cell: (row) => formatDateId(row.date),
      },
      {
        key: "time",
        header: "Start - End",
        headerClassName: "w-28 text-center",
        className: "text-center whitespace-nowrap",
        cell: (row) => `${hhmm(row.start_time)} - ${hhmm(row.end_time)}`,
      },
      {
        key: "status",
        header: "Status",
        headerClassName: "w-40",
        className: "whitespace-nowrap",
        cell: (row) => (
          <Badge variant={statusVariant(row.status)} className="capitalize">
            {statusLabel(row.status)}
          </Badge>
        ),
      },
      {
        key: "partner",
        header: "Partner",
        headerClassName: "w-40",
        className: "truncate",
        cell: (row) => (
          <span className="truncate" title={row.partner?.name ?? "-"}>
            {row.partner?.name ?? "-"}
          </span>
        ),
      },
      {
        key: "verbal",
        header: "Verbal",
        headerClassName: "w-20 text-center",
        className: "text-center whitespace-nowrap",
        cell: (row) => scoreCell(row.scores?.verbal),
      },
      {
        key: "kuantitatif",
        header: "Kuantitatif",
        headerClassName: "w-24 text-center",
        className: "text-center whitespace-nowrap",
        cell: (row) => scoreCell(row.scores?.kuantitatif),
      },
      {
        key: "logika",
        header: "Logika",
        headerClassName: "w-20 text-center",
        className: "text-center whitespace-nowrap",
        cell: (row) => scoreCell(row.scores?.logika),
      },
      {
        key: "spasial",
        header: "Spasial",
        headerClassName: "w-20 text-center",
        className: "text-center whitespace-nowrap",
        cell: (row) => scoreCell(row.scores?.spasial),
      },
      {
        key: "total",
        header: "Total",
        headerClassName: "w-20 text-center",
        className: "text-center whitespace-nowrap font-medium",
        cell: (row) => scoreCell(row.scores?.total),
      },
      {
        key: "detail",
        header: "Detail",
        headerClassName: "w-44 text-center",
        className: "text-center whitespace-nowrap",
        cell: (row) => {
          const cert = row.certificate;
          const downloadUrl = cert?.download_url ?? null;

          return (
            <div className="flex items-center justify-center gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href={`/dashboard/peserta/certificates/${row.id}`}>
                  <Eye className="h-4 w-4" />
                  Detail
                </Link>
              </Button>

              <Button
                size="sm"
                variant="outline"
                disabled={!downloadUrl || listQuery.isFetching}
                onClick={async () => {
                  try {
                    if (!downloadUrl) return;
                    await openWithBearer(downloadUrl);
                  } catch (e) {
                    toast.error(getApiErrorMessage(e));
                  }
                }}
                title={!downloadUrl ? "Sertifikat belum tersedia" : "Unduh sertifikat"}
              >
                <Download className="h-4 w-4" />
                Unduh
              </Button>
            </div>
          );
        },
      },
    ];
  }, [listQuery.isFetching]);

  const busy = listQuery.isFetching;

  return (
    <PageHeaderLayout
      title="Certificates"
      description="Lihat nilai dan unduh sertifikat untuk setiap jadwal tes."
      showBack={false}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => listQuery.refetch()}
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
          </Button>
        </div>
      }
    >
      <Card className="p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex-1 relative">
            <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari (status / partner)…"
              className="pl-9"
              disabled={busy}
            />
          </div>

          <select
            className="h-9 rounded-md border bg-background px-3 text-sm"
            value={status}
            onChange={(e) => {
              const v = e.target.value;
              setStatus(isStatusFilter(v) ? v : "all");
            }}
            disabled={busy}
          >
            <option value="all">Semua</option>
            <option value="upcoming">Upcoming</option>
            <option value="done">Selesai</option>
          </select>
        </div>

        {listQuery.isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {getApiErrorMessage(listQuery.error)}
          </div>
        ) : null}

        <div className="text-xs text-muted-foreground">
          Menampilkan <span className="font-medium text-foreground">{rows.length}</span> data
        </div>
      </Card>

      <div className="rounded-xl border overflow-hidden mt-4">
        <DataTable
          columns={cols}
          rows={rows}
          getRowKey={(r) => r.id}
          loading={listQuery.isLoading}
          emptyText="Belum ada data sertifikat"
          stickyHeader
        />
      </div>
    </PageHeaderLayout>
  );
}
