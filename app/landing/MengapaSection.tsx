import Image from "next/image";
import { Card } from "@/components/ui/card";
import { MENGAPA } from "@/lib/landing/mengapa";
import { ICONS } from "@/lib/landing/navigation";
export default function MengapaSection() {
  return (
    <section
      id="mengapa"
      className="relative space-y-8 bg-white px-6 md:px-12 lg:px-40 py-16 overflow-hidden"
    >
      <div className="w-full space-y-2 text-primarytpka">
        <p className="text-base md:text-lg font-medium italic text-slate-700">
          Mengapa Harus
        </p>
        <p className="text-2xl md:text-4xl font-semibold">
          Tes Potensi Kemampuan Akademik ITS
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MENGAPA.map((item) => {
          const iconPath = ICONS[item.icon];
          return (
            <Card
              key={item.id}
              className="bg-[#FAF7FC] p-6 flex flex-col gap-2 rounded-xl border border-slate-200"
            >
              <Image
                src={iconPath}
                alt={item.title}
                width={32}
                height={32}
                className="w-12"
              />
              <div className="gap-1">

              <p className="text-lg font-semibold">{item.title}</p>
              <p className="text-sm font-normal">{item.desc}</p>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}