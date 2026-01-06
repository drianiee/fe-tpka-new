import { Facebook, Instagram, Twitter } from "lucide-react";

export const ICONS = {
  activity: "/svg/seleksi.svg",
  shield: "/svg/quality.svg",
  users: "/svg/digital.svg",
};

export const footerLinks = [
  {
    title: "Tentang Kami",
    links: [
      { name: "Apa itu TPKA", href: "/" },
      { name: "DIRPAIP ITS", href: "/" },
      { name: "Reviews", href: "/" },
    ],
  },
  {
    title: "Informasi Penting",
    links: [
      { name: "Jadwal Tes", href: "/" },
      { name: "FAQ", href: "/" },
    ],
  },
];

export const socialLinks = [
  {
    name: "Twitter",
    href: "/",
    icon: Twitter,
  },
  {
    name: "Instagram",
    href: "/",
    icon: Instagram,
  },
  {
    name: "Facebook",
    href: "/",
    icon: Facebook,
  },
];

