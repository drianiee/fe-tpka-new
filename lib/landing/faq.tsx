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
        Buat akun terlebih dahulu, verifikasi email, lalu lengkapi profil
        peserta seperti identitas, tanggal lahir, dan nomor HP. Setelah itu
        pilih jadwal yang masih tersedia dan lanjutkan pembayaran melalui
        Midtrans. Jadwal akan masuk ke dashboard setelah pembayaran berhasil
        dikonfirmasi oleh sistem.
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
        Durasi tes mengikuti pengaturan paket soal pada jadwal yang dipilih.
        Secara umum tes dibagi menjadi empat sesi: Verbal, Kuantitatif, Logika,
        dan Spasial. Waktu setiap sesi berjalan sesuai jadwal server, peserta perlu masuk tepat waktu agar durasi tidak terpotong.
      </>
    ),
  },
  {
    id: "materi",
    question: "Apa saja materi yang diujikan?",
    answer: (
      <>
        Materi TPKA terdiri dari empat bagian utama, yaitu Verbal,
        Kuantitatif, Logika, dan Spasial. Setiap bagian dikerjakan dalam sesi
        terpisah sesuai durasi yang sudah ditentukan pada paket soal.
      </>
    ),
  },
  {
    id: "hasil",
    question: "Kapan hasil tes diumumkan?",
    answer: (
      <>
        Hasil dihitung otomatis setelah peserta menyelesaikan seluruh sesi
        ujian. Nilai dan sertifikat dapat dilihat melalui dashboard peserta
        pada detail jadwal tes yang sudah selesai.
      </>
    ),
  },
  {
    id: "jadwal",
    question: "Mengapa jadwal tertentu tidak muncul di halaman utama?",
    answer: (
      <>
        Halaman utama hanya menampilkan jadwal umum yang belum dimulai dan
        masih berada dalam periode pendaftaran. Jika batas pendaftaran sudah
        lewat, kuota penuh, atau jadwal tersebut khusus mitra, jadwal tidak
        ditampilkan di halaman utama.
      </>
    ),
  },
  {
    id: "pembayaran",
    question: "Kapan pembayaran dianggap berhasil?",
    answer: (
      <>
        Pembayaran dianggap berhasil setelah sistem menerima konfirmasi resmi
        dari Midtrans. Jika sudah membayar tetapi status belum berubah,
        tunggu beberapa saat dan cek kembali menu <strong>Jadwal Tes</strong>{" "}
        di dashboard peserta.
      </>
    ),
  },
];
