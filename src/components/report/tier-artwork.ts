/**
 * File: src/components/report/tier-artwork.ts
 * Purpose: Maps each diagnosis tier to its artwork for use on report pages.
 * These are the same files the share card embeds (src/assets/tier-art), so a
 * report and its share image always show the same picture for a status.
 */
import type { StaticImageData } from "next/image";
import acuteRugTraumaArt from "@/assets/tier-art/acute_rug_trauma.jpg";
import chronicBagholderArt from "@/assets/tier-art/chronic_bagholder.jpg";
import clinicallyFineArt from "@/assets/tier-art/clinically_fine.jpg";
import mildBagFatigueArt from "@/assets/tier-art/mild_bag_fatigue.jpg";
import terminalDegeneracyArt from "@/assets/tier-art/terminal_degeneracy.jpg";
import type { TraumaTierKey } from "@/lib/scanner/types";

interface TierArtwork {
  image: StaticImageData;
  /** Description of the picture for screen readers. */
  alternativeText: string;
}

export const TIER_ARTWORK: Record<TraumaTierKey, TierArtwork> = {
  clinically_fine: {
    image: clinicallyFineArt,
    alternativeText:
      "The nurse, moved to tears, as a former patient hands her flowers.",
  },
  mild_bag_fatigue: {
    image: mildBagFatigueArt,
    alternativeText:
      "The nurse by a train window at sunset, holding up a green and white capsule.",
  },
  chronic_bagholder: {
    image: chronicBagholderArt,
    alternativeText:
      "A tired trader in a beanie lying in bed, holding a framed photo.",
  },
  acute_rug_trauma: {
    image: acuteRugTraumaArt,
    alternativeText:
      "The nurse pulling a crying trader out of a sea of red candles with a life ring.",
  },
  terminal_degeneracy: {
    image: terminalDegeneracyArt,
    alternativeText:
      "The nurse holding out a capsule, with the caption: take your medicine.",
  },
};
