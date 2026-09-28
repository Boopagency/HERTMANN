import type { Metadata, Viewport } from "next";
import { Cormorant_SC, Inter } from "next/font/google";
import { Toaster } from "@/components/admin/ui/sonner";
import { TooltipProvider } from "@/components/admin/ui/tooltip";
import "./admin.css";

/* ============================================================================
   Layout raiz do painel administrativo — separado do site (route groups):
   não carrega o CSS editorial, a rolagem suave, o cabeçalho nem a sacola.
   ========================================================================== */

const sans = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter", display: "swap" });
const brand = Cormorant_SC({ subsets: ["latin"], weight: ["500"], variable: "--font-cormorant-sc", display: "swap" });

/** Nada do painel é pré-renderizado nem guardado em cache: sessão e dados a cada pedido. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin HERTMANN" },
  robots: { index: false, follow: false, nocache: true },
  icons: { icon: [{ url: "/brand/favicon.svg", type: "image/svg+xml" }] },
};

export const viewport: Viewport = { themeColor: "#ffffff", colorScheme: "light" };

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${sans.variable} ${brand.variable}`}>
      <body className="min-h-dvh">
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  );
}
