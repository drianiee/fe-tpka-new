// app/dashboard/admin/payments/[id]/page.tsx
"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { adminPaymentsService } from "@/lib/services/adminPayments.service";
import type { PaymentDetail } from "@/lib/types/admin-payments";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { formatRupiah } from "@/lib/utils/format";
import { PageHeaderLayout } from "@/components/layouts/PageHeaderLayout";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

function statusVariant(s?: string | null) {
  const v = (s || "").toLowerCase();
  if (!v || v === "-") return "muted" as const;
  if (v === "settlement" || v === "capture") return "success" as const;
  if (v === "pending") return "warning" as const;
  return "destructive" as const;
}

export default function AdminPaymentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const paymentId = Number(id);

  const query = useQuery({
    queryKey: [API_ENDPOINTS.PAYMENTS_ADMIN.DETAIL(paymentId)],
    queryFn: () => adminPaymentsService.detail(paymentId),
    enabled: Number.isFinite(paymentId),
  });

  if (query.isLoading) {
    return (
      <PageHeaderLayout
        title="Detail Payment"
        description="Memuat detail payment..."
      >
        <p className="text-sm text-muted-foreground">Loading...</p>
      </PageHeaderLayout>
    );
  }

  if (query.isError || !query.data) {
    return (
      <PageHeaderLayout
        title="Detail Payment"
        description="Gagal memuat detail payment"
      >
        <p className="text-sm text-destructive">Gagal load payment</p>
      </PageHeaderLayout>
    );
  }

  const p: PaymentDetail = query.data.payment;

  const title = `Payment #${p.id}`;
  const description = `Order: ${p.order_id ?? "-"}`;

  return (
    <PageHeaderLayout
      title={title}
      description={description}
      showBack={true}
    >
      <div className="space-y-4">
        <Card className="p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant(p.transaction_status)}>
              Status: {p.transaction_status ?? "-"}
            </Badge>
            <Badge variant="muted">Payment: {p.payment_type ?? "-"}</Badge>
            <Badge variant="muted">Fraud: {p.fraud_status ?? "-"}</Badge>
            <Badge variant="success">
              Amount: {formatRupiah(String(p.amount ?? 0))}
            </Badge>
          </div>

          <Separator />

          <div className="grid gap-3 md:grid-cols-3 text-sm">
            <div>
              <div className="text-muted-foreground">Transaction Time</div>
              <div className="truncate" title={p.transaction_time ?? "-"}>
                {p.transaction_time ?? "-"}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Settlement Time</div>
              <div className="truncate" title={p.settlement_time ?? "-"}>
                {p.settlement_time ?? "-"}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Paid At</div>
              <div className="truncate" title={p.paid_at ?? "-"}>
                {p.paid_at ?? "-"}
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid gap-3 md:grid-cols-2 text-sm">
            <div>
              <div className="text-muted-foreground">Transaction ID</div>
              <div className="truncate" title={p.transaction_id ?? "-"}>
                {p.transaction_id ?? "-"}
              </div>
            </div>

            <div>
              <div className="text-muted-foreground">Status Code</div>
              <div>{p.status_code ?? "-"}</div>
            </div>

            <div>
              <div className="text-muted-foreground">Status Message</div>
              <div className="truncate" title={p.status_message ?? "-"}>
                {p.status_message ?? "-"}
              </div>
            </div>

            <div>
              <div className="text-muted-foreground">Bank / VA</div>
              <div
                className="truncate"
                title={`${p.bank ?? "-"} / ${p.va_number ?? "-"}`}
              >
                {p.bank ?? "-"} / {p.va_number ?? "-"}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {p.snap_redirect_url ? (
              <Button asChild size="sm" variant="outline">
                <a href={p.snap_redirect_url} target="_blank" rel="noreferrer">
                  Snap Redirect
                </a>
              </Button>
            ) : null}
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <div>
            <h3 className="text-sm font-semibold">User</h3>
            <div className="text-sm mt-2">
              {p.user ? (
                <div className="space-y-1">
                  <div className="font-medium">{p.user.name}</div>
                  <div className="text-muted-foreground">{p.user.email}</div>
                  <div className="text-muted-foreground">ID: {p.user.id}</div>
                </div>
              ) : (
                "-"
              )}
            </div>
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <div>
            <h3 className="text-sm font-semibold">Schedule</h3>
            <div className="text-sm mt-2">
              {p.schedule ? (
                <div className="space-y-1">
                  <div className="font-medium">Schedule #{p.schedule.id}</div>
                  <div className="text-muted-foreground">
                    {p.schedule.date} • {p.schedule.start_time} -{" "}
                    {p.schedule.end_time}
                  </div>
                  <div className="text-muted-foreground">
                    Price: {formatRupiah(String(p.schedule.price ?? 0))}
                  </div>
                  <div className="text-muted-foreground">
                    Partner: {p.schedule.partner?.name ?? "-"}
                  </div>
                  <div className="text-muted-foreground">
                    Moodle: {p.schedule.moodle_course_id ?? "-"} /{" "}
                    {p.schedule.moodle_quiz_id ?? "-"} /{" "}
                    {p.schedule.moodle_quiz_cmid ?? "-"}
                  </div>
                </div>
              ) : (
                "-"
              )}
            </div>
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <div>
            <h3 className="text-sm font-semibold">Debug / Payload</h3>
            <div className="space-y-2 text-sm mt-2">
              <div>
                <div className="text-muted-foreground">Snap Token</div>
                <div className="break-all text-xs bg-muted p-2 rounded mt-1">
                  {p.snap_token ?? "-"}
                </div>
              </div>

              <div>
                <div className="text-muted-foreground">VA Numbers</div>
                <pre className="rounded-md bg-muted p-3 text-xs overflow-auto mt-1">
                  {JSON.stringify(p.va_numbers || {}, null, 2)}
                </pre>
              </div>

              <div>
                <div className="text-muted-foreground">Payload</div>
                <pre className="rounded-md bg-muted p-3 text-xs overflow-auto mt-1">
                  {JSON.stringify(p.payload || {}, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </PageHeaderLayout>
  );
}