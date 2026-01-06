import { footerLinks, socialLinks } from "@/lib/landing/navigation";
import Link from "next/link";

import Logo from "@/components/common/logo";

export default function Footer() {
  return (
    <div className="bg-[#FAF7FC] px-6 md:px-12 lg:px-40 py-16 overflow-hidden">
      <div className="grid grid-cols-1 gap-12 lg:gap-16 row-gap-10 mb-8 lg:grid-cols-4">
        <div className="lg:col-span-2 md:max-w-md mx-auto lg:mx-0 md:space-y-4 space-y-2 text-center lg:text-left">
          <div className="flex flex-col items-center gap-3 md:flex-row md:items-center md:justify-start">
            <Logo className="h-10 md:h-12 w-36 md:w-40" />
          </div>
          <div className="lg:max-w-sm">
            <p className="text-sm text-gray-600">
              TPKA ITS merupakan sebuah platform tes untuk mengukur kemampuan
              dasar kognitif peserta, seperti kemampuan verbal, kuantitatif,
              logika, dan spasial, sesuai dengan standar yang ditetapkan oleh
              Institut Teknologi Sepuluh Nopember (ITS).
            </p>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="grid grid-cols-2">
            {footerLinks.map((section, index) => (
              <div key={index} className="text-center sm:text-left">
                <p>{section.title}</p>
                <ul className="mt-2 space-y-1">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <Link
                        href={link.href}
                        className="text-gray-600 transition-colors duration-300 hover:text-deep-purple-accent-400 text-sm"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col text-sm text-gray-600 items-center gap-4 sm:flex-row sm:items-center sm:justify-between pt-5 border-t text-center sm:text-left">
        <p>© Copyright 2025 myITS TPKA. All rights reserved.</p>
        <div className="flex items-center space-x-4">
          {socialLinks.map((social, index) => {
            const Icon = social.icon;
            return (
              <Link
                key={index}
                href={social.href}
                className="text-gray-500 transition-colors duration-300 hover:text-deep-purple-accent-400"
              >
                <Icon className="h-5 w-5" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}