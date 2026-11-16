/**
 * File: src/app/page.tsx
 * Purpose: Landing page. Composes the scanner hero with the explanatory
 * sections: how it works, the art gallery, methodology, the fund, the roadmap
 * and questions.
 * Fully static, so it is prerendered at build time.
 */
import { FaqSection } from "@/components/landing/faq-section";
import { FundSection } from "@/components/landing/fund-section";
import { HeroSection } from "@/components/landing/hero-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { MethodologySection } from "@/components/landing/methodology-section";
import { RoadmapSection } from "@/components/landing/roadmap-section";
import { WardGallerySection } from "@/components/landing/ward-gallery-section";

export default function LandingPage() {
  return (
    <main className="flex flex-1 flex-col">
      <HeroSection />
      <HowItWorksSection />
      <WardGallerySection />
      <MethodologySection />
      <FundSection />
      <RoadmapSection />
      <FaqSection />
    </main>
  );
}
