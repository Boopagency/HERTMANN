import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangleIcon, ArrowRightIcon, PackageIcon, PlusIcon } from "lucide-react";
import { requireMember } from "@/lib/admin/auth/member";
import { can } from "@/lib/admin/auth/permissions";
import { loadCatalogue, loadOrders } from "@/lib/admin/queries";
import { LOW_STOCK, sitePresence, totalStock } from "@/lib/admin/readiness";
import { PageBody, PageHeader } from "@/components/admin/PageHeader";
import { LoadError } from "@/components/admin/LoadError";
import { FulfillmentBadge, PaymentBadge } from "@/components/admin/StatusBadges";
import { dateTime, money } from "@/components/admin/format";
import { Button } from "@/components/admin/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/admin/ui/card";

export const metadata: Metadata = { title: "Visão geral" };

function Stat({ label, value, hint, href }: { label: string; value: number | string; hint?: string; href: string }) {
  return (
    <Link href={href} className="group rounded-xl border bg-card p-4 shadow-xs transition-colors outline-none hover:border-brand/30 focus-visible:ring-[3px] focus-visible:ring-ring">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="tabular mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground group-hover:text-brand">{hint}</p>}
    </Link>
  );
}

export default async function OverviewPage() {
  const member = await requireMember();
  const [{ rows, orphans, products }, orders] = await Promise.all([loadCatalogue(), loadOrders()]);

  const active = rows.filter((r) => r.product.status !== "archived");
  const live = active.filter((r) => sitePresence(r.product, r.editorial).state === "live").length;
  const drafts = active.filter((r) => r.product.status === "draft").length;
  const lowStock = active.filter((r) => {
    const stock = totalStock(r.product);
    return stock !== null && stock <= LOW_STOCK;
  });
  const noEditorial = active.filter((r) => !r.editorial);
  const toShip = orders.ok
    ? orders.data.filter((o) => o.payment === "paid" && o.fulfillment !== "fulfilled" && o.state !== "cancelled")
    : [];

  const attention = [
    ...noEditorial.map((r) => ({
      key: `f-${r.product.id}`,
      href: `/admin/produtos/${r.product.id}`,
      title: r.product.title,
      text: r.product.status === "published" ? "Publicado na loja sem ficha do site" : "Falta a ficha do site",
    })),
    ...lowStock.map((r) => ({
      key: `e-${r.product.id}`,
      href: `/admin/produtos/${r.product.id}`,
      title: r.product.title,
      text: `Estoque baixo: ${totalStock(r.product)}`,
    })),
    ...orphans.map((o) => ({ key: `o-${o.id}`, href: "/admin/produtos", title: `/produto/${o.slug}`, text: "Ficha sem produto na loja" })),
  ];

  return (
    <>
      <PageHeader
        title={`Olá${member.name ? `, ${member.name.split(" ")[0]}` : ""}`}
        description="O essencial da loja HERTMANN, num só lugar."
        actions={
          can(member.role, "produtos.editar") && (
            <Button asChild>
              <Link href="/admin/produtos/novo">
                <PlusIcon />
                Novo produto
              </Link>
            </Button>
          )
        }
      />
      <PageBody className="grid gap-6">
        {!products.ok && <LoadError title="Não foi possível ler os produtos da loja" error={products.error} />}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="No site" value={products.ok ? live : "—"} hint="Ver produtos publicados" href="/admin/produtos?estado=publicados" />
          <Stat label="Rascunhos" value={products.ok ? drafts : "—"} hint="Ver rascunhos" href="/admin/produtos?estado=rascunhos" />
          <Stat label="Estoque baixo" value={products.ok ? lowStock.length : "—"} hint={`${LOW_STOCK} unidades ou menos`} href="/admin/produtos?estado=atencao" />
          <Stat label="Pedidos a enviar" value={orders.ok ? toShip.length : "—"} hint="Pagos, ainda não enviados" href="/admin/pedidos?estado=a-enviar" />
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangleIcon className="size-4 text-warning" />
                Precisam de atenção
              </CardTitle>
              <CardDescription>O que impede uma peça de aparecer bem no site ou de ser vendida.</CardDescription>
            </CardHeader>
            <CardContent>
              {attention.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nada pendente. Tudo em ordem.</p>
              ) : (
                <ul className="-mx-2 grid">
                  {attention.slice(0, 8).map((a) => (
                    <li key={a.key}>
                      <Link href={a.href} className="flex items-center justify-between gap-3 rounded-md px-2 py-2 hover:bg-accent">
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{a.title}</span>
                          <span className="block text-xs text-muted-foreground">{a.text}</span>
                        </span>
                        <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Últimos pedidos</CardTitle>
              <CardDescription>
                <Link href="/admin/pedidos" className="text-brand hover:underline">
                  Ver todos os pedidos
                </Link>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!orders.ok ? (
                <p className="text-sm text-muted-foreground">{orders.error}</p>
              ) : orders.data.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ainda não há pedidos.</p>
              ) : (
                <ul className="-mx-2 grid">
                  {orders.data.slice(0, 5).map((o) => (
                    <li key={o.id}>
                      <Link href={`/admin/pedidos/${o.id}`} className="flex items-center justify-between gap-3 rounded-md px-2 py-2 hover:bg-accent">
                        <span className="min-w-0">
                          <span className="block text-sm font-medium">
                            {o.number ? `#${o.number}` : o.id} · {o.customer.name ?? "—"}
                          </span>
                          <span className="block text-xs text-muted-foreground">{dateTime(o.createdAt)}</span>
                        </span>
                        <span className="flex shrink-0 flex-col items-end gap-1">
                          <span className="tabular text-sm font-medium">{money(o.total, o.currency, o.decimalDigits)}</span>
                          <span className="flex gap-1">
                            <PaymentBadge status={o.payment} />
                            <FulfillmentBadge status={o.fulfillment} state={o.state} />
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {products.ok && rows.length === 0 && (
          <Card className="items-center py-12 text-center">
            <PackageIcon className="size-8 text-muted-foreground" />
            <CardTitle>Ainda não há produtos na loja</CardTitle>
            <CardDescription>Comece criando o primeiro produto.</CardDescription>
          </Card>
        )}
      </PageBody>
    </>
  );
}
