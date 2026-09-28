import { requireMember } from "@/lib/admin/auth/member";
import { adminAuthMode } from "@/lib/admin/config";
import { AdminShell } from "@/components/admin/Shell";
import { SimulationBanner } from "@/components/admin/SimulationBanner";

/**
 * Tudo o que está aqui dentro exige sessão e papel, verificados no servidor
 * a cada pedido. (O middleware só redireciona quem não tem sessão.)
 */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const member = await requireMember();

  return (
    <AdminShell
      member={{ name: member.name, email: member.email, role: member.role }}
      banner={adminAuthMode === "simulado" ? <SimulationBanner /> : undefined}
    >
      {children}
    </AdminShell>
  );
}
