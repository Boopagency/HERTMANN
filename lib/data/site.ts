export const site = {
  name: "HERTMANN",
  tagline: "Joalheria",
  /** Assinatura curta usada em rótulos institucionais. */
  signature: "Alta joalheria — desde 1948",
  founded: 1948,
  city: "Curitiba",
  // A origem pública do site não vive aqui: ver lib/site-url.ts.
  description:
    "HERTMANN é uma casa de alta joalheria. Peças desenhadas para atravessar gerações, executadas à mão em ateliê próprio, em ouro e pedras selecionadas.",
  contact: {
    email: "atendimento@hertmann.com.br",
    phone: "+55 41 3000 0000",
    whatsapp: "+55 41 99000 0000",
    whatsappUrl: "https://wa.me/5541990000000",
    address: "Rua Comendador Araújo, 1400 — Batel, Curitiba PR",
    hours: "Segunda a sexta, 10h — 19h · Sábado, 10h — 15h",
  },
  social: [{ label: "Instagram", href: "https://instagram.com/hertmann" }],
} as const;

export const nav = {
  primary: [
    { label: "Coleções", href: "/colecoes" },
    { label: "Joias", href: "/joias" },
    { label: "Sobre", href: "/sobre" },
    { label: "Ateliê", href: "/atelie" },
  ],
  service: [
    { label: "Contato", href: "/contato" },
    { label: "WhatsApp", href: "https://wa.me/5541990000000", external: true },
    { label: "atendimento@hertmann.com.br", href: "mailto:atendimento@hertmann.com.br" },
  ],
  legal: [
    { label: "Termos", href: "/termos" },
    { label: "Privacidade", href: "/privacidade" },
  ],
} as const;
