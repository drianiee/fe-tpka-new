import React from 'react';
import BerandaSection from '@/app/landing/BerandaSection';
import InfoSection from '@/app/landing/InfoSection';
import JadwalSection from '@/app/landing/JadwalSection';
import MengapaSection from '@/app/landing/MengapaSection';
import FaqSection from '@/app/landing/FaqSection';
import Footer from '@/app/landing/Footer';
import { WhatsAppFab } from '@/components/common/WhatsAppFab';

export default function Page() {
  return (
    <main>
      <BerandaSection />
      <InfoSection />
      <JadwalSection />
      <MengapaSection />
      <FaqSection />
      <Footer />
      <WhatsAppFab />
    </main>
  );
}