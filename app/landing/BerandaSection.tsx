import Image from "next/image";
import Link from "next/link";
import { BookOpenText, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
// import { ADMIN_WHATSAPP, formatWhatsAppNumber, whatsAppLink } from "@/lib/landing/contact";

export default function BerandaSection() {
  return (
    <section id="beranda" className="relative">
      <div className="sticky top-0 h-svh z-0 pointer-events-none">
        <Image
          src="/landing-bg.webp"
          alt=""
          fill
          priority
          quality={70}
          sizes="100vw"
          className="absolute inset-0 -z-10 object-cover object-center"
        />
        <div className="absolute inset-0 -z-10 bg-linear-to-b from-[#013880]/40 via-black/50 to-black/75" />
      </div>

      <div className="relative -mt-[100svh] h-svh z-10 flex items-center justify-center px-6 md:px-12 lg:px-40 text-center">
        <div className="max-w-4xl space-y-6">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-white md:text-6xl">
              Tes Potensi Kemampuan Akademik
            </h1>
            <p className="mx-auto max-w-2xl text-base text-white/85 md:text-xl">
              Ukur kemampuan verbal, kuantitatif, logika, dan spasial Anda secara daring,
              dengan hasil dan sertifikat yang diakui ITS.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="min-w-48 shadow-lg shadow-black/20">
              <Link href="/register">Daftar Tes Sekarang</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="min-w-48 border-white/70 bg-white/10 text-white backdrop-blur hover:bg-white/20 hover:text-white"
            >
              <Link
                href="/panduan/panduan-pendaftaran-dan-pelaksanaan-peserta.pdf"
                target="_blank"
                rel="noopener noreferrer"
              >
                <BookOpenText className="h-4 w-4" />
                Lihat Panduan Peserta
              </Link>
            </Button>
          </div>
        </div>

        <a
          href="#informasi"
          aria-label="Gulir ke informasi"
          className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/70 transition-colors hover:text-white"
        >
          <ChevronDown className="h-7 w-7 animate-bounce" />
        </a>
      </div>

      <section className="relative z-10 text-white">
        <div className="mx-auto px-6 md:px-12 lg:px-40 py-16">
          <div className="mb-8 space-y-1">
            <p className="text-sm font-medium uppercase tracking-widest text-white/70">Dokumentasi</p>
            <p className="text-xl md:text-2xl font-semibold">Galeri myITS TPKA</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="relative aspect-4/3 overflow-hidden rounded-xl ring-1 ring-white/15"
              >
                <Image
                  src={`/landing/g${i + 1}.webp`}
                  alt={`Galeri ${i + 1}`}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover transition-transform duration-500 hover:scale-105"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </section>
  );
}
