import type { Metadata } from "next";
import { requireMember } from "@/lib/admin/auth/member";
import { PageBody, PageHeader } from "@/components/admin/PageHeader";
import { NewPasswordForm } from "@/components/admin/auth/NewPasswordForm";
import { Card, CardContent } from "@/components/admin/ui/card";

export const metadata: Metadata = { title: "Nova senha" };

export default async function NewPasswordPage() {
  await requireMember();
  return (
    <>
      <PageHeader title="Nova senha" description="Escolha uma senha nova para sua conta." />
      <PageBody>
        <div className="max-w-xl">
        <Card>
          <CardContent>
            <NewPasswordForm />
          </CardContent>
        </Card>
        </div>
      </PageBody>
    </>
  );
}
