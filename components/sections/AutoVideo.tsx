"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Filme curto, mudo, em loop. Só corre enquanto está no ecrã, e nunca
 * com movimento reduzido. O cartaz é uma imagem optimizada colocada por
 * baixo (ver `PanelMedia`): o vídeo é transparente até ter o primeiro
 * fotograma, por isso não há salto de composição nem descarga dupla.
 */
export function AutoVideo({
  src,
  poster,
  className,
  style,
}: {
  src: string;
  /** Só para quando não existe imagem por baixo. */
  poster?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    setAllowed(true);

    const video = ref.current;
    if (!video) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.15 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      className={cn("absolute inset-0 h-full w-full object-cover", className)}
      style={style}
      src={allowed ? src : undefined}
      poster={poster}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden="true"
      tabIndex={-1}
    />
  );
}
