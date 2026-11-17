/**
 * File: src/app/page.tsx
 * Purpose: Landing page. Composes the scanner hero with the explanatory
 * sections: how it works, sharing, the art gallery, the leaderboard,
 * methodology, the roadmap and questions. Everything is prerendered at build time
 * except the leaderboard preview, which streams in per request.
 */
import { FaqSection } from "@/components/landing/faq-section";
import { HeroSection } from "@/components/landing/hero-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { LeaderboardTeaserSection } from "@/components/landing/leaderboard-teaser-section";
import { MethodologySection } from "@/components/landing/methodology-section";
import { RoadmapSection } from "@/components/landing/roadmap-section";
import { ShareSection } from "@/components/landing/share-section";
import { WardGallerySection } from "@/components/landing/ward-gallery-section";

export default function LandingPage() {
  return (
    <main className="flex flex-1 flex-col">
      <HeroSection />
      <HowItWorksSection />
      <ShareSection />
      <WardGallerySection />
      <LeaderboardTeaserSection />
      <MethodologySection />
      <RoadmapSection />
      <FaqSection />
    </main>
  );
}
