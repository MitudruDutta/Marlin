"use client";

import { HeroSection } from "@/components/hero-section-1";
import { CyberneticBentoGrid } from "@/components/BentoGrid";
import FAQ from "@/components/blocks/FAQ";
import  Footer  from "@/components/blocks/Footer";

export default function Home() {
  return (
    <>
      <HeroSection />
      <CyberneticBentoGrid />
      <FAQ />
      <Footer />
    </>
  );
}