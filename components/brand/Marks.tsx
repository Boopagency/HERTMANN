"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import { EASE } from "@/components/motion/tokens";

/* ============================================================================
   Marcas desenhadas — estilo "Fine Line" do Manual de Marca (p.15):
   desenhos técnicos de traço fino, que remetem a projecto e exclusividade.
   Traço de espessura constante, geometria sóbria, curvas elegantes.
   Todas as marcas se desenham ao entrar em cena.
   ========================================================================== */

const draw: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  shown: (i: number) => ({
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { delay: 0.1 + i * 0.06, duration: 1, ease: EASE },
      opacity: { delay: 0.1 + i * 0.06, duration: 0.34 },
    },
  }),
};

type DrawnProps = {
  className?: string;
  /** Desativa a animação de desenho — para usos decorativos estáticos. */
  still?: boolean;
  strokeWidth?: number;
};

function useGroupProps(still: boolean | undefined) {
  const reduced = useReducedMotion();
  return !still && !reduced
    ? ({
        initial: "hidden",
        whileInView: "shown",
        viewport: { once: true, margin: "0px 0px -100px 0px" },
      } as const)
    : ({ initial: false } as const);
}

function P({
  d,
  i = 0,
  still,
}: {
  d: string;
  i?: number;
  still?: boolean;
}) {
  return <motion.path d={d} custom={i} variants={still ? undefined : draw} />;
}

function Plate({
  className,
  still,
  strokeWidth = 1.15,
  viewBox = "0 0 300 380",
  children,
}: DrawnProps & { viewBox?: string; children: React.ReactNode }) {
  const group = useGroupProps(still);
  return (
    <motion.svg
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...group}
    >
      {children}
    </motion.svg>
  );
}

/* --------------------------------------------------------------------------
   Ícone de apoio — o cristal HERTMANN (Manual de Marca, p.8)
   -------------------------------------------------------------------------- */

export function CrystalMark(props: DrawnProps) {
  const { still } = props;
  return (
    <Plate {...props} viewBox="0 0 200 264">
      <P d="M100 6 190 96 100 258 10 96Z" i={0} still={still} />
      <P d="M10 96H190" i={1} still={still} />
      <P d="M100 6 47 96M100 6 153 96" i={2} still={still} />
      <P d="M10 96c18 14 30 20 37 0" i={3} still={still} />
      <P d="M190 96c-18 14-30 20-37 0" i={3} still={still} />
      <P d="M47 96 100 258M153 96 100 258" i={4} still={still} />
      <P d="M100 96c-30 44-38 108 0 162" i={5} still={still} />
      <P d="M100 96c30 44 38 108 0 162" i={5} still={still} />
      <P
        d="M100 46c3 32 8 42 40 46-32 4-37 14-40 46-3-32-8-42-40-46 32-4 37-14 40-46Z"
        i={6}
        still={still}
      />
    </Plate>
  );
}

/* --------------------------------------------------------------------------
   Pranchas de peça — o desenho antes da joia.
   Uma variante por tipo de construção, não por categoria: duas argolas
   diferentes têm desenhos diferentes, como teriam na prancheta.
   -------------------------------------------------------------------------- */

export type DrawingVariant =
  | "band"
  | "solitaire"
  | "pendant"
  | "pendantGem"
  | "choker"
  | "hoop"
  | "drop"
  | "stud"
  | "links"
  | "bangle";

/** Aro liso — a construção mais simples da casa. */
function Band({ still }: { still?: boolean }) {
  return (
    <>
      <P d="M54 190a96 100 0 1 0 192 0 96 100 0 1 0-192 0" i={0} still={still} />
      <P d="M74 190a76 80 0 1 0 152 0 76 80 0 1 0-152 0" i={1} still={still} />
      {/* eixos de construção */}
      <P d="M150 78v14M150 288v14M40 190h14M246 190h14" i={2} still={still} />
      {/* corte do perfil abaulado */}
      <P d="M118 330h64" i={3} still={still} />
      <P d="M118 330c10-16 54-16 64 0" i={4} still={still} />
    </>
  );
}

/** Solitário — aro, ombros, galeria e pedra de talhe brilhante. */
function Solitaire({ still }: { still?: boolean }) {
  return (
    <>
      <P d="M62 244a88 92 0 1 0 176 0 88 92 0 1 0-176 0" i={0} still={still} />
      <P d="M80 244a70 74 0 1 0 140 0 70 74 0 1 0-140 0" i={1} still={still} />
      {/* ombros */}
      <P d="M72 208c14-30 40-46 78-46s64 16 78 46" i={2} still={still} />
      {/* cintura da pedra */}
      <P d="M108 138h84" i={3} still={still} />
      {/* coroa */}
      <P d="M108 138 150 100 192 138" i={4} still={still} />
      <P d="M124 120h52" i={5} still={still} />
      {/* pavilhão */}
      <P d="M108 138 150 190 192 138" i={5} still={still} />
      {/* garras */}
      <P d="M104 128v22M196 128v22" i={6} still={still} />
    </>
  );
}

function Chain({ still }: { still?: boolean }) {
  return (
    <>
      <P d="M46 66a9 9 0 1 0 18 0 9 9 0 1 0-18 0" i={0} still={still} />
      <P d="M236 66a9 9 0 1 0 18 0 9 9 0 1 0-18 0" i={0} still={still} />
      <P d="M55 75c7 100 42 156 95 156s88-56 95-156" i={1} still={still} />
      <P
        d="M78 148l11-4M100 190l11-5M130 220l8-8M170 220l-8-8M200 190l-11-5M222 148l-11-4"
        i={2}
        still={still}
      />
    </>
  );
}

/** Corrente com pendente em disco. */
function Pendant({ still }: { still?: boolean }) {
  return (
    <>
      <Chain still={still} />
      <P d="M141 238a9 9 0 1 0 18 0 9 9 0 1 0-18 0" i={3} still={still} />
      <P d="M116 290a34 34 0 1 0 68 0 34 34 0 1 0-68 0" i={4} still={still} />
      <P d="M134 290a16 16 0 1 0 32 0 16 16 0 1 0-32 0" i={5} still={still} />
    </>
  );
}

/** Corrente com pedra cravada em garras. */
function PendantGem({ still }: { still?: boolean }) {
  return (
    <>
      <Chain still={still} />
      <P d="M141 238a9 9 0 1 0 18 0 9 9 0 1 0-18 0" i={3} still={still} />
      <P d="M150 254 186 290 150 340 114 290Z" i={4} still={still} />
      <P d="M114 290h72" i={5} still={still} />
      <P d="M150 254 132 290M150 254l18 36" i={5} still={still} />
      <P d="M110 282v16M190 282v16" i={6} still={still} />
    </>
  );
}

/** Gargantilha de malha — dois arcos e a trama entre eles. */
function Choker({ still }: { still?: boolean }) {
  return (
    <>
      <P d="M42 92c0 100 48 158 108 158s108-58 108-158" i={0} still={still} />
      <P d="M64 92c0 86 40 132 86 132s86-46 86-132" i={1} still={still} />
      <P
        d="M52 148l20-8M64 190l19-11M88 222l15-15M124 242l7-19M176 242l-7-19M212 222l-15-15M236 190l-19-11M248 148l-20-8"
        i={2}
        still={still}
      />
      <P d="M36 74h12v20H36Z" i={3} still={still} />
      <P d="M252 74h12v20h-12Z" i={3} still={still} />
    </>
  );
}

/** Argola de secção redonda, com dobradiça interna. */
function Hoop({ still }: { still?: boolean }) {
  return (
    <>
      <P d="M46 200a104 104 0 1 0 208 0 104 104 0 1 0-208 0" i={0} still={still} />
      <P d="M64 200a86 86 0 1 0 172 0 86 86 0 1 0-172 0" i={1} still={still} />
      {/* dobradiça interna */}
      <P d="M132 100h36" i={2} still={still} />
      <P d="M144 96a6 6 0 1 0 12 0 6 6 0 1 0-12 0" i={3} still={still} />
      {/* espessura do tubo */}
      <P d="M46 200h18M236 200h18M150 296v18" i={4} still={still} />
    </>
  );
}

/** Pendente articulado — pino, elo e gota. */
function Drop({ still }: { still?: boolean }) {
  return (
    <>
      <P d="M138 68a12 12 0 1 0 24 0 12 12 0 1 0-24 0" i={0} still={still} />
      <P d="M150 80v18" i={1} still={still} />
      <P d="M141 106a9 9 0 1 0 18 0 9 9 0 1 0-18 0" i={2} still={still} />
      <P d="M150 124c-34 44-46 92-46 128a46 46 0 0 0 92 0c0-36-12-84-46-128Z" i={3} still={still} />
      <P d="M150 186c-14 22-20 46-20 66a20 20 0 0 0 40 0c0-20-6-44-20-66Z" i={4} still={still} />
      {/* pino traseiro */}
      <P d="M150 56v-18" i={5} still={still} />
    </>
  );
}

/** Esfera maciça de pressão. */
function Stud({ still }: { still?: boolean }) {
  return (
    <>
      <P d="M104 170a46 46 0 1 0 92 0 46 46 0 1 0-92 0" i={0} still={still} />
      <P d="M124 152c6-12 20-18 32-16" i={1} still={still} />
      <P d="M150 216v54" i={2} still={still} />
      <P d="M130 270c10-14 30-14 40 0" i={3} still={still} />
      <P d="M150 270v22" i={4} still={still} />
    </>
  );
}

/** Pulseira de elos articulados. */
function Links({ still }: { still?: boolean }) {
  return (
    <>
      <P d="M30 190a120 82 0 1 0 240 0 120 82 0 1 0-240 0" i={0} still={still} />
      <P d="M46 190a104 66 0 1 0 208 0 104 66 0 1 0-208 0" i={1} still={still} />
      <P
        d="M150 108v16M96 116l7 15M204 116l-7 15M44 160l16 5M256 160l-16 5M96 264l7-15M204 264l-7-15M150 272v-16M44 220l16-5M256 220l-16-5"
        i={2}
        still={still}
      />
      <P d="M262 174h20v32h-20Z" i={3} still={still} />
      <P d="M270 182h6v16h-6Z" i={4} still={still} />
    </>
  );
}

/** Bracelete rígido com dobradiça escondida. */
function Bangle({ still }: { still?: boolean }) {
  return (
    <>
      <P d="M28 190a122 84 0 1 0 244 0 122 84 0 1 0-244 0" i={0} still={still} />
      <P d="M44 190a106 68 0 1 0 212 0 106 68 0 1 0-212 0" i={1} still={still} />
      {/* dobradiça e abertura */}
      <P d="M28 182v16M272 182v16" i={2} still={still} />
      <P d="M22 190a6 6 0 1 0 12 0 6 6 0 1 0-12 0" i={3} still={still} />
      {/* perfil */}
      <P d="M118 322h64" i={4} still={still} />
      <P d="M118 322c8-14 56-14 64 0" i={5} still={still} />
    </>
  );
}

const VARIANTS: Record<DrawingVariant, (p: { still?: boolean }) => React.ReactElement> = {
  band: Band,
  solitaire: Solitaire,
  pendant: Pendant,
  pendantGem: PendantGem,
  choker: Choker,
  hoop: Hoop,
  drop: Drop,
  stud: Stud,
  links: Links,
  bangle: Bangle,
};

export function PieceDrawing({
  variant,
  ...props
}: DrawnProps & { variant: DrawingVariant }) {
  const Shape = VARIANTS[variant];
  return (
    <Plate {...props}>
      <Shape still={props.still} />
    </Plate>
  );
}

/** Desenho representativo de cada categoria. */
export const categoryDrawing: Record<string, DrawingVariant> = {
  aneis: "solitaire",
  colares: "pendant",
  brincos: "hoop",
  pulseiras: "links",
};
