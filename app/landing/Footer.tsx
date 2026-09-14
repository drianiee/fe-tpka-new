import Link from "next/link";
import { Mail, MapPin, MessageCircle } from "lucide-react";

import Logo from "@/components/common/logo";
import {
  ADMIN_EMAIL,
  ADMIN_WHATSAPP,
  TEST_INFO,
  formatWhatsAppNumber,
  hasAdminWhatsApp,
  whatsAppLink,
} from "@/lib/landing/contact";
import { footerLinks } from "@/lib/landing/navigation";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-[#FAF7FC] px-6 md:px-12 lg:px-40 py-16 overflow-hidden">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-5 lg:gap-16 mb-10">
        <div className="lg:col-span-2 md:max-w-md mx-auto lg:mx-0 space-y-4 text-center lg:text-left">
          <div className="flex justify-center lg:justify-start">
            <Logo className="h-10 md:h-12 w-36 md:w-40" />
          </div>
          <p className="text-sm leading-relaxed text-slate-600">
            TPKA ITS merupakan sebuah platform tes untuk mengukur kemampuan dasar
            kognitif peserta, seperti kemampuan verbal, kuantitatif, logika, dan
            spasial, sesuai dengan standar yang ditetapkan oleh Institut Teknologi
            Sepuluh Nopember (ITS).
          </p>
        </div>

        <div className="lg:col-span-3 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {footerLinks.map((section) => (
            <div key={section.title} className="text-center sm:text-left">
              <p className="font-semibold text-slate-900">{section.title}</p>
              <ul className="mt-3 space-y-2">
                {section.links.map((link) => {
                  // Tautan ke situs luar dibuka di tab baru supaya peserta tidak keluar dari halaman ini.
                  const external = /^https?:\/\//.test(link.href);

                  return (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        target={external ? "_blank" : undefined}
                        rel={external ? "noopener noreferrer" : undefined}
                        className="text-sm text-slate-600 transition-colors hover:text-[#013880]"
                      >
                        {link.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          <div className="text-center sm:text-left">
            <p className="font-semibold text-slate-900">Kontak</p>
            <ul className="mt-3 space-y-3 text-sm text-slate-600">
              {hasAdminWhatsApp ? (
                <li>
                  <a
                    href={whatsAppLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-start gap-2 transition-colors hover:text-[#013880]"
                  >
                    <MessageCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      WhatsApp Admin
                      <br />
                      <span className="font-medium text-slate-900">
                        {formatWhatsAppNumber(ADMIN_WHATSAPP)}
                      </span>
                    </span>
                  </a>
                </li>
              ) : null}
              {ADMIN_EMAIL ? (
                <li>
                  <a
                    href={`mailto:${ADMIN_EMAIL}`}
                    className="inline-flex items-start gap-2 transition-colors hover:text-[#013880]"
                  >
                    <Mail className="mt-0.5 h-4 w-4 shrink-0" />
                    <span className="break-all">{ADMIN_EMAIL}</span>
                  </a>
                </li>
              ) : null}
              <li className="inline-flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  {TEST_INFO.hardcopy.office}
                  <br />
                  {TEST_INFO.hardcopy.location}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 border-t border-slate-200 pt-5 text-center text-sm text-slate-600 sm:flex-row sm:justify-between sm:text-left">
        <p>© {year} myITS TPKA. All rights reserved.</p>
        <div className="flex items-center space-x-4">
          {/* {socialLinks.map((social) => {
            const Icon = social.icon;
            return (
              <Link
                key={social.name}
                href={social.href}
                aria-label={social.name}
                className="text-slate-500 transition-colors hover:text-[#013880]"
              >
                <Icon className="h-5 w-5" />
              </Link>
            );
          })} */}
        </div>
      </div>
    </footer>
  );
}
