import Link from "next/link";
import { Button } from "@/components/ui/button";
export function ExamExpiredScreen({ score }: { score?: number | null }) { return <div className="mx-auto max-w-lg rounded-xl border bg-white p-8 text-center"><h1 className="text-2xl font-semibold">Ujian selesai</h1><p className="mt-2 text-muted-foreground">Jawaban telah difinalisasi oleh server.</p>{score!=null?<div className="my-6 text-4xl font-bold">{score.toFixed(2)}</div>:null}<Button asChild><Link href="/dashboard/peserta/certificates">Lihat Hasil</Link></Button></div>; }
