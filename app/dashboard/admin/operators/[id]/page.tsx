// app/dashboard/admin/operators/[id]/page.tsx
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { operatorsService } from "@/lib/services/operators.service";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { OperatorDetailResponse } from "@/lib/types/operators";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PageHeaderLayout } from "@/components/layouts/PageHeaderLayout";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function StatusBadge({ active }: { active?: boolean | null }) {
  if (active === false) return <Badge variant="muted">Nonaktif</Badge>;
  return <Badge variant="success">Aktif</Badge>;
}

function YesNoBadge({ yes }: { yes: boolean }) {
  return yes ? (
    <Badge variant="success">Ya</Badge>
  ) : (
    <Badge variant="muted">Belum</Badge>
  );
}

function formatDate(dateLike?: string | null) {
  if (!dateLike) return "-";
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export default function AdminOperatorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const qc = useQueryClient();

  const id = React.useMemo(() => String(params?.id ?? ""), [params]);

  const [confirmStatusOpen, setConfirmStatusOpen] = React.useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false);

  const detailKey = React.useMemo(
    () => ["admin", "operators", "detail", id] as const,
    [id]
  );
  const listKey = React.useMemo(
    () => ["admin", "operators", "list"] as const,
    []
  );

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: detailKey,
    queryFn: () => operatorsService.detail(id),
    enabled: Boolean(id),
  });

  const operator = data?.operator;
  const isActive = operator?.is_active === true;

  const statusMutation = useMutation({
    mutationFn: (nextActive: boolean) =>
      operatorsService.updateStatus(id, nextActive),
    onSuccess: (res) => {
      toast.success(res.message || "Status operator berhasil diperbarui.");

      qc.setQueryData<OperatorDetailResponse>(detailKey, (prev) => ({
        operator: res.operator ?? prev?.operator,
      }));

      qc.invalidateQueries({ queryKey: listKey });
      setConfirmStatusOpen(false);
    },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => operatorsService.delete(id),
    onSuccess: (res) => {
      toast.success(res.message || "Operator berhasil dihapus.");
      qc.invalidateQueries({ queryKey: listKey });
      setConfirmDeleteOpen(false);
      router.push("/dashboard/admin/operators");
    },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e)),
  });

  const busy = statusMutation.isPending || deleteMutation.isPending;

  if (isLoading) {
    return (
      <PageHeaderLayout
        title="Detail Operator"
        description="Memuat detail operator..."
      >
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </Card>
      </PageHeaderLayout>
    );
  }

  if (isError || !operator) {
    return (
      <PageHeaderLayout
        title="Detail Operator"
        description="Gagal memuat detail operator"
        showBack
      >
        <Card className="p-4 space-y-3">
          <p className="text-sm text-destructive">
            Data operator tidak ditemukan / gagal dimuat.
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Kembali
            </Button>
            <Button
              type="button"
              onClick={() => qc.invalidateQueries({ queryKey: detailKey })}
              disabled={busy}
            >
              Coba lagi
            </Button>
          </div>
        </Card>
      </PageHeaderLayout>
    );
  }

  const title = `Operator #${operator.id}`;
  const description = operator.name;

  return (
    <PageHeaderLayout title={title} description={description} showBack>
      <div className="space-y-4">
        <Card className="p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge active={operator.is_active} />
            <Badge variant="outline">ID: {operator.id}</Badge>
            <Badge variant="secondary">Role: {operator.role}</Badge>
            {isFetching && <Badge variant="outline">Menyinkronkan...</Badge>}
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2 text-sm">
            <div className="space-y-1">
              <div className="text-muted-foreground">Nama</div>
              <div className="font-medium truncate" title={operator.name}>
                {operator.name}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-muted-foreground">Email</div>
              <div className="truncate" title={operator.email}>
                {operator.email}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-muted-foreground">Status</div>
              <div>
                <StatusBadge active={operator.is_active} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-muted-foreground">Email Terverifikasi</div>
              <div>
                <YesNoBadge yes={Boolean(operator.email_verified_at)} />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">
              Verified: {formatDate(operator.email_verified_at)}
            </Badge>
            <Badge variant="outline">
              Created: {formatDate(operator.created_at)}
            </Badge>
          </div>
        </Card>

        <Card className="p-4 space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-1">
              <div className="text-sm font-semibold">Aksi</div>
              <div className="text-sm text-muted-foreground">
                Kelola status operator atau hapus operator (permanen).
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {isActive ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={() => setConfirmStatusOpen(true)}
                  >
                    Nonaktifkan
                  </Button>

                  <AlertDialog
                    open={confirmStatusOpen}
                    onOpenChange={setConfirmStatusOpen}
                  >
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Nonaktifkan operator?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Operator nonaktif tidak bisa login. Yakin ingin
                          menonaktifkan{" "}
                          <span className="font-medium">{operator.name}</span>?
                        </AlertDialogDescription>
                      </AlertDialogHeader>

                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={busy}>
                          Batal
                        </AlertDialogCancel>
                        <AlertDialogAction
                          disabled={busy}
                          onClick={(e) => {
                            e.preventDefault();
                            statusMutation.mutate(false);
                          }}
                          className="bg-destructive text-white hover:bg-destructive/90"
                        >
                          {statusMutation.isPending
                            ? "Menyimpan..."
                            : "Ya, nonaktifkan"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              ) : (
                <Button
                  type="button"
                  variant="default"
                  disabled={busy}
                  onClick={() => statusMutation.mutate(true)}
                >
                  {statusMutation.isPending ? "Menyimpan..." : "Aktifkan"}
                </Button>
              )}

              <Button
                type="button"
                variant="destructive"
                disabled={busy}
                onClick={() => setConfirmDeleteOpen(true)}
              >
                Hapus
              </Button>

              <AlertDialog
                open={confirmDeleteOpen}
                onOpenChange={setConfirmDeleteOpen}
              >
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Hapus operator?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Operator{" "}
                      <span className="font-medium">{operator.name}</span> akan
                      dihapus permanen dan tidak bisa dipulihkan.
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={busy}>Batal</AlertDialogCancel>
                    <AlertDialogAction
                      disabled={busy}
                      onClick={(e) => {
                        e.preventDefault();
                        deleteMutation.mutate();
                      }}
                      className="bg-destructive text-white hover:bg-destructive/90"
                    >
                      {deleteMutation.isPending ? "Menghapus..." : "Ya, hapus"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          <Separator />

          <p className="text-sm text-muted-foreground">
            Catatan: Operator nonaktif tidak dapat login. Menghapus operator
            bersifat permanen.
          </p>
        </Card>
      </div>
    </PageHeaderLayout>
  );
}
