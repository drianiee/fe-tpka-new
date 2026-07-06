// app/dashboard/page.tsx
"use client";

import Link from "next/link";
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight } from "lucide-react";

import { dashboardService } from "@/lib/services/dashboard.service";
import { partnersService } from "@/lib/services/partners.service";
import { getApiErrorMessage } from "@/lib/api/errors";
import { formatRupiah, hhmm } from "@/lib/utils/format";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { formatDateId } from "@/lib/utils/datetime";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { PageHeaderLayout } from "@/components/layouts/PageHeaderLayout";

type StatusVariant = "muted" | "warning" | "success";

type PartnerLite = {
  id: number;
  name: string;
};

type LatestScheduleLite = {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  price: string;
  capacity: number;
  current_participants: number;
  status?: string | null;
  partner_id?: number | null;
  is_partner?: boolean;
};

type DashboardTotalsLite = {
  participants: number;
  income_paid?: number | string | null;
  paid_count?: number | null;
  total_schedules?: number | null;
};

type DashboardResponseLite = {
  totals: DashboardTotalsLite;
  latest_schedules: LatestScheduleLite[];
};

type PartnerDetailResponseLite = {
  partner: PartnerLite;
};

type RevenueChartPointLite = {
  month: number;
  amount: number;
  count: number;
};

type RevenueChartResponseLite = {
  year: number;
  currency: string;
  series: RevenueChartPointLite[];
  total_amount: number;
  total_count: number;
};

type ParticipantsChartPointLite = {
  month: number;
  participants: number;
};

type ParticipantsChartResponseLite = {
  year: number;
  series: ParticipantsChartPointLite[];
  total_participants: number;
  source: string;
};

function normalizeStatus(status?: string | null) {
  return (status ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");
}

function resolveScheduleWindowStatus(schedule: LatestScheduleLite) {
  const startAt = schedule.date ? new Date(schedule.date) : null;

  let endAt: Date | null = null;
  if (startAt && schedule.end_time) {
    const [hours = "0", minutes = "0", seconds = "0"] =
      schedule.end_time.split(":");
    endAt = new Date(startAt);
    endAt.setHours(Number(hours), Number(minutes), Number(seconds), 0);
  }

  if (!startAt || !endAt) {
    return { key: "unknown", label: "-", variant: "muted" as const };
  }

  const now = new Date();
  if (now < startAt) {
    return {
      key: "belum-dimulai",
      label: "Belum Dimulai",
      variant: "muted" as const,
    };
  }

  if (now >= endAt) {
    return {
      key: "selesai",
      label: "Selesai",
      variant: "success" as const,
    };
  }

  return {
    key: "sedang-berlangsung",
    label: "Sedang Berlangsung",
    variant: "warning" as const,
  };
}

function statusVariant(status?: string | null): StatusVariant {
  const s = normalizeStatus(status);
  if (s === "sedang-berlangsung") return "warning";
  if (s === "selesai" || s === "telah-selesai") return "success";
  return "muted";
}

function statusLabel(status?: string | null) {
  const s = normalizeStatus(status);
  if (s === "sedang-berlangsung") return "Sedang Berlangsung";
  if (s === "selesai" || s === "telah-selesai") return "Selesai";
  if (s === "belum-dimulai") return "Belum Dimulai";
  return "-";
}

function isPartnerDetailResponseLite(
  v: unknown,
): v is PartnerDetailResponseLite {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  const p = o["partner"];
  if (!p || typeof p !== "object") return false;
  const po = p as Record<string, unknown>;
  return typeof po["id"] === "number" && typeof po["name"] === "string";
}

function ScheduleKindText({ partnerId }: { partnerId?: number | null }) {
  const qPartner = useQuery({
    queryKey: [API_ENDPOINTS.PARTNERS.DETAIL(partnerId ?? "none")],
    queryFn: async (): Promise<PartnerLite | null> => {
      if (!partnerId) return null;
      const resUnknown: unknown = await partnersService.detail(partnerId);
      if (isPartnerDetailResponseLite(resUnknown)) return resUnknown.partner;
      return null;
    },
    enabled: Boolean(partnerId),
    staleTime: 5 * 60 * 1000,
  });

  if (!partnerId) return <span>Jadwal Umum</span>;
  if (qPartner.isLoading) return <span>Jadwal Mitra</span>;
  if (qPartner.isError) return <span>Jadwal Mitra</span>;

  const partner = qPartner.data;
  return <span>Mitra: {partner?.name ?? "-"}</span>;
}

function StatCard({ title, value }: { title: string; value: React.ReactNode }) {
  return (
    <Card className="rounded-xl py-1!">
      <CardHeader className="pb-1.5 pt-3 px-4">
        <CardTitle className="text-xs font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 pb-3 px-4">
        <div className="text-lg font-semibold leading-none tracking-tight">
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

function ScheduleRowCompact({ s }: { s: LatestScheduleLite }) {
  const jam = `${hhmm(s.start_time)} - ${hhmm(s.end_time)}`;
  const priceText = formatRupiah(String(s.price ?? 0));
  const scheduleStatus = resolveScheduleWindowStatus(s);

  return (
    <div className="rounded-lg border bg-white px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <div className="font-semibold text-sm sm:text-base">
              Jadwal #{s.id}
            </div>
            <Badge
              variant={statusVariant(scheduleStatus.key)}
              className="text-[11px]"
            >
              {statusLabel(scheduleStatus.key)}
            </Badge>
          </div>

          <div className="mt-1.5 text-sm text-muted-foreground">
            {formatDateId(s.date)} • {jam}
          </div>

          <div className="mt-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground/80">
              <ScheduleKindText partnerId={s.partner_id ?? null} />
            </span>
            <span className="mx-2">•</span>
            <span>
              {s.current_participants}/{s.capacity} peserta
            </span>
            <span className="mx-2">•</span>
            <span>{priceText}</span>
          </div>
        </div>

        <Button asChild size="sm" variant="outline" className="h-9 px-3">
          <Link href={`/dashboard/admin/schedules/${s.id}`}>
            <span className="text-sm">Detail</span>
            <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function monthLabel(id: number) {
  const d = new Date(2024, Math.max(0, Math.min(11, id - 1)), 1);
  return d.toLocaleDateString("id-ID", { month: "short" });
}

type RevenueChartRow = {
  month: string;
  amount: number;
  count: number;
};

type ParticipantsChartRow = {
  month: string;
  participants: number;
};

const revenueChartConfig = {
  amount: { label: "Pendapatan", color: "var(--chart-1)" },
} satisfies ChartConfig;

const participantsChartConfig = {
  participants: { label: "Peserta", color: "var(--chart-1)" },
} satisfies ChartConfig;

function YearSelect({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const options = [value - 2, value - 1, value, value + 1];
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">Tahun</span>
      <select
        className="h-8 rounded-md border bg-background px-2 text-sm"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
      >
        {options.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function DashboardPage() {
  const [revenueYear, setRevenueYear] = React.useState<number>(
    new Date().getFullYear(),
  );
  const [participantsYear, setParticipantsYear] = React.useState<number>(
    new Date().getFullYear(),
  );

  const dashboardQuery = useQuery({
    queryKey: [API_ENDPOINTS.DASHBOARD.BASE, { limit: 10 }],
    queryFn: async (): Promise<DashboardResponseLite> => {
      const res = await dashboardService.getDashboard(10);
      return res as unknown as DashboardResponseLite;
    },
  });

  const revenueChartQuery = useQuery({
    queryKey: [API_ENDPOINTS.DASHBOARD.REVENUE_CHART, { year: revenueYear }],
    queryFn: async (): Promise<RevenueChartResponseLite> => {
      const res = await dashboardService.getRevenueChart(revenueYear);
      return res as unknown as RevenueChartResponseLite;
    },
    staleTime: 60_000,
  });

  const participantsChartQuery = useQuery({
    queryKey: [
      API_ENDPOINTS.DASHBOARD.PARTICIPANTS_CHART,
      { year: participantsYear },
    ],
    queryFn: async (): Promise<ParticipantsChartResponseLite> => {
      const res = await dashboardService.getParticipantsChart(participantsYear);
      return res as unknown as ParticipantsChartResponseLite;
    },
    staleTime: 60_000,
  });

  const data = dashboardQuery.data;
  const totals = data?.totals;
  const latest = data?.latest_schedules ?? [];
  const activeLatest = React.useMemo(
    () =>
      latest.filter((schedule) => {
        const currentStatus = resolveScheduleWindowStatus(schedule);
        return (
          currentStatus.key === "belum-dimulai" ||
          currentStatus.key === "sedang-berlangsung"
        );
      }),
    [latest],
  );

  const revenueChartData: RevenueChartRow[] = React.useMemo(() => {
    const s = revenueChartQuery.data?.series ?? [];
    const byMonth = new Map<number, RevenueChartPointLite>();
    for (const p of s) byMonth.set(p.month, p);

    const rows: RevenueChartRow[] = [];
    for (let m = 1; m <= 12; m++) {
      const p = byMonth.get(m);
      rows.push({
        month: monthLabel(m),
        amount: p?.amount ?? 0,
        count: p?.count ?? 0,
      });
    }
    return rows;
  }, [revenueChartQuery.data]);

  const participantsChartData: ParticipantsChartRow[] = React.useMemo(() => {
    const s = participantsChartQuery.data?.series ?? [];
    const byMonth = new Map<number, ParticipantsChartPointLite>();
    for (const p of s) byMonth.set(p.month, p);

    const rows: ParticipantsChartRow[] = [];
    for (let m = 1; m <= 12; m++) {
      const p = byMonth.get(m);
      rows.push({
        month: monthLabel(m),
        participants: p?.participants ?? 0,
      });
    }
    return rows;
  }, [participantsChartQuery.data]);

  return (
    <PageHeaderLayout
      title="Beranda Admin"
      description="Ringkasan peserta, pembayaran, dan jadwal ujian terbaru."
      showBack={false}
    >
      <div className="space-y-4">
        {dashboardQuery.isLoading ? (
          <div className="rounded-xl border bg-white p-3 text-sm text-muted-foreground">
            Memuat dashboard...
          </div>
        ) : dashboardQuery.isError ? (
          <div className="rounded-xl border bg-white p-3 text-sm text-destructive">
            {getApiErrorMessage(dashboardQuery.error)}
          </div>
        ) : !data || !totals ? (
          <div className="rounded-xl border bg-white p-3 text-sm text-muted-foreground">
            Data dashboard kosong.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
              <StatCard title="Total Peserta" value={totals.participants} />
              <StatCard
                title="Pendapatan Lunas"
                value={formatRupiah(String(totals.income_paid ?? 0))}
              />
              <StatCard
                title="Pembayaran Lunas"
                value={totals.paid_count ?? 0}
              />
              <StatCard
                title="Total Jadwal"
                value={totals.total_schedules ?? 0}
              />
            </div>

            <div className="grid gap-3 lg:grid-cols-5">
              <div className="grid gap-3 lg:col-span-2">
                <Card className="rounded-xl py-1!">
                  <CardHeader className="py-3 px-4 border-b">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-sm">Pendapatan</CardTitle>
                        <div className="text-xs text-muted-foreground">
                          Tahun{" "}
                          <span className="font-medium text-foreground">
                            {revenueYear}
                          </span>
                        </div>
                      </div>
                      <YearSelect
                        value={revenueYear}
                        onChange={setRevenueYear}
                        disabled={revenueChartQuery.isFetching}
                      />
                    </div>
                  </CardHeader>

                  <CardContent className="px-2 py-3 sm:px-4">
                    {revenueChartQuery.isLoading ? (
                      <div className="rounded-xl border bg-white p-3 text-sm text-muted-foreground">
                        Memuat grafik pendapatan...
                      </div>
                    ) : revenueChartQuery.isError ? (
                      <div className="rounded-xl border bg-white p-3 text-sm text-destructive">
                        {getApiErrorMessage(revenueChartQuery.error)}
                      </div>
                    ) : (
                      <ChartContainer
                        config={revenueChartConfig}
                        className="aspect-auto h-44 w-full"
                      >
                        <BarChart
                          accessibilityLayer
                          data={revenueChartData}
                          margin={{ left: 12, right: 12, top: 6 }}
                        >
                          <CartesianGrid vertical={false} />
                          <XAxis
                            dataKey="month"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={6}
                            fontSize={12}
                          />
                          <ChartTooltip
                            content={
                              <ChartTooltipContent
                                className="w-50"
                                labelFormatter={(value) =>
                                  `Bulan: ${String(value)}`
                                }
                                formatter={(value, name) => {
                                  if (name === "amount")
                                    return [
                                      formatRupiah(String(value ?? 0)),
                                      " Pendapatan",
                                    ];
                                  return [String(value ?? 0), String(name)];
                                }}
                              />
                            }
                          />
                          <Bar dataKey="amount" fill="#2563eb" radius={6} />
                        </BarChart>
                      </ChartContainer>
                    )}
                  </CardContent>
                </Card>

                <Card className="rounded-xl py-1!">
                  <CardHeader className="py-3 px-4 border-b">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-sm">Peserta</CardTitle>
                        <div className="text-xs text-muted-foreground">
                          Tahun{" "}
                          <span className="font-medium text-foreground">
                            {participantsYear}
                          </span>
                        </div>
                      </div>
                      <YearSelect
                        value={participantsYear}
                        onChange={setParticipantsYear}
                        disabled={participantsChartQuery.isFetching}
                      />
                    </div>
                  </CardHeader>

                  <CardContent className="px-2 py-3 sm:px-4">
                    {participantsChartQuery.isLoading ? (
                      <div className="rounded-xl border bg-white p-3 text-sm text-muted-foreground">
                        Memuat grafik peserta...
                      </div>
                    ) : participantsChartQuery.isError ? (
                      <div className="rounded-xl border bg-white p-3 text-sm text-destructive">
                        {getApiErrorMessage(participantsChartQuery.error)}
                      </div>
                    ) : (
                      <ChartContainer
                        config={participantsChartConfig}
                        className="aspect-auto h-44 w-full"
                      >
                        <BarChart
                          accessibilityLayer
                          data={participantsChartData}
                          margin={{ left: 12, right: 12, top: 6 }}
                        >
                          <CartesianGrid vertical={false} />
                          <XAxis
                            dataKey="month"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={6}
                            fontSize={12}
                          />
                          <ChartTooltip
                            content={
                              <ChartTooltipContent
                                className="w-45"
                                labelFormatter={(value) =>
                                  `Bulan: ${String(value)}`
                                }
                                formatter={(value, name) => {
                                  if (name === "participants")
                                    return [String(value ?? 0), " Peserta"];
                                  return [String(value ?? 0), String(name)];
                                }}
                              />
                            }
                          />
                          <Bar
                            dataKey="participants"
                            fill="#2563eb"
                            radius={6}
                          />
                        </BarChart>
                      </ChartContainer>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card className="rounded-xl lg:col-span-3 py-1!">
                <CardHeader className="py-3 px-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-sm">Jadwal Terdekat</CardTitle>
                      <div className="text-xs text-muted-foreground">
                        {activeLatest.length} jadwal aktif
                      </div>
                    </div>

                    <Button asChild size="sm" variant="outline" className="h-8">
                      <Link href="/dashboard/admin/schedules">Lihat semua</Link>
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="px-4 pb-4">
                  {activeLatest.length === 0 ? (
                    <div className="rounded-xl border bg-white p-3 text-sm text-muted-foreground">
                      Tidak ada jadwal yang belum mulai atau sedang berlangsung.
                    </div>
                  ) : (
                    <div className="max-h-105 overflow-y-auto pr-2 space-y-2">
                      {activeLatest.map((s) => (
                        <ScheduleRowCompact key={s.id} s={s} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </PageHeaderLayout>
  );
}
