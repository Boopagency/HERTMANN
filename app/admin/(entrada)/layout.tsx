import { notFound } from "next/navigation";
import { adminAvailable, adminAuthMode } from "@/lib/admin/config";
import { AdminBrand } from "@/components/admin/Brand";
import { SimulationBanner } from "@/components/admin/SimulationBanner";

/** Telas de entrada: centradas, sóbrias, com a assinatura da casa. */
export default function EntryLayout({ children }: { children: React.ReactNode }) {
  if (!adminAvailable) notFound();

  return (
    <div className="flex min-h-dvh flex-col bg-muted/40">
      {adminAuthMode === "simulado" && <SimulationBanner />}
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <AdminBrand className="mb-8 justify-center" />
          <div className="rounded-xl border bg-card p-6 shadow-xs sm:p-7">{children}</div>
          <p className="mt-6 text-center text-xs text-muted-foreground">Acesso restrito à equipa HERTMANN.</p>
        </div>
      </main>
    </div>
  );
}
