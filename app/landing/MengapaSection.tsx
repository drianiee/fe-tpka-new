import Image from "next/image";

import { MENGAPA } from "@/lib/landing/mengapa";
import { ICONS } from "@/lib/landing/navigation";

export default function MengapaSection() {
  return (
    <section
      id="mengapa"
      className="relative space-y-8 bg-[#FAF7FC] px-6 md:px-12 lg:px-40 py-16 overflow-hidden"
    >
      <div className="w-full space-y-2">
        <p className="text-base md:text-lg font-medium italic text-slate-600">
          Mengapa Harus
        </p>
        <p className="text-2xl md:text-4xl font-semibold text-primarytpka">
          Tes Potensi Kemampuan Akademik ITS
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {MENGAPA.map((item) => (
          <div
            key={item.id}
            className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#013880]/10">
              <Image src={ICONS[item.icon]} alt="" width={32} height={32} className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-semibold text-slate-900">{item.title}</p>
              <p className="text-sm leading-relaxed text-slate-600">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
