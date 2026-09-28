import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireMember } from "@/lib/admin/auth/member";
import { can } from "@/lib/admin/auth/permissions";
import { categories, collections } from "@/lib/data/catalogue";
import { PageBody, PageHeader } from "@/components/admin/PageHeader";
import { CreateProductForm } from "@/components/admin/products/CreateProductForm";

export const metadata: Metadata = { title: "Novo produto" };

export default async function NewProductPage() {
  const member = await requireMember();
  if (!can(member.role, "produtos.editar")) redirect("/admin/produtos");

  return (
    <>
      <PageHeader title="Novo produto" crumbs={[{ href: "/admin/produtos", label: "Produtos" }]} />
      <PageBody>
        <CreateProductForm
          categories={categories.map((c) => ({ value: c.slug, label: c.name }))}
          collections={collections.map((c) => ({ value: c.slug, label: c.name }))}
        />
      </PageBody>
    </>
  );
}
