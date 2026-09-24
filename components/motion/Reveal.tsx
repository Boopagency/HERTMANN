"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useRef } from "react";
import { DUR, EASE, EASE_IN_OUT } from "@/components/motion/tokens";
import { cn } from "@/lib/utils";

/* ============================================================================
   Movimento HERTMANN
   ----------------------------------------------------------------------------
   Apenas opacity, transform e clip-path, com os tokens de
   components/motion/tokens.ts. Entradas curtas e deslocamentos pequenos:
   o conteúdo assenta, não viaja. Nada salta, nada gira, nada pisca.
   `prefers-reduced-motion` desliga tudo — o conteúdo aparece de imediato.
   ========================================================================== */

export { DUR, EASE, EASE_EXIT, STAGGER } from "@/components/motion/tokens";
export const EASE_VEIL = EASE_IN_OUT;

/** A curva expo-out do hero da versão oficial — mantida só para ele. */
export const EASE_HERO: [number, number, number, number] = [0.16, 1, 0.3, 1];

/* A margem tem de ser declarada em pixels — percentagens são ignoradas. */
const VIEWPORT = { once: true, margin: "0px 0px -64px 0px" } as const;

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  /** Distância percorrida na entrada, em pixels. */
  y?: number;
  as?: "div" | "span" | "li" | "section" | "header" | "footer" | "article";
};

export function Reveal({
  children,
  className,
  delay = 0,
  duration = DUR.slow,
  y = 14,
  as = "div",
}: RevealProps) {
  const reduced = useReducedMotion();
  const Comp = motion[as] as typeof motion.div;

  if (reduced) return <Comp className={className}>{children}</Comp>;

  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration, ease: EASE, delay }}
    >
      {children}
    </Comp>
  );
}

/** Encadeia os filhos directos com um intervalo constante. */
export function RevealGroup({
  children,
  className,
  stagger = 0.06,
  delay = 0,
  y = 14,
  as = "div",
}: RevealProps & { stagger?: number }) {
  const reduced = useReducedMotion();
  const Comp = motion[as] as typeof motion.div;

  if (reduced) return <Comp className={className}>{children}</Comp>;

  return (
    <Comp
      className={className}
      initial="hidden"
      whileInView="shown"
      viewport={VIEWPORT}
      variants={{
        hidden: {},
        shown: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
    >
      {Array.isArray(children)
        ? children.map((child, i) => (
            <motion.div
              key={i}
              variants={{
                hidden: { opacity: 0, y },
                shown: { opacity: 1, y: 0, transition: { duration: DUR.slow, ease: EASE } },
              }}
            >
              {child}
            </motion.div>
          ))
        : children}
    </Comp>
  );
}

/**
 * Texto que se levanta linha a linha, sob uma máscara.
 * É o gesto editorial da casa: a frase constrói-se, não aparece.
 *
 * O observador vive no elemento exterior. As linhas interiores estão
 * escondidas pelo `overflow: hidden` do seu invólucro e, se fossem elas a
 * ser observadas, nunca chegariam a intersectar a janela — ficariam para
 * sempre à espera. Por isso são conduzidas por variantes.
 */
export function RevealLines({
  lines,
  className,
  lineClassName,
  delay = 0,
  stagger = 0.06,
  duration = 0.65,
  as: Tag = "p",
  ...rest
}: {
  lines: string[];
  className?: string;
  lineClassName?: string;
  delay?: number;
  stagger?: number;
  duration?: number;
  as?: "p" | "h1" | "h2" | "h3" | "div";
  id?: string;
  "aria-label"?: string;
}) {
  const reduced = useReducedMotion();
  const MotionTag = motion[Tag] as typeof motion.p;

  if (reduced) {
    return (
      <Tag className={className} {...rest}>
        {lines.map((line, i) => (
          <span key={i} className={cn("block", lineClassName)}>
            {line}
          </span>
        ))}
      </Tag>
    );
  }

  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="shown"
      viewport={VIEWPORT}
      variants={{ hidden: {}, shown: { transition: { staggerChildren: stagger, delayChildren: delay } } }}
      {...rest}
    >
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden" style={{ paddingBottom: "0.08em" }}>
          <motion.span
            className={cn("block", lineClassName)}
            variants={{
              hidden: { y: "110%" },
              shown: { y: "0%", transition: { duration, ease: EASE } },
            }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </MotionTag>
  );
}

/**
 * Véu que se retira de baixo para cima, com a imagem a assentar da escala.
 * Usado em todas as fotografias de abertura de secção.
 */
export function RevealVeil({
  children,
  className,
  delay = 0,
  duration = 0.9,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}) {
  const reduced = useReducedMotion();

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={cn("overflow-hidden", className)}
      initial="hidden"
      whileInView="shown"
      viewport={VIEWPORT}
      variants={{
        hidden: { clipPath: "inset(100% 0% 0% 0%)" },
        shown: {
          clipPath: "inset(0% 0% 0% 0%)",
          transition: { duration, ease: EASE, delay },
        },
      }}
    >
      <motion.div
        className="h-full w-full"
        variants={{
          hidden: { scale: 1.06 },
          shown: { scale: 1, transition: { duration: duration + 0.2, ease: EASE, delay } },
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

/**
 * Deslocamento vertical ligado ao scroll. Amplitudes pequenas — o efeito
 * deve sentir-se, não ver-se.
 */
export function Parallax({
  children,
  className,
  distance = 60,
  offset = ["start end", "end start"],
}: {
  children: React.ReactNode;
  className?: string;
  distance?: number;
  offset?: [string, string];
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    offset: offset as any,
  });
  const raw = useTransform(scrollYProgress, [0, 1], [distance, -distance]);
  const y = useSpring(raw, { stiffness: 90, damping: 26, mass: 0.4 });

  return (
    <div ref={ref} className={className}>
      {reduced ? children : <motion.div style={{ y }}>{children}</motion.div>}
    </div>
  );
}

/** Escala ligada ao scroll — o movimento cinematográfico das grandes imagens. */
export function ScrollScale({
  children,
  className,
  from = 1.12,
  to = 1,
}: {
  children: React.ReactNode;
  className?: string;
  from?: number;
  to?: number;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const scale = useTransform(scrollYProgress, [0, 1], [from, to]);

  return (
    <div ref={ref} className={cn("overflow-hidden", className)}>
      {reduced ? (
        children
      ) : (
        <motion.div style={{ scale }} className="h-full w-full">
          {children}
        </motion.div>
      )}
    </div>
  );
}

export type { MotionValue };
