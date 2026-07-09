import Image from "next/image";
import Link from "next/link";
import { BookOpenText } from "lucide-react";
import { Button } from "@/components/ui/button";

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
        <div className="absolute inset-0 -z-10 bg-linear-to-b from-black/10 via-black/50 to-black/70" />
      </div>

      <div className="relative -mt-[100svh] h-svh z-10 flex items-center justify-center px-6 md:px-12 lg:px-40 text-center">
        <div className="max-w-4xl">
          <p className="font-semibold text-white text-3xl md:text-5xl leading-tight">
            Selamat Datang di
          </p>
          <p className="text-white text-xl md:text-3xl mt-2">
            Tes Potensi Kemampuan Akademik ITS
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="min-w-48">
              <Link href="/register">Daftar Tes Sekarang</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="min-w-48 border-white/70 bg-white/10 text-white hover:bg-white/20 hover:text-white"
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
      </div>

      <section className="relative z-10 text-white">
        <div className="mx-auto px-6 md:px-12 lg:px-40 py-16">
          <p className="text-xl md:text-2xl font-semibold mb-8">
            Galeri myITS TPKA
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="relative aspect-4/3 overflow-hidden rounded-lg">
                <Image
                  src={`/landing/g${i + 1}.webp`}
                  alt={`Galeri ${i + 1}`}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover hover:scale-105 transition-transform duration-300"
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
