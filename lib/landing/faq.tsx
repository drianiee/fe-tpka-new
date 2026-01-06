import { ReactNode } from "react";

export type FAQ = {
  id: string;
  question: string;
  answer: ReactNode;
};

export const FAQS: FAQ[] = [
  {
    id: "daftar",
    question: "Bagaimana cara mendaftar TPKA?",
    answer: (
      <>
        Anda dapat mendaftar melalui halaman <strong>Pendaftaran</strong>, isi
        data diri, pilih jadwal tes, lalu selesaikan pembayaran. Bukti dan tiket
        akan dikirim ke email.
      </>
    ),
  },
  {
    id: "syarat",
    question: "Apa saja syarat peserta?",
    answer: (
      <>
        Peserta merupakan siswa kelas 12 atau lulusan maksimal 2 tahun terakhir,
        menyiapkan KTP/Kartu Pelajar, serta email aktif untuk verifikasi.
      </>
    ),
  },
  {
    id: "durasi",
    question: "Berapa lama durasi pelaksanaan tes?",
    answer: (
      <>
        Bisa, maksimal <em>H-3</em> dari tanggal tes melalui dashboard peserta,
        selama kuota jadwal baru masih tersedia.
      </>
    ),
  },
  {
    id: "materi",
    question: "Apa saja materi yang diujikan?",
    answer: (
      <>
        Hasil tes biasanya keluar <strong>2–3 hari kerja</strong> setelah
        pelaksanaan dan dapat diunduh di dashboard.
      </>
    ),
  },
  {
    id: "hasil",
    question: "Kapan hasil tes diumumkan?",
    answer: (
      <>
        Hasil tes biasanya keluar <strong>2–3 hari kerja</strong> setelah
        pelaksanaan dan dapat diunduh di dashboard.
      </>
    ),
  },
];