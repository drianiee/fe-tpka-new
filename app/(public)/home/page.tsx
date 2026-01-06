import React from 'react';
import BerandaSection from '@/app/landing/BerandaSection';
import JadwalSection from '@/app/landing/JadwalSection';
import MengapaSection from '@/app/landing/MengapaSection';
import FaqSection from '@/app/landing/FaqSection';
import Footer from '@/app/landing/Footer';

export default function Page() {
  return (
    <main>
      <BerandaSection />
      <JadwalSection />
      <MengapaSection />
      <FaqSection />
      <Footer />
    </main>
  );
}