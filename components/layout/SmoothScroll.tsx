"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

/**
 * Rolagem suave — o gesto de base de toda a experiência.
 * Desligada quando o sistema pede movimento reduzido, e em dispositivos
 * de toque, onde a rolagem nativa é melhor do que qualquer interpolação.
 *
 * Pára enquanto uma camada modal está aberta (o corpo recebe
 * `data-lock`), para que a página por trás do menu ou da sacola não se
 * mova. Os painéis modais levam `data-lenis-prevent` e rolam por si.
 *
 * Numa navegação nova (push), a inércia que ainda estiver em curso é
 * cortada e a página abre no topo — senão o Lenis continuaria a escrever
 * a rolagem antiga na página nova. Em voltar/avançar (popstate) só se corta
 * a inércia: a posição anterior continua a ser restaurada.
 */
export function SmoothScroll() {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);
  const previousPath = useRef(pathname);
  const fromHistory = useRef(false);

  useEffect(() => {
    const onPop = () => {
      fromHistory.current = true;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Corre no commit da rota nova, antes da pintura.
  useLayoutEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;

    const history = fromHistory.current;
    fromHistory.current = false;

    const lenis = lenisRef.current;
    if (!lenis) return;
    // Só parar a inércia: fixa o Lenis onde a página está, sem a mover.
    if (history) lenis.scrollTo(window.scrollY, { immediate: true, force: true });
    else lenis.scrollTo(0, { immediate: true, force: true });
  }, [pathname]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (reduced || coarse) return;

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      wheelMultiplier: 1,
    });
    lenisRef.current = lenis;

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
      lenisRef.current = null;
    };
  }, []);

  return null;
}
