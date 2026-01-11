// app/dashboard/peserta/certificates/[id]/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { useMutation, useQuery } from "@tanstack/react-query";

import { participantCertificatesService } from "@/lib/services/participant-certificates.service";
import { openWithBearer } from "@/lib/utils/download";
import { getApiErrorMessage } from "@/lib/api/errors";
import { formatDateId } from "@/lib/utils/datetime";
import { hhmm } from "@/lib/utils/format";

import { PageHeaderLayout } from "@/components/layouts/PageHeaderLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

function scoreCell(v?: number | null) {
  if (v === null || v === undefined) return "-";
  return String(v);
}

export default function ParticipantCertificateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const scoreId = Number(id);

  const detailQuery = useQuery({
    queryKey: ["participant-certificate-detail", scoreId],
    queryFn: () => participantCertificatesService.detail(scoreId),
    enabled: Number.isFinite(scoreId),
  });

  const downloadMut = useMutation({
    mutationFn: (url: string) => openWithBearer(url),
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  if (detailQuery.isLoading) {
    return (
      <PageHeaderLayout title="Detail Sertifikat" description="Memuat...">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </PageHeaderLayout>
    );
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <PageHeaderLayout title="Detail Sertifikat" description="Gagal memuat data">
        <p className="text-sm text-destructive">Gagal load</p>
        <div className="mt-3">
          <Button asChild variant="outline">
            <Link href="/dashboard/peserta/certificates">Kembali</Link>
          </Button>
        </div>
      </PageHeaderLayout>
    );
  }

  const d = detailQuery.data;
  const cert = d.certificate;

  return (
    <PageHeaderLayout
      title={`Detail #${d.id}`}
      description={`${formatDateId(d.date)} • ${hhmm(d.start_time)} - ${hhmm(d.end_time)}`}
      actions={
        <Button asChild variant="outline">
          <Link href="/dashboard/peserta/certificates">Kembali</Link>
        </Button>
      }
    >
      <div className="space-y-4">
        <Card className="p-4 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <div className="text-muted-foreground">Status</div>
              <Badge variant="muted">{d.status ?? "-"}</Badge>
            </div>
            <div>
              <div className="text-muted-foreground">Partner</div>
              <div>{d.partner ? (typeof d.partner === "string" ? d.partner : d.partner.name ?? "-") : "-"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Sertifikat No</div>
              <div className="font-medium">{cert?.certificate_no ?? "-"}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
            <div>
              <div className="text-muted-foreground">Verbal</div>
              <div className="font-medium">{scoreCell(d.scores?.verbal)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Kuantitatif</div>
              <div className="font-medium">{scoreCell(d.scores?.kuantitatif)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Logika</div>
              <div className="font-medium">{scoreCell(d.scores?.logika)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Spasial</div>
              <div className="font-medium">{scoreCell(d.scores?.spasial)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Total</div>
              <div className="font-medium">{scoreCell(d.scores?.total)}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {cert?.verify_url ? (
              <Button
                variant="outline"
                onClick={() => window.open(cert.verify_url, "_blank", "noopener,noreferrer")}
              >
                Verify
              </Button>
            ) : null}

            {cert?.download_url ? (
              <Button
                onClick={() => downloadMut.mutate(cert.download_url)}
                disabled={downloadMut.isPending}
              >
                {downloadMut.isPending ? "Membuka..." : "Download Sertifikat"}
              </Button>
            ) : (
              <Button disabled>Download Sertifikat</Button>
            )}
          </div>
        </Card>
      </div>
    </PageHeaderLayout>
  );
}
