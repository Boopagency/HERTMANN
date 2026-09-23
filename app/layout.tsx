import type { Metadata, Viewport } from "next";
import { Cormorant_SC, Cormorant_Garamond, Inter } from "next/font/google";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { StoreProvider } from "@/components/commerce/StoreProvider";
import { site } from "@/lib/data/site";
import "./globals.css";

/* --- Tipografia da marca -------------------------------------------------- */

const display = Cormorant_SC({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-cormorant-sc",
  display: "swap",
});

const text = Cormorant_Garamond({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500"],
  variable: "--font-inter",
  display: "swap",
});

/* --- Metadados ------------------------------------------------------------ */

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — Alta joalheria`,
    template: `%s — ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.name }],
  keywords: [
    "joalheria",
    "alta joalheria",
    "anéis",
    "colares",
    "brincos",
    "pulseiras",
    "ouro 18k",
    "HERTMANN",
  ],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: site.url,
    siteName: site.name,
    title: `${site.name} — Alta joalheria`,
    description: site.description,
    images: [{ url: "/images/campaign-hero.jpg", width: 1176, height: 1392, alt: site.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — Alta joalheria`,
    description: site.description,
    images: ["/images/campaign-hero.jpg"],
  },
  icons: {
    icon: [{ url: "/brand/favicon.svg", type: "image/svg+xml" }],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#051D41",
  colorScheme: "light",
};

const organisation = {
  "@context": "https://schema.org",
  "@type": "JewelryStore",
  name: site.name,
  description: site.description,
  url: site.url,
  telephone: site.contact.phone,
  email: site.contact.email,
  foundingDate: String(site.founded),
  address: {
    "@type": "PostalAddress",
    streetAddress: "Rua Comendador Araújo, 1400",
    addressLocality: site.city,
    addressRegion: "PR",
    addressCountry: "BR",
  },
  sameAs: site.social.map((s) => s.href),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${text.variable} ${sans.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organisation) }}
        />
        <a href="#conteudo" className="skip-link">
          Saltar para o conteúdo
        </a>
        <StoreProvider>
          <SmoothScroll />
          <AnnouncementBar />
          <Header />
          <main id="conteudo">{children}</main>
          <Footer />
        </StoreProvider>
      </body>
    </html>
  );
}
