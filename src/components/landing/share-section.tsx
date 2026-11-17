/**
 * File: src/components/landing/share-section.tsx
 * Purpose: Landing-page section about sharing a report. Shows the artwork
 * each diagnosis puts on its share card, with the score band that earns it,
 * and explains the three ways a result travels: the link preview, the
 * prepared post for X and scanning someone else's wallet. The cards are built
 * from TRAUMA_TIERS and TIER_ARTWORK, so this section always matches what the
 * share image route actually renders.
 */
import {
  ArrowRight,
  Link2,
  ScanSearch,
  Send,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { TIER_ARTWORK } from "@/components/report/tier-artwork";
import { SectionHeading } from "@/components/section-heading";
import { TRAUMA_TIERS } from "@/lib/scanner/trauma-score";

interface SharingMethod {
  title: string;
  description: string;
  icon: LucideIcon;
}

const SHARING_METHODS: readonly SharingMethod[] = [
  {
    title: "The link is the card",
    description:
      "Every report has its own address. Paste it anywhere that previews links and the score, the diagnosis and the artwork show up with it.",
    icon: Link2,
  },
  {
    title: "Post it to X",
    description:
      "The report page opens a post that is already written, with your score, your diagnosis and the link attached.",
    icon: Send,
  },
  {
    title: "Scan someone else",
    description:
      "Any Solana address works. Run a friend, a rival or a wallet everyone follows, then send them their chart.",
    icon: ScanSearch,
  },
];

export function ShareSection() {
  return (
    <section
      id="share"
      aria-labelledby="share-title"
      className="border-t border-line"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-5 py-20 sm:px-8">
        <div>
          <SectionHeading
            titleId="share-title"
            label="Share"
            title="A diagnosis is meant to be posted"
          >
            Every scan ends in a share card. There are five diagnoses, each with
            its own artwork, and your score decides which one you get.
          </SectionHeading>
        </div>

        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {TRAUMA_TIERS.map((traumaTier) => {
            const tierArtwork = TIER_ARTWORK[traumaTier.key];

            return (
              <li
                key={traumaTier.key}
                className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-line bg-surface"
              >
                <Image
                  src={tierArtwork.image}
                  alt={tierArtwork.alternativeText}
                  sizes="(min-width: 1024px) 220px, (min-width: 640px) 33vw, 50vw"
                  className="aspect-square w-full object-cover"
                />
                <div className="flex flex-col gap-1 px-4 py-3">
                  <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
                    {traumaTier.minimumScore} to {traumaTier.maximumScore}
                  </p>
                  <h3 className="text-sm font-medium text-ink">
                    {traumaTier.name}
                  </h3>
                </div>
              </li>
            );
          })}
        </ul>

        <ul className="grid gap-6 md:grid-cols-3">
          {SHARING_METHODS.map((sharingMethod) => (
            <li
              key={sharingMethod.title}
              className="flex flex-col gap-4 border-t border-ink pt-6"
            >
              <sharingMethod.icon
                aria-hidden="true"
                className="size-5 text-ink-soft"
                strokeWidth={1.5}
              />
              <h3 className="text-base font-medium text-ink">
                {sharingMethod.title}
              </h3>
              <p className="text-sm leading-relaxed text-ink-soft">
                {sharingMethod.description}
              </p>
            </li>
          ))}
        </ul>

        <div>
          <Link
            href="/#scanner"
            className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Scan a wallet and get your card
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
