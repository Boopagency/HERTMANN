"use client";

import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { IconArrowDown } from "@/components/brand/Icons";
import { EASE_HERO as EASE } from "@/components/motion/Reveal";

/* ============================================================================
   HERO — o da versão oficial (main), trazido intacto para esta versão.
   ----------------------------------------------------------------------------
   Uma composição, não um banner. O nome da casa ocupa a largura inteira da
   página; a fotografia atravessa-o pelo centro. As letras levantam-se uma a
   uma sob a máscara, a imagem descobre-se de baixo para cima e assenta da
   escala. Ao rolar, a fotografia sobe mais devagar do que a página.

   A intro corre só na primeira visita à home em cada sessão e dura cerca de
   1 s. Depois fica marcada (sessionStorage + `html[data-intro-seen]`, posto
   antes da primeira pintura pelo script do layout) e o CSS mostra o hero já
   pronto — os elementos `.hero-intro` ficam no estado final, sem flash nem
   diferença de hidratação; entra só com a transição normal de página.
   ========================================================================== */

const WORD = "HERTMANN".split("");

/** Chave de sessão da intro — a mesma que o script inline do layout lê. */
const INTRO_KEY = "hm-intro";

function markIntroSeen() {
  document.documentElement.dataset.introSeen = "";
  try {
    sessionStorage.setItem(INTRO_KEY, "1");
  } catch {
    /* armazenamento indisponível: a marca no <html> basta nesta visita */
  }
}

export function HomeHero() {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const plateY = useTransform(scrollYProgress, [0, 1], ["0%", "-14%"]);
  const plateScale = useTransform(scrollYProgress, [0, 1], [1, 1.09]);
  const wordY = useTransform(scrollYProgress, [0, 1], ["0%", "26%"]);
  const fade = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  // A intro termina antes de 1 s (a última letra aos ~0,8 s); a partir daí (ou ao sair da home
  // antes disso) não volta a correr nesta sessão.
  useEffect(() => {
    if ("introSeen" in document.documentElement.dataset) return;
    const timer = window.setTimeout(markIntroSeen, 900);
    return () => {
      window.clearTimeout(timer);
      markIntroSeen();
    };
  }, []);

  return (
    <section
      ref={ref}
      className="relative"
      aria-labelledby="hero-marca"
      style={{ paddingTop: "var(--header-h)" }}
    >
      <div className="shell-wide relative flex min-h-[calc(100svh-var(--header-h)-var(--bar-h))] flex-col justify-between pb-[clamp(1.5rem,3vw,2.5rem)] pt-[clamp(2rem,6vw,5rem)] md:min-h-[calc(94svh-var(--header-h)-var(--bar-h))]">
        {/* — Nome da casa + fotografia — */}
        {/* Telemóvel e tablet de pé: a marca em cima, a peça por baixo,
            encaixada sob as letras. A partir de 1024 px: a peça atravessa
            o nome pelo centro. */}
        <div className="relative flex flex-1 flex-col justify-center lg:block lg:flex-row lg:items-center">
          <motion.h1
            id="hero-marca"
            className="t-hero-mark relative z-0 flex w-full justify-center lg:block lg:text-center"
            style={reduced ? undefined : { y: wordY }}
            aria-label="HERTMANN"
          >
            <span className="inline-flex max-w-full justify-center" aria-hidden="true">
              {WORD.map((letter, i) => (
                <span key={i} className="block overflow-hidden" style={{ paddingBottom: "0.08em" }}>
                  <motion.span
                    className="hero-intro block"
                    initial={reduced ? false : { y: "104%" }}
                    animate={{ y: "0%" }}
                    transition={{
                      duration: 0.6,
                      ease: EASE,
                      delay: 0.03 + i * 0.025,
                    }}
                  >
                    {letter}
                  </motion.span>
                </span>
              ))}
            </span>
          </motion.h1>

          {/* A peça atravessa o nome — o produto é o protagonista */}
          <motion.div
            className="pointer-events-none relative z-10 mx-auto -mt-[7%] w-[62vw] max-w-[20rem] lg:absolute lg:left-1/2 lg:top-1/2 lg:mx-0 lg:mt-0 lg:w-[23vw] lg:max-w-[24rem] lg:-translate-x-1/2 lg:-translate-y-[38%]"
            style={reduced ? undefined : { y: plateY }}
          >
            {/* O anel descobre-se de baixo para cima, sempre opaco — o
                nome nunca se vê através dele durante a entrada. */}
            <motion.div
              className="hero-intro"
              initial={reduced ? false : { clipPath: "inset(100% 0% 0% 0%)", scale: 1.04 }}
              animate={{ clipPath: "inset(0% 0% 0% 0%)", scale: 1 }}
              transition={{ duration: 0.65, ease: EASE, delay: 0.06 }}
            >
              <motion.div style={reduced ? undefined : { scale: plateScale }}>
                <div className="relative aspect-[764/1102] w-full">
                  <Image
                    src="/images/hero-ring.png"
                    alt="Anel HERTMANN em ouro branco, com diamante central de talhe oval"
                    fill
                    priority
                    sizes="(max-width: 768px) 64vw, 25rem"
                    className="object-contain"
                  />
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        {/* — Rodapé do hero — */}
        <motion.div
          className="relative z-20 mt-[clamp(2rem,5vw,3rem)]"
          style={reduced ? undefined : { opacity: fade }}
        >
          <span
            aria-hidden="true"
            className="mb-[clamp(1.5rem,3vw,2.25rem)] hidden justify-center text-[var(--color-ink-50)] lg:flex"
          >
            <motion.span
              animate={reduced ? undefined : { y: [0, 7, 0] }}
              transition={{ duration: 3.4, ease: "easeInOut", repeat: Infinity }}
            >
              <IconArrowDown size={18} />
            </motion.span>
          </span>

          <hr className="rule" />
          <div className="mt-5 grid items-start gap-y-5 md:grid-cols-12 md:gap-x-6">
            <motion.p
              className="hero-intro t-label-sm muted md:col-span-3"
              initial={reduced ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASE, delay: 0.28 }}
            >
              Alta joalheria
              <br />
              Curitiba, desde 1948
            </motion.p>

            <motion.p
              className="hero-intro t-lead max-w-[34ch] md:col-span-5 md:col-start-5 lg:col-span-4"
              initial={reduced ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASE, delay: 0.34 }}
            >
              Peças executadas à mão em ateliê próprio, em ouro 18k e pedras
              seleccionadas uma a uma.
            </motion.p>

            <motion.div
              className="hero-intro flex items-center justify-start md:col-span-3 md:col-start-10 md:justify-end"
              initial={reduced ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASE, delay: 0.4 }}
            >
              <ButtonLink href="/colecoes" variant="line" arrow>
                Ver as coleções
              </ButtonLink>
            </motion.div>
          </div>
        </motion.div>
      </div>

    </section>
  );
}
