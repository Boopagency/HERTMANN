/* ============================================================================
   Tokens de movimento — a mesma escala no CSS (app/globals.css, :root) e
   no JavaScript (motion/react). Mudar o ritmo da loja é mudar este ficheiro
   e as variáveis --dur-* / --ease-* do CSS, nada mais.

   fast    200 ms — hover, foco, pequenos estados (opacidade, cor, fio)
   normal  340 ms — acordeões, filtros, véu, trocas de conteúdo
   slow    560 ms — painéis, crossfade de imagem, entradas editoriais

   Uma curva de saída suave, sem ressalto (easeOutQuint-like). As saídas
   são mais curtas do que as entradas: fechar deve sentir-se imediato.
   ========================================================================== */

export type Bezier = [number, number, number, number];

/** Curva principal — cubic-bezier(0.22, 1, 0.36, 1). */
export const EASE: Bezier = [0.22, 1, 0.36, 1];

/** Saídas — começa já em movimento e acelera para fora de cena. */
export const EASE_EXIT: Bezier = [0.4, 0, 0.2, 1];

/** Entrada-e-saída simétrica, para o raro movimento que vai e volta. */
export const EASE_IN_OUT: Bezier = [0.65, 0, 0.35, 1];

/** Durações em segundos (motion/react). */
export const DUR = {
  fast: 0.2,
  normal: 0.34,
  slow: 0.56,
} as const;

/** Intervalo entre itens de uma lista que se compõe. */
export const STAGGER = 0.03;
