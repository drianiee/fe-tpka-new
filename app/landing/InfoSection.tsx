import { CalendarClock, MapPin, MessageCircle, Mail } from "lucide-react";

// import { Button } from "@/components/ui/button";
import { TEST_INFO } from "@/lib/landing/contact";

function InfoCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="group flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#013880]/10 text-[#013880]">
        {icon}
      </div>
      <div className="space-y-2">
        <p className="text-lg font-semibold text-slate-900">{title}</p>
        <div className="text-sm leading-relaxed text-slate-600">{children}</div>
      </div>
    </div>
  );
}

export default function InfoSection() {
  return (
    <section
      id="informasi"
      className="relative bg-white px-6 md:px-12 lg:px-40 py-16"
    >
      <div className="space-y-2">
        <p className="text-base md:text-lg font-medium italic text-slate-600">
          Sebelum mendaftar
        </p>
        <p className="text-2xl md:text-4xl font-semibold text-primarytpka">
          Informasi Penting
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <InfoCard
          icon={<CalendarClock className="h-6 w-6" />}
          title={TEST_INFO.onlineSchedule.title}
        >
          <p className="text-base font-semibold text-slate-900">
            Setiap hari {TEST_INFO.onlineSchedule.days}
          </p>
          <p className="text-base font-semibold text-slate-900">
            Pukul {TEST_INFO.onlineSchedule.hours}
          </p>
          <p className="mt-2">{TEST_INFO.onlineSchedule.updateNote}</p>
        </InfoCard>

        <InfoCard
          icon={<MapPin className="h-6 w-6" />}
          title={TEST_INFO.hardcopy.title}
        >
          <p>Sertifikat versi cetak dapat diambil di:</p>
          <p className="mt-2 font-semibold text-slate-900">
            {TEST_INFO.hardcopy.office}
          </p>
          <p className="font-semibold text-slate-900">
            {TEST_INFO.hardcopy.location}
          </p>
        </InfoCard>

        <InfoCard
          icon={<MessageCircle className="h-6 w-6" />}
          title="Butuh Bantuan?"
        >
          <p>
            Kesulitan mendaftar, membayar, atau mengikuti tes? Admin TPKA siap
            membantu.
          </p>
        </InfoCard>
      </div>
    </section>
  );
}
