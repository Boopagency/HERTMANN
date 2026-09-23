/* ============================================================================
   Merchandising editorial
   ----------------------------------------------------------------------------
   O que a loja mostra e em que ordem: o hero, as vitrines, os capítulos
   editoriais e as aberturas de categoria e de coleção. Separado do
   catálogo — o catálogo diz o que a casa faz; este ficheiro diz como a
   loja o apresenta. Trocar uma campanha é editar este ficheiro.

   Poucas fotografias, grandes: seis capítulos editoriais na home, cada
   um em sangria total.
   ========================================================================== */

import type { CategorySlug } from "@/lib/data/catalogue";

export type Media =
  | { kind: "image"; src: string; alt: string; focus?: string }
  /** Filme curto, mudo, em loop — com cartaz para o primeiro ecrã. */
  | { kind: "video"; src: string; poster: string; alt: string; focus?: string }
  /** Peça recortada, em escala grande, sobre a névoa de estúdio. */
  | { kind: "cutout"; src: string; alt: string };

export type Chapter = {
  media: Media;
  /** Rótulo pequeno sobre o título (usado nos capítulos da grelha). */
  label?: string;
  title: string;
  /** Uma linha de voz editorial (usada nos capítulos da grelha). */
  line?: string;
  link: { label: string; href: string };
  /** Canto do texto: superior (padrão) ou inferior esquerdo. */
  place?: "top" | "bottom";
  /** Cor do texto sobre a imagem. */
  tone?: "light" | "dark";
};

/* --------------------------------------------------------------------------
   Imagens — um nome, uma fonte. Reutilizadas por várias páginas.
   -------------------------------------------------------------------------- */

const img = {
  campaign: {
    kind: "image",
    src: "/images/campaign-hero.jpg",
    alt: "Campanha Vertente: anéis, brincos e colar HERTMANN em ouro amarelo",
    focus: "50% 35%",
  },
  portrait: {
    kind: "image",
    src: "/images/campaign-portrait.png",
    alt: "Retrato de campanha: brincos, colar e anéis HERTMANN em ouro amarelo",
    focus: "50% 38%",
  },
  noturno: {
    kind: "image",
    src: "/images/colar-noturn.jpg",
    alt: "Colar Noturno em ouro branco, usado sobre um blazer branco, em luz baixa",
    focus: "50% 70%",
  },
  hoop: {
    kind: "image",
    src: "/images/brinco-circunferencia.jpg",
    alt: "Brinco Circunferência em ouro, em close-up sobre fundo escuro",
    focus: "50% 30%",
  },
  boutique: {
    kind: "image",
    src: "/images/boutique-tall.jpg",
    alt: "Boutique HERTMANN no Batel, em Curitiba: vitrinas em latão e painel azul-marinho",
    focus: "50% 100%",
  },
  ring: {
    kind: "cutout",
    src: "/images/hero-ring.png",
    alt: "Anel HERTMANN em ouro branco, com diamante central de talhe oval",
  },
  solsticioFilm: {
    kind: "video",
    src: "/images/video-forma-colares.mp4",
    poster: "/images/posters/video-forma-colares.jpg",
    alt: "Colar fino em ouro usado no dia a dia, durante a leitura",
    focus: "50% 55%",
  },
  handRing: {
    kind: "image",
    src: "/images/anel-noturno.jpg",
    alt: "Anel Noturno, solitário em ouro branco, usado na mão",
    focus: "50% 36%",
  },
  macroRing: {
    kind: "image",
    src: "/images/par-vertente.jpg",
    alt: "Aro Vertente em ouro escovado, em macro",
    focus: "50% 50%",
  },
  riviera: {
    kind: "image",
    src: "/images/colar-meridiano.jpg",
    alt: "Colar Meridiano usado, em luz de fim de tarde",
    focus: "50% 72%",
  },
  sun: {
    kind: "image",
    src: "/images/colar-solsticio.jpg",
    alt: "Colar Solstício usado sobre um vestido preto",
    focus: "50% 70%",
  },
  stud: {
    kind: "image",
    src: "/images/brinco-solsticio.jpg",
    alt: "Brinco Solstício, ponto de luz em diamante, usado",
    focus: "50% 40%",
  },
  point: {
    kind: "image",
    src: "/images/brinco-ponto.jpg",
    alt: "Brinco Ponto em ouro maciço, usado",
    focus: "50% 45%",
  },
  band: {
    kind: "image",
    src: "/images/alianca-perene.jpg",
    alt: "Aliança Perene em ouro, sobre fundo claro",
    focus: "50% 50%",
  },
  bangle: {
    kind: "image",
    src: "/images/pulseira-noturno.jpg",
    alt: "Bracelete em ouro usado no pulso, junto ao rosto",
    focus: "50% 88%",
  },
  links: {
    kind: "image",
    src: "/images/pulseira-cadencia.jpg",
    alt: "Pulseira Cadência usada no pulso",
    focus: "50% 45%",
  },
} satisfies Record<string, Media>;

/* --------------------------------------------------------------------------
   Home — produto, editorial, produto, editorial, produto, serviço.
   -------------------------------------------------------------------------- */

export const home = {
  hero: {
    /* O retrato de campanha em enquadramento largo: rosto, brinco e anel
       livres; o texto assenta sobre o fundo e o blazer. */
    media: { ...img.portrait, focus: "50% 20%" },
    /** Cor do cabeçalho transparente sobre a fotografia do hero —
        em ecrãs deitados e em ecrãs de pé (onde o topo da fotografia
        muda: no retrato, o cabeçalho cai sobre o cabelo). */
    headerTone: "dark" as "light" | "dark",
    headerTonePortrait: "light" as "light" | "dark",
    /** Cor do texto do hero, no canto inferior esquerdo. */
    tone: "light" as "light" | "dark",
    eyebrow: "HERTMANN",
    title: "Vertente",
    line: "Uma coleção desenhada pelo movimento.",
    link: { label: "Descobrir coleção", href: "/colecoes/vertente" },
  },

  selection: {
    title: "Seleção Hertmann",
    pieces: [
      "aliança-perene",
      "colar-meridiano",
      "brinco-solsticio",
      "pulseira-cadencia",
      "brinco-ponto",
      "par-vertente",
      "pulseira-arquetipo",
    ],
  },

  pairOne: [
    {
      media: { ...img.campaign, focus: "50% 30%" },
      title: "Vertente",
      link: { label: "Descobrir coleção", href: "/colecoes/vertente" },
      place: "bottom",
      tone: "light",
    },
    {
      media: img.solsticioFilm,
      title: "Use do seu jeito",
      link: { label: "Descobrir Solstício", href: "/colecoes/solsticio" },
      place: "top",
      tone: "light",
    },
  ] satisfies [Chapter, Chapter],

  pairTwo: [
    {
      media: img.noturno,
      title: "Noturno",
      link: { label: "Ouro branco e safira", href: "/colecoes/noturno" },
      place: "top",
      tone: "light",
    },
    {
      media: img.ring,
      title: "Sob encomenda",
      link: { label: "Desenhe a sua peça com o ateliê", href: "/contato" },
      place: "top",
      tone: "dark",
    },
  ] satisfies [Chapter, Chapter],

  desired: {
    title: "Mais desejadas",
    pieces: [
      "anel-noturno",
      "colar-solsticio",
      "pulseira-noturno",
      "par-vertente",
      "pulseira-arquetipo",
      "aliança-perene",
      "colar-noturno",
      "brinco-circunferencia",
    ],
  },

  pairThree: [
    {
      media: img.hoop,
      title: "Brincos",
      link: { label: "O detalhe que se vê primeiro", href: "/joias/brincos" },
      place: "top",
      tone: "light",
    },
    {
      media: img.boutique,
      title: "Atendimento Hertmann",
      link: { label: "Na boutique ou por vídeo, sempre privado", href: "/contato" },
      place: "bottom",
      tone: "light",
    },
  ] satisfies [Chapter, Chapter],
};

/* --------------------------------------------------------------------------
   Aberturas de categoria e de coleção — o par de imagens sob o título.
   -------------------------------------------------------------------------- */

export const categoryMedia: Record<CategorySlug, [Media, Media]> = {
  aneis: [img.handRing, img.macroRing],
  colares: [img.riviera, img.sun],
  brincos: [img.hoop, img.stud],
  pulseiras: [img.bangle, img.links],
};

export const collectionMedia: Record<string, [Media, Media]> = {
  arquetipo: [img.point, img.band],
  vertente: [img.campaign, img.portrait],
  noturno: [img.noturno, img.ring],
  solsticio: [img.sun, img.stud],
};

/** Capítulo editorial inserido na grelha de "Todas as joias". */
export const catalogueInsert: Chapter = {
  media: img.portrait,
  label: "Coleção 2025",
  title: "Vertente",
  line: "Superfícies escovadas, elos articulados, correntes que caem.",
  link: { label: "Descobrir coleção", href: "/colecoes/vertente" },
};

/** Mensagens da barra superior. */
export const announcements = [
  "Frete especial para todo o Brasil",
  "Atendimento personalizado, na boutique ou por vídeo",
  "Joias produzidas à mão em Curitiba desde 1948",
];
