/* ============================================================================
   Linha Heritage — sistema de ícones (Manual de Marca, p.15)
   Traço fino de espessura constante · geometria sóbria · vazados (outline)
   · construídos sobre grid de 24 × 24 px.
   ========================================================================== */

type IconProps = {
  className?: string;
  size?: number;
  strokeWidth?: number;
};

function Svg({
  className,
  size = 22,
  strokeWidth = 1,
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {children}
    </svg>
  );
}

export function IconSearch(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.3 15.3 20.5 20.5" />
    </Svg>
  );
}

export function IconAccount(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20.5c0-3.6 3.4-6 7.5-6s7.5 2.4 7.5 6" />
    </Svg>
  );
}

export function IconBag(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4.5 7.5h15l-1 13h-13z" />
      <path d="M8.75 9.5V6.6A3.25 3.25 0 0 1 12 3.35a3.25 3.25 0 0 1 3.25 3.25V9.5" />
    </Svg>
  );
}

export function IconHeart({ filled = false, ...props }: IconProps & { filled?: boolean }) {
  return (
    <Svg {...props}>
      <path
        d="M12 20.2 4.9 13.3a4.35 4.35 0 0 1 0-6.2 4.35 4.35 0 0 1 6.2 0l.9.9.9-.9a4.35 4.35 0 0 1 6.2 0 4.35 4.35 0 0 1 0 6.2z"
        fill={filled ? "currentColor" : "none"}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IconClose(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 5 19 19M19 5 5 19" />
    </Svg>
  );
}

export function IconMenu(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 7h18M3 12h18M3 17h18" />
    </Svg>
  );
}

export function IconChevronLeft(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M15.5 4.5 8 12l7.5 7.5" />
    </Svg>
  );
}

export function IconInstagram(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M17.2 6.8h.01" strokeWidth={1.6} />
    </Svg>
  );
}

export function IconWhatsApp(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        d="M4.2 19.8 5.3 16A8.2 8.2 0 1 1 8.2 18.8Z"
        strokeLinejoin="round"
      />
      <path
        d="M9.2 8.6c.2-.4.5-.4.8-.4h.5c.2 0 .4.1.5.4l.6 1.4c.1.2 0 .5-.1.7l-.5.6c.5 1 1.4 1.9 2.4 2.4l.6-.5c.2-.2.5-.2.7-.1l1.4.6c.3.1.4.3.4.5v.5c0 .3 0 .6-.4.8-.7.4-1.6.5-2.5.1a8.2 8.2 0 0 1-4.3-4.3c-.4-.9-.3-1.8.1-2.5Z"
        strokeWidth={0.9}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IconArrow(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 12h17.5" />
      <path d="M14.5 6.2 20.8 12l-6.3 5.8" />
    </Svg>
  );
}

export function IconArrowDown(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3v17.5" />
      <path d="M6.2 14.5 12 20.8l5.8-6.3" />
    </Svg>
  );
}

export function IconPlus(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

export function IconMinus(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 12h14" />
    </Svg>
  );
}

export function IconChevron(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M8.5 4.5 16 12l-7.5 7.5" />
    </Svg>
  );
}

/** Estrela de quatro pontas — o brilho da marca, usado como marcador. */
export function IconSpark(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        d="M12 2.5c.6 6 2.9 8.4 9 9-6.1.6-8.4 3-9 9-.6-6-2.9-8.4-9-9 6.1-.6 8.4-3 9-9Z"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
