import { useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Premium gold progress bar shown while routes/loaders are pending.
 * Mobile-friendly: hardware accelerated transform, no layout thrash.
 */
export function RouteProgress() {
  const isLoading = useRouterState({ select: (s) => s.isLoading || s.isTransitioning });
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf: number;
    let timeout: ReturnType<typeof setTimeout>;
    if (isLoading) {
      setVisible(true);
      setProgress(8);
      let p = 8;
      const tick = () => {
        p = Math.min(p + (90 - p) * 0.08, 90);
        setProgress(p);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    } else if (visible) {
      setProgress(100);
      timeout = setTimeout(() => { setVisible(false); setProgress(0); }, 280);
    }
    return () => { cancelAnimationFrame(raf); clearTimeout(timeout); };
  }, [isLoading]);

  return (
    <div
      aria-hidden
      className={cn(
        "fixed top-0 left-0 right-0 z-[100] h-[2px] pointer-events-none transition-opacity duration-300",
        visible ? "opacity-100" : "opacity-0",
      )}
    >
      <div
        className="h-full origin-left bg-gradient-to-r from-gold via-[hsl(45_85%_70%)] to-gold shadow-[0_0_12px_rgba(184,134,47,0.7)] will-change-transform"
        style={{ transform: `scaleX(${progress / 100})`, transition: "transform 180ms ease-out" }}
      />
    </div>
  );
}