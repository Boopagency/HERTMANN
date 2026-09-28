import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireMember } from "@/lib/admin/auth/member";
import { can } from "@/lib/admin/auth/permissions";
import { loadSiteSettings } from "@/lib/admin/queries";
import { PageBody, PageHeader } from "@/components/admin/PageHeader";
import { LoadError } from "@/components/admin/LoadError";
import { SiteSettingsForm } from "@/components/admin/SiteSettingsForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/admin/ui/card";

export const metadata: Metadata = { title: "Site" };

export default async function SiteSettingsPage() {
  const member = await requireMember();
  if (!can(member.role, "site.configurar")) redirect("/admin");
  const settings = await loadSiteSettings();

  return (
    <>
      <PageHeader title="Site" description="Configuração do que o site público mostra." />
      <PageBody className="max-w-3xl">
        {!settings.ok ? (
          <LoadError title="Não foi possível ler a configuração do site" error={settings.error} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Catálogo</CardTitle>
              <CardDescription>As mudanças aparecem no site em instantes.</CardDescription>
            </CardHeader>
            <CardContent>
              <SiteSettingsForm showPrototypes={settings.data.showPrototypes} />
            </CardContent>
          </Card>
        )}
      </PageBody>
    </>
  );
}
