/**
 * File: src/components/landing/ward-gallery-section.tsx
 * Purpose: Gallery of the brand's mascot art, presented as notes from the
 * ward. Uses a CSS multi-column layout so portrait and square artwork sit
 * together without cropping.
 */
import Image, { type StaticImageData } from "next/image";
import doomerFramedPhoto from "@/assets/art/doomer-framed-photo.jpg";
import nursePillHammerBear from "@/assets/art/nurse-pill-hammer-bear.jpg";
import nurseRescueRedCandles from "@/assets/art/nurse-rescue-red-candles.jpg";
import nurseStopCopingPoster from "@/assets/art/nurse-stop-coping-poster.jpg";
import nurseThankYouFlowers from "@/assets/art/nurse-thank-you-flowers.jpg";
import nurseTrainWindow from "@/assets/art/nurse-train-window.jpg";
import { SectionHeading } from "@/components/section-heading";

interface WardArtwork {
  image: StaticImageData;
  /** Full description for screen readers. */
  alternativeText: string;
  /** Short visible caption, written as a ward note. */
  caption: string;
}

/**
 * Order matters: CSS columns fill top to bottom, then left to right, so the
 * list alternates portrait and square pieces to keep the columns balanced.
 */
const WARD_ARTWORKS: readonly WardArtwork[] = [
  {
    image: nurseStopCopingPoster,
    alternativeText:
      "Poster of the fund's nurse holding a clipboard under the words: stop coping and start healing.",
    caption: "House rule, posted in every room.",
  },
  {
    image: nurseRescueRedCandles,
    alternativeText:
      "The nurse, riding a giant capsule, pulls a crying trader out of a sea of red candles with a life ring.",
    caption: "Pulled from a sea of red candles.",
  },
  {
    image: nursePillHammerBear,
    alternativeText:
      "The nurse swings a capsule-shaped hammer at a startled cartoon bear while a trader cheers at a green chart.",
    caption: "Bear market, treated on arrival.",
  },
  {
    image: doomerFramedPhoto,
    alternativeText:
      "A tired trader in a beanie lies in bed holding a framed photo of the nurse.",
    caption: "Admitted after buying the top. Keeps the photo close.",
  },
  {
    image: nurseThankYouFlowers,
    alternativeText:
      "The nurse covers her face, moved to tears, as a former patient hands her a bouquet of flowers.",
    caption: "Discharged in good spirits. Sent flowers.",
  },
  {
    image: nurseTrainWindow,
    alternativeText:
      "The nurse sits by a train window at sunset, holding up a green and white capsule.",
    caption: "Day off. Still carrying the green pill.",
  },
];

export function WardGallerySection() {
  return (
    <section
      id="ward"
      aria-labelledby="ward-title"
      className="border-t border-line"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-5 py-20 sm:px-8">
        <div>
          <SectionHeading
            titleId="ward-title"
            label="From the ward"
            title="Notes on recent admissions"
          >
            The market keeps sending patients. The nurse keeps the charts.
          </SectionHeading>
        </div>

        <ul className="columns-1 gap-6 sm:columns-2 lg:columns-3">
          {WARD_ARTWORKS.map((wardArtwork) => (
            // break-inside-avoid keeps each figure whole within its column.
            <li key={wardArtwork.caption} className="mb-6 break-inside-avoid">
              <figure className="overflow-hidden rounded-xl border border-line bg-surface">
                <Image
                  src={wardArtwork.image}
                  alt={wardArtwork.alternativeText}
                  placeholder="blur"
                  sizes="(min-width: 1024px) 22rem, (min-width: 640px) 50vw, 100vw"
                  className="h-auto w-full"
                />
                <figcaption className="border-t border-line px-5 py-3.5 text-sm text-ink-soft">
                  {wardArtwork.caption}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
