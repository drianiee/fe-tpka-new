export type KeunggulanItem = {
  id: string;
  title: string;
  desc: string;
  icon: "activity" | "shield" | "users";
};

export const MENGAPA: KeunggulanItem[] = [
  {
    id: "std",
    title: "Seleksi Terstandar",
    desc: "Menyediakan alat ukur potensi akademik yang objektif.",
    icon: "activity",
  },
  {
    id: "aman",
    title: "Keamanan & Validitas",
    desc: "Proses terjaga dengan validitas yang terukur.",
    icon: "shield",
  },
  {
    id: "akses",
    title: "Akses Luas",
    desc: "Mudah diakses oleh peserta di berbagai daerah.",
    icon: "users",
  },
];