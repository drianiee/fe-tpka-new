"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";

import { JadwalCard } from "@/components/common/JadwalCard";
import { landingService } from "@/lib/services/landing.service";
import type { LandingScheduleItem } from "@/lib/types/landing";
import { getApiErrorMessage } from "@/lib/api/errors";

export default function JadwalSection() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["upcoming-schedules"],
    queryFn: () => landingService.getUpcomingSchedules(),
    staleTime: 60_000,
  });

  const items: LandingScheduleItem[] = data ?? [];

  return (
    <section
      id="jadwal"
      className="relative bg-[#FAF7FC] px-6 md:px-12 lg:px-40 py-16 overflow-hidden"
    >
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
        <div>
          <div className="w-full space-y-2 text-primarytpka">
            <p className="text-2xl md:text-4xl font-semibold">Jadwal Tes TPKA</p>
            <p className="text-base md:text-lg font-medium text-slate-700">
              Silakan pilih jadwal tes yang tersedia sesuai dengan waktu yang Anda inginkan.
            </p>
          </div>
        </div>

        <div className="w-full md:ml-auto space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-24 rounded-xl bg-white/70 animate-pulse" />
              <div className="h-24 rounded-xl bg-white/70 animate-pulse" />
              <div className="h-24 rounded-xl bg-white/70 animate-pulse" />
            </div>
          ) : isError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {getApiErrorMessage(error)}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border bg-white p-4 text-sm text-slate-600">
              Belum ada jadwal tersedia.
            </div>
          ) : (
            items.map((item) => <JadwalCard key={item.id} item={item} />)
          )}
        </div>
      </div>
    </section>
  );
}
