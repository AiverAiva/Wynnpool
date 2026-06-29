'use client';

import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { useMotionSettings } from '@/components/provider/MotionSettingsProvider';
import WynnPublisher from '@/components/custom/WynnPublisher';
import ServerStatusDisplay from '@/components/custom/server-status';

/* ------------------------------------------------------------------ */
/* Noise Texture (CSS-only)                                            */
/* ------------------------------------------------------------------ */

function NoiseOverlay() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[1] opacity-[0.03]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '128px 128px',
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Dot Grid Background                                                 */
/* ------------------------------------------------------------------ */

function DotGrid() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-[1] opacity-10 text-black dark:text-white"
      style={{
        backgroundImage:
          'radial-gradient(circle, currentColor 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Homepage                                                            */
/* ------------------------------------------------------------------ */

export default function HomePage() {
  const { isReducedMotion } = useMotionSettings();
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = !isReducedMotion && !prefersReducedMotion;

  return (
    <>
      <NoiseOverlay />

      <main className="relative z-[2]">
        {/* ============================================================ */}
        {/* HERO                                                          */}
        {/* ============================================================ */}
        <section className="relative min-h-[100dvh] flex items-center overflow-hidden">
          {/* Layer 1: Background images - masked to fade at bottom */}
          <div
            className="absolute inset-0 dark:hidden"
            style={{
              maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
            }}
          >
            <Image
              src="/images/background/light-forest.jpg"
              alt=""
              fill
              className="object-cover object-center opacity-30"
              priority
            />
          </div>
          <div
            className="absolute inset-0 hidden dark:block"
            style={{
              maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
            }}
          >
            <Image
              src="/images/background/silent-expanse.webp"
              alt=""
              fill
              className="object-cover object-center opacity-20"
              priority
            />
          </div>

          {/* Layer 2: Dot grid */}
          <DotGrid />

          <div className="relative z-10 mx-auto w-full max-w-5xl px-6 md:px-12">
            <motion.h1
              className="font-[family-name:var(--font-pixelify)] text-[clamp(3rem,8vw,6rem)] leading-[0.9] tracking-[0.02em] text-foreground"
              initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.7,
                delay: 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              Wynnpool
            </motion.h1>

            <motion.p
              className="mt-5 max-w-md text-[17px] leading-relaxed text-muted-foreground"
              initial={shouldAnimate ? { opacity: 0, y: 16 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.2,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              Items, lootruns, raids, events, stats.
              Every tool you need for Wynncraft, in one place.
            </motion.p>
          </div>
        </section>

        {/* ============================================================ */}
        {/* ARTICLES                                                      */}
        {/* ============================================================ */}
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-5xl px-6 md:px-12">
            <motion.div
              className="mb-8"
              initial={shouldAnimate ? { opacity: 0, y: 16 } : false}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                From Wynncraft
              </h2>
              <p className="mt-2 text-[15px] text-muted-foreground">
                Latest news, events, and game updates.
              </p>
            </motion.div>

            <WynnPublisher />
          </div>
        </section>

        {/* ============================================================ */}
        {/* LIVE SERVER STATUS                                            */}
        {/* ============================================================ */}
        <section className="border-t border-border bg-muted/30 py-20 md:py-28">
          <div className="mx-auto max-w-5xl px-6 md:px-12">
            <motion.div
              className="mb-8"
              initial={shouldAnimate ? { opacity: 0, y: 16 } : false}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                  Server Status
                </h2>
                <div className="flex items-center gap-1.5">
                  <div className="size-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[11px] text-muted-foreground">Live</span>
                </div>
              </div>
              <p className="mt-2 text-[15px] text-muted-foreground">
                Real-time data from all Wynncraft servers.
              </p>
            </motion.div>

            <motion.div
              initial={shouldAnimate ? { opacity: 0, y: 16 } : false}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                duration: 0.5,
                delay: 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <ServerStatusDisplay />
            </motion.div>
          </div>
        </section>
      </main>
    </>
  );
}
