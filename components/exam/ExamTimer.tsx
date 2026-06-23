"use client";
import { Clock } from "lucide-react";
export function ExamTimer({ remainingMs }: { remainingMs: number }) {
  const seconds = Math.ceil(remainingMs / 1000); const h = Math.floor(seconds / 3600); const m = Math.floor((seconds % 3600) / 60); const s = seconds % 60;
  return <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 font-mono font-semibold ${seconds < 300 ? "border-red-300 bg-red-50 text-red-700" : "bg-white"}`}><Clock className="h-4 w-4" />{[h,m,s].map((v)=>String(v).padStart(2,"0")).join(":")}</div>;
}
