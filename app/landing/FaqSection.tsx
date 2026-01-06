"use client";

import * as React from "react";
import { FAQS } from "@/lib/landing/faq";

export default function FaqSection() {
  const [openId, setOpenId] = React.useState<string | null>(null);

  const toggle = (id: string) => {
    setOpenId((cur) => (cur === id ? null : id));
  };

  return (
    <section
      id="faq"
      className="relative space-y-8 bg-[#FAF7FC] px-6 md:px-12 lg:px-40 py-16 overflow-hidden"
    >
      <div className="w-full space-y-2 text-primarytpka">
        <p className="text-base md:text-lg font-medium italic text-slate-700">FAQ</p>
        <div className="flex space-y-1 items-baseline flex-col md:flex-row md:space-x-2">
          <p className="text-2xl md:text-4xl font-semibold">Frequently Asked Questions</p>
          <p className="text-base font-medium">(Daftar Pertanyaan Umum)</p>
        </div>
      </div>

      <div className="space-y-4">
        {FAQS.map((item) => {
          const isOpen = openId === item.id;
          const contentId = `faq-panel-${item.id}`;
          const buttonId = `faq-button-${item.id}`;

          return (
            <div key={item.id} className="rounded-xl border border-slate-200 bg-white">
              <button
                id={buttonId}
                aria-controls={contentId}
                aria-expanded={isOpen}
                onClick={() => toggle(item.id)}
                className="w-full px-5 py-4 text-left flex items-center justify-between gap-4"
              >
                <span className="text-sm md:text-base font-semibold text-slate-800">
                  {item.question}
                </span>

                <svg
                  className={`h-5 w-5 shrink-0 transition-transform ${isOpen ? "rotate-45" : ""}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>

              <div
                id={contentId}
                role="region"
                aria-labelledby={buttonId}
                className={`grid transition-[grid-template-rows,opacity] duration-200 ease-in-out ${
                  isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="px-5 pb-5 pt-0 text-slate-700">
                    <p className="text-sm md:text-base leading-relaxed">{item.answer}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
