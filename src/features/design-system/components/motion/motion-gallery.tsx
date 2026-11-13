"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Button, FadeIn, Stagger, StatTile } from "@/components/ui";
import { SegmentedToggle } from "@/components/ui";
import { useTheme } from "@/components/ui";
import { DURATION, STAGGER, variants } from "@/lib/motion";

/** One transition, with a button that plays it again. */
function Demo({ name, spec, children }: { name: string; spec: string; children: (key: number) => ReactNode }) {
  const [key, setKey] = useState(0);
  return (
    <section className="mk-surface flex flex-col gap-space-5 rounded-card bg-surface-1 p-space-8">
      <div className="flex flex-wrap items-start justify-between gap-space-4">
        <div className="flex flex-col gap-space-1">
          <h2 className="text-h5 font-medium">{name}</h2>
          <p dir="ltr" className="font-mono text-caption text-text-muted">
            {spec}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setKey((k) => k + 1)}>
          Replay
        </Button>
      </div>
      <div className="flex min-h-36 items-center justify-center overflow-hidden rounded-lg bg-surface-sunken p-space-6">{children(key)}</div>
    </section>
  );
}

const box = "rounded-lg bg-surface-1 px-space-8 py-space-6 text-body font-medium shadow-edge";

/** A thing that enters on play and leaves on the second click, to see both halves. */
function EnterExit({ enter, exit, exitMs, label }: { enter: string; exit: string; exitMs: number; label: string }) {
  const [open, setOpen] = useState(true);
  const [closing, setClosing] = useState(false);
  const toggle = () => {
    if (!open) return setOpen(true);
    setClosing(true);
    window.setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, exitMs);
  };
  return (
    <div className="flex flex-col items-center gap-space-5">
      <div className="flex h-24 items-center">{open && <div className={`${box} ${closing ? exit : enter}`}>{label}</div>}</div>
      <Button variant="soft" size="xs" onClick={toggle}>
        {open ? "Close" : "Open"}
      </Button>
    </div>
  );
}

/**
 * Every transition in Markyos, live, with replay buttons and a switch that
 * simulates reduced motion, in both directions and themes. The durations and
 * curves shown are read from tailwind/motion.js, the one source.
 */
export function MotionGallery() {
  const { resolved, setChoice } = useTheme();
  const [rtl, setRtl] = useState(false);
  const [reduce, setReduce] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("dir", rtl ? "rtl" : "ltr");
    return () => root.removeAttribute("dir");
  }, [rtl]);

  return (
    <div dir={rtl ? "rtl" : "ltr"} data-reduce-motion={reduce || undefined} className="min-h-screen bg-canvas text-text">
      <header className="sticky top-0 z-sticky flex flex-wrap items-center justify-between gap-space-5 bg-canvas px-space-6 py-space-4 shadow-rule-b sm:px-space-10">
        <h1 className="text-h4 font-medium">Motion</h1>
        <div className="flex flex-wrap items-center gap-space-5">
          <SegmentedToggle label="Theme" off={{ label: "Light", icon: "sun" }} on={{ label: "Dark", icon: "moon" }} value={resolved === "dark"} onChange={(d) => setChoice(d ? "dark" : "light")} />
          <SegmentedToggle label="Direction" off={{ label: "LTR" }} on={{ label: "RTL" }} value={rtl} onChange={setRtl} />
          <SegmentedToggle label="Reduced motion" off={{ label: "Full" }} on={{ label: "Reduced" }} value={reduce} onChange={setReduce} />
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-space-8 px-space-6 py-space-10 sm:px-space-10 lg:grid-cols-2">
        <Demo name="Fade up (cards, page content)" spec={`fade-up · ${DURATION.base}ms · ease-out · 8px`}>
          {(key) => (
            <FadeIn key={key} className={box}>
              A card arriving
            </FadeIn>
          )}
        </Demo>

        <Demo name="Stagger (grids, stat rows)" spec={`fade-up · ${STAGGER.step}ms apart · first ${STAGGER.max} only`}>
          {(key) => (
            <Stagger key={key} className="grid w-full grid-cols-4 gap-space-3">
              {Array.from({ length: 8 }, (_, i) => (
                <StatTile key={i} value={String(i + 1)} label={`Item ${i + 1}`} />
              ))}
            </Stagger>
          )}
        </Demo>

        <Demo name="Menu / popover / tooltip" spec={`scale-in · ${DURATION.fast}ms in · ${DURATION.instant}ms out · 0.96 + 4px from trigger`}>
          {(key) => (
            <div key={key} data-side="bottom">
              <EnterExit enter={variants.scaleIn.enter} exit={variants.scaleIn.exit} exitMs={DURATION.instant} label="A menu" />
            </div>
          )}
        </Demo>

        <Demo name="Dialog" spec={`dialog · ${DURATION.slow}ms in · ${DURATION.fast}ms out · 0.96`}>
          {(key) => <EnterExit key={key} enter={variants.dialog.enter} exit={variants.dialog.exit} exitMs={DURATION.fast} label="A dialog" />}
        </Demo>

        <Demo name="Sheet from the start edge (mobile sidebar)" spec={`sheet · ${DURATION.slow}ms in · ${DURATION.base}ms out · mirrors in RTL`}>
          {(key) => (
            <div key={key} className="relative h-32 w-full overflow-hidden rounded-lg">
              <div className={`absolute inset-y-0 start-0 w-1/2 ${box} ${variants.slideFromStart.enter}`}>Sidebar</div>
            </div>
          )}
        </Demo>

        <Demo name="Sheet from the end edge (side panels)" spec={`sheet · ${DURATION.slow}ms in · ${DURATION.base}ms out · mirrors in RTL`}>
          {(key) => (
            <div key={key} className="relative h-32 w-full overflow-hidden rounded-lg">
              <div className={`absolute inset-y-0 end-0 w-1/2 ${box} ${variants.slideFromEnd.enter}`}>Panel</div>
            </div>
          )}
        </Demo>

        <Demo name="Toast" spec={`toast-in · ${DURATION.base}ms · from the bottom-end corner`}>
          {(key) => (
            <div key={key} className={`${box} animate-toast-in`}>
              Saved.
            </div>
          )}
        </Demo>

        <Demo name="Collapsible (alerts, bulk bar, filters)" spec={`grid rows 0fr → 1fr + opacity · ${DURATION.base}ms`}>
          {() => (
            <div className="flex w-full flex-col gap-space-4">
              <Button variant="soft" size="xs" className="self-start" onClick={() => setOpen((o) => !o)}>
                {open ? "Collapse" : "Expand"}
              </Button>
              <div className="mk-collapse" data-open={open}>
                <div>
                  <div className={box}>Shown and hidden by its own height, no measuring.</div>
                </div>
              </div>
            </div>
          )}
        </Demo>
      </main>
    </div>
  );
}
