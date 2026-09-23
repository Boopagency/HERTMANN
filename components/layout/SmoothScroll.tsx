"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Rolagem suave — o gesto de base de toda a experiência.
 * Desligada quando o sistema pede movimento reduzido, e em dispositivos
 * de toque, onde a rolagem nativa é melhor do que qualquer interpolação.
 *
 * Pára enquanto uma camada modal está aberta (o corpo recebe
 * `data-lock`), para que a página por trás do menu ou da sacola não se
 * mova. Os painéis modais levam `data-lenis-prevent` e rolam por si.
 */
export function SmoothScroll() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (reduced || coarse) return;

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      wheelMultiplier: 1,
    });

    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    const sync = () => {
      if (document.body.dataset.lock === "true") lenis.stop();
      else lenis.start();
    };
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { attributes: true, attributeFilter: ["data-lock"] });

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);

  return null;
}
