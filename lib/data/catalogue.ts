/* ============================================================================
   Catálogo HERTMANN
   ----------------------------------------------------------------------------
   Cada peça declara a sua fotografia. Quando `image` é `null`, a peça é
   apresentada pela prancha Linha Heritage — o desenho técnico da joia, no
   estilo de ilustração definido pelo Manual de Marca. É o estado de espera
   deliberado do catálogo: a fotografia definitiva entra depois, sem
   qualquer alteração de código.
   ========================================================================== */

import type { DrawingVariant } from "@/components/brand/Marks";

export type CategorySlug = "aneis" | "colares" | "brincos" | "pulseiras";

export type PieceImage = {
  src: string;
  /**
   * `true` — recorte ou packshot: a joia é centrada, com respiro, sobre a
   * névoa de estúdio. `false` — fotografia de enquadramento completo, que
   * preenche o tile em sangria.
   */
  cutout: boolean;
  alt: string;
  /** Ponto focal (`object-position`) usado nos enquadramentos quadrados. */
  focus?: string;
};

export type Piece = {
  slug: string;
  name: string;
  category: CategorySlug;
  collection: string;
  price: number;
  /** Uma linha. Nunca um parágrafo de marketplace. */
  line: string;
  description: string;
  material: string;
  stone?: string;
  measures: string;
  reference: string;
  /** Construção da peça — decide o desenho de ateliê que a representa. */
  drawing: DrawingVariant;
  image: PieceImage | null;
  /** Segunda fotografia, revelada no hover. */
  imageAlt?: PieceImage | null;
  /**
   * Packshot de catálogo — a joia isolada, centrada, sobre fundo off-white
   * (ou PNG recortado). Quando existe, é a imagem das vitrines e da grelha
   * e a fotografia `image` passa a ser revelada no hover. Ver
   * docs/REDESIGN.md para a especificação de produção.
   */
  packshot?: PieceImage | null;
  /** Executada sob encomenda — fica fora do filtro "pronta-entrega". */
  madeToOrder?: boolean;
  options?: { label: string; values: string[] };
  featured?: boolean;
};

export type Category = {
  slug: CategorySlug;
  name: string;
  singular: string;
  index: string;
  line: string;
  description: string;
};

export type Collection = {
  slug: string;
  name: string;
  year: string;
  line: string;
  description: string;
  note: string;
  pieces: string[];
};

/* --------------------------------------------------------------------------
   Categorias
   -------------------------------------------------------------------------- */

export const categories: Category[] = [
  {
    slug: "aneis",
    name: "Anéis",
    singular: "Anel",
    index: "01",
    line: "A forma fechada. O gesto que não termina.",
    description:
      "Do aro liso à peça de assinatura. Cada anel é dimensionado à mão e ajustado ao dedo de quem o vai usar.",
  },
  {
    slug: "colares",
    name: "Colares",
    singular: "Colar",
    index: "02",
    line: "A linha que acompanha o corpo.",
    description:
      "Correntes tecidas em ouro maciço e pendentes que assentam exactamente onde a luz os encontra.",
  },
  {
    slug: "brincos",
    name: "Brincos",
    singular: "Brinco",
    index: "03",
    line: "O detalhe que se vê antes do rosto.",
    description:
      "Argolas, pontos e pendentes. Peças pensadas pelo peso, para que se esqueçam ao fim de uma hora.",
  },
  {
    slug: "pulseiras",
    name: "Pulseiras",
    singular: "Pulseira",
    index: "04",
    line: "O movimento tornado matéria.",
    description:
      "Elos articulados e aros rígidos, com fechos que se abrem com uma só mão.",
  },
];

/* --------------------------------------------------------------------------
   Peças
   -------------------------------------------------------------------------- */

export const pieces: Piece[] = [
  {
    slug: "aliança-perene",
    name: "Perene",
    category: "aneis",
    collection: "arquetipo",
    price: 9800,
    line: "Aliança de perfil abaulado",
    description:
      "A peça mais simples do ateliê e a mais difícil de executar. Um único aro de ouro, martelado e polido em sete passagens, até que a luz corra sem interrupção sobre toda a circunferência.",
    material: "Ouro amarelo 18k",
    measures: "Largura 4,2 mm · Espessura 1,8 mm",
    reference: "HM–AR–014",
    drawing: "band",
    image: {
      src: "/images/alianca-perene.jpg",
      cutout: false,
      focus: "50% 50%",
      alt: "Aliança Perene, em close-up",
    },
    options: { label: "Aro", values: ["12", "14", "16", "18", "20", "22"] },
    featured: true,
  },
  {
    slug: "par-vertente",
    name: "Vertente",
    category: "aneis",
    collection: "vertente",
    price: 16400,
    line: "Par de aros em ouro escovado",
    description:
      "Dois aros de larguras distintas, concebidos para serem usados juntos. A superfície escovada retém a luz em vez de a devolver — um brilho baixo, que se percebe de perto.",
    material: "Ouro amarelo 18k, acabamento escovado",
    measures: "Larguras 2,4 mm e 3,6 mm",
    reference: "HM–AR–027",
    drawing: "band",
    image: {
      src: "/images/par-vertente.jpg",
      cutout: false,
      focus: "50% 50%",
      alt: "Par de aros Vertente, em close-up",
    },
    options: { label: "Aro", values: ["12", "14", "16", "18", "20"] },
    featured: true,
  },
  {
    slug: "colar-meridiano",
    name: "Meridiano",
    category: "colares",
    collection: "vertente",
    price: 7200,
    line: "Corrente veneziana com pendente circular",
    description:
      "Uma corrente fina que assenta na base do pescoço e um disco de ouro que gira livremente. O pendente é gravado no verso com o punção da casa.",
    material: "Ouro amarelo 18k",
    measures: "Corrente 42 cm · Pendente Ø 9 mm",
    reference: "HM–CL–008",
    drawing: "pendant",
    image: {
      src: "/images/colar-meridiano.jpg",
      cutout: false,
      focus: "50% 100%",
      alt: "Colar Meridiano usado, em close-up sobre o colo",
    },
    options: { label: "Comprimento", values: ["40 cm", "42 cm", "45 cm"] },
    featured: true,
  },
  {
    slug: "colar-noturno",
    name: "Noturno",
    category: "colares",
    collection: "noturno",
    price: 24500,
    line: "Pendente em ouro branco e safira",
    description:
      "Uma safira de talhe oval, cravada em quatro garras finas que quase desaparecem. A pedra é escolhida uma a uma pelo gemólogo da casa — nenhuma peça Noturno é exactamente igual à seguinte.",
    material: "Ouro branco 18k",
    stone: "Safira azul natural, 1,8 ct",
    measures: "Corrente 45 cm · Pedra 8 × 6 mm",
    reference: "HM–CL–031",
    drawing: "pendantGem",
    madeToOrder: true,
    image: {
      src: "/images/colar-noturn.jpg",
      cutout: false,
      focus: "50% 80%",
      alt: "Colar Noturno usado, em close-up sobre o colo",
    },
    featured: false,
  },
  {
    slug: "brinco-circunferencia",
    name: "Circunferência",
    category: "brincos",
    collection: "arquetipo",
    price: 6400,
    line: "Argola de secção redonda",
    description:
      "A argola reduzida ao essencial: um tubo de ouro de secção perfeitamente circular, com fecho interno invisível. Leve o suficiente para se esquecer.",
    material: "Ouro amarelo 18k",
    measures: "Ø 22 mm · Secção 2,5 mm",
    reference: "HM–BR–005",
    drawing: "hoop",
    image: {
      src: "/images/brinco-circunferencia.jpg",
      cutout: false,
      focus: "50% 22%",
      alt: "Brinco Circunferência usado, em close-up",
    },
    options: { label: "Diâmetro", values: ["16 mm", "22 mm", "30 mm"] },
    featured: true,
  },
  {
    slug: "brinco-solsticio",
    name: "Solstício",
    category: "brincos",
    collection: "solsticio",
    price: 11900,
    line: "Pendente articulado com diamantes",
    description:
      "Um ponto de luz suspenso de um fio de ouro. A articulação permite que a peça acompanhe o movimento da cabeça, e não o contrário.",
    material: "Ouro amarelo 18k",
    stone: "Diamantes brancos, 0,24 ct (total)",
    measures: "Comprimento 34 mm",
    reference: "HM–BR–019",
    drawing: "drop",
    image: {
      src: "/images/brinco-solsticio.jpg",
      cutout: false,
      focus: "50% 39%",
      alt: "Brinco Solstício usado, em close-up",
    },
    featured: true,
  },
  {
    slug: "pulseira-cadencia",
    name: "Cadência",
    category: "pulseiras",
    collection: "vertente",
    price: 13800,
    line: "Elos articulados em ouro polido",
    description:
      "Trinta e quatro elos, cada um soldado e polido individualmente. A pulseira cai sobre o pulso com o peso exacto de uma peça que se usa todos os dias.",
    material: "Ouro amarelo 18k",
    measures: "Comprimento 18 cm · Largura 6 mm",
    reference: "HM–PL–011",
    drawing: "links",
    image: {
      src: "/images/pulseira-cadencia.jpg",
      cutout: false,
      focus: "50% 45%",
      alt: "Pulseira Cadência usada no pulso, em close-up",
    },
    options: { label: "Comprimento", values: ["17 cm", "18 cm", "19 cm"] },
    featured: true,
  },
  {
    slug: "pulseira-arquetipo",
    name: "Arquétipo",
    category: "pulseiras",
    collection: "arquetipo",
    price: 18600,
    line: "Bracelete rígido de perfil oval",
    description:
      "Um aro rígido, com abertura lateral e dobradiça escondida na espessura do metal. Não tem fecho visível — abre-se com uma só mão.",
    material: "Ouro amarelo 18k",
    measures: "Ø interno 58 mm · Perfil 5 mm",
    reference: "HM–PL–022",
    drawing: "bangle",
    image: {
      src: "/images/pulseira-arquetipo.jpg",
      cutout: false,
      focus: "50% 50%",
      alt: "Pulseira Arquétipo usada no pulso, em close-up",
    },
    featured: false,
  },
  {
    slug: "anel-noturno",
    name: "Noturno",
    category: "aneis",
    collection: "noturno",
    price: 32000,
    line: "Solitário em ouro branco",
    description:
      "Uma pedra central erguida acima do aro, sustentada por uma galeria aberta que deixa a luz entrar por baixo. É a construção clássica, executada com tolerâncias de centésimo de milímetro.",
    material: "Ouro branco 18k",
    stone: "Diamante branco talhe brilhante, 1,02 ct",
    measures: "Aro 2,2 mm · Altura da coroa 7 mm",
    reference: "HM–AR–040",
    drawing: "solitaire",
    madeToOrder: true,
    image: {
      src: "/images/anel-noturno.jpg",
      cutout: false,
      focus: "50% 30%",
      alt: "Anel Noturno usado na mão, em close-up",
    },
    options: { label: "Aro", values: ["12", "14", "16", "18"] },
    featured: false,
  },
  {
    slug: "colar-solsticio",
    name: "Solstício",
    category: "colares",
    collection: "solsticio",
    price: 9600,
    line: "Gargantilha de malha fina",
    description:
      "Uma malha tecida tão fina que se comporta como tecido. Assenta rente ao pescoço e reflecte a luz em movimento contínuo.",
    material: "Ouro amarelo 18k",
    measures: "Comprimento 38 cm · Largura 4 mm",
    reference: "HM–CL–017",
    drawing: "choker",
    image: {
      src: "/images/colar-solsticio.jpg",
      cutout: false,
      focus: "50% 96%",
      alt: "Colar Solstício usado, em close-up",
    },
  },
  {
    slug: "brinco-ponto",
    name: "Ponto",
    category: "brincos",
    collection: "arquetipo",
    price: 4200,
    line: "Brinco de pressão em ouro maciço",
    description:
      "Uma esfera de ouro maciço, sem solda aparente. A primeira peça que muitos clientes compram na HERTMANN e, quase sempre, a que nunca deixam de usar.",
    material: "Ouro amarelo 18k",
    measures: "Ø 4 mm",
    reference: "HM–BR–001",
    drawing: "stud",
    image: {
      src: "/images/brinco-ponto.jpg",
      cutout: false,
      focus: "50% 45%",
      alt: "Brinco Ponto usado, em close-up",
    },
  },
  {
    slug: "pulseira-noturno",
    name: "Noturno",
    category: "pulseiras",
    collection: "noturno",
    price: 27400,
    line: "Riviera de safiras em ouro branco",
    description:
      "Uma sequência contínua de safiras calibradas, cravadas em trilho. Do lado de dentro, o metal é polido em espelho, para que a peça deslize sobre a pele.",
    material: "Ouro branco 18k",
    stone: "Safiras azuis naturais, 4,6 ct (total)",
    measures: "Comprimento 17,5 cm",
    reference: "HM–PL–035",
    drawing: "links",
    madeToOrder: true,
    image: {
      src: "/images/pulseira-noturno.jpg",
      cutout: false,
      focus: "50% 100%",
      alt: "Pulseira Noturno usada no pulso, em close-up",
    },
  },
];

/* --------------------------------------------------------------------------
   Coleções
   -------------------------------------------------------------------------- */

export const collections: Collection[] = [
  {
    slug: "arquetipo",
    name: "Arquétipo",
    year: "2024",
    line: "As formas que vieram antes de nós",
    description:
      "O círculo, a esfera, o aro. Arquétipo reúne as peças que a HERTMANN executa desde a primeira década da casa e que nunca saíram de produção — porque não há como as melhorar.",
    note: "Peças permanentes. Produção contínua no ateliê de Curitiba.",
    pieces: ["aliança-perene", "brinco-circunferencia", "pulseira-arquetipo", "brinco-ponto"],
  },
  {
    slug: "vertente",
    name: "Vertente",
    year: "2025",
    line: "A linha que a água deixa na pedra",
    description:
      "Superfícies escovadas, elos articulados, correntes que caem. Vertente é a coleção do movimento: peças desenhadas a partir do modo como o metal se comporta quando deixa de ser rígido.",
    note: "Coleção de 2025. Doze peças, produção limitada.",
    pieces: ["par-vertente", "colar-meridiano", "pulseira-cadencia"],
  },
  {
    slug: "noturno",
    name: "Noturno",
    year: "2025",
    line: "Ouro branco, pedra azul, luz baixa",
    description:
      "A coleção de alta joalheria da casa. Ouro branco e safiras naturais seleccionadas individualmente. Cada peça Noturno é acompanhada do seu certificado gemológico e do registo do artesão que a executou.",
    note: "Alta joalheria. Peças únicas, sob encomenda.",
    pieces: ["colar-noturno", "anel-noturno", "pulseira-noturno"],
  },
  {
    slug: "solsticio",
    name: "Solstício",
    year: "2024",
    line: "O ponto mais alto da luz",
    description:
      "Peças de uso diário, concebidas para acumular. Solstício parte de um princípio simples: uma joia não deve pedir uma ocasião.",
    note: "Coleção contínua. Peças pensadas para se somarem.",
    pieces: ["brinco-solsticio", "colar-solsticio"],
  },
];

/* --------------------------------------------------------------------------
   Acessores
   -------------------------------------------------------------------------- */

export function pieceBySlug(slug: string): Piece | undefined {
  return pieces.find((p) => p.slug === slug);
}

export function piecesByCategory(slug: CategorySlug): Piece[] {
  return pieces.filter((p) => p.category === slug);
}

export function categoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function collectionBySlug(slug: string): Collection | undefined {
  return collections.find((c) => c.slug === slug);
}

export function collectionPieces(collection: Collection): Piece[] {
  return collection.pieces
    .map((slug) => pieceBySlug(slug))
    .filter((p): p is Piece => Boolean(p));
}

export function collectionName(slug: string): string {
  return collectionBySlug(slug)?.name ?? "";
}

export function categoryName(slug: CategorySlug): string {
  return categoryBySlug(slug)?.singular ?? "";
}

export function featuredPieces(): Piece[] {
  return pieces.filter((p) => p.featured);
}

export function relatedPieces(piece: Piece, count = 3): Piece[] {
  const sameCollection = pieces.filter(
    (p) => p.slug !== piece.slug && p.collection === piece.collection,
  );
  const sameCategory = pieces.filter(
    (p) =>
      p.slug !== piece.slug &&
      p.category === piece.category &&
      !sameCollection.includes(p),
  );
  const rest = pieces.filter(
    (p) => p.slug !== piece.slug && !sameCollection.includes(p) && !sameCategory.includes(p),
  );
  return [...sameCollection, ...sameCategory, ...rest].slice(0, count);
}

/* --------------------------------------------------------------------------
   Atributos derivados — alimentam amostras de metal, filtros e ordenação
   sem duplicar informação que o catálogo já declara.
   -------------------------------------------------------------------------- */

export type Metal = "amarelo" | "branco";

export const metalName: Record<Metal, string> = {
  amarelo: "Ouro amarelo 18k",
  branco: "Ouro branco 18k",
};

export function pieceMetal(piece: Piece): Metal {
  return /branco/i.test(piece.material) ? "branco" : "amarelo";
}

export type Stone = "diamante" | "safira" | "sem-pedra";

export function pieceStone(piece: Piece): Stone {
  if (!piece.stone) return "sem-pedra";
  return /safira/i.test(piece.stone) ? "safira" : "diamante";
}

const latestYear = Math.max(...collections.map((c) => Number(c.year)));

/** Peças das coleções mais recentes — alimentam "Novidades". */
export function isNewPiece(piece: Piece): boolean {
  return Number(collectionBySlug(piece.collection)?.year) === latestYear;
}
