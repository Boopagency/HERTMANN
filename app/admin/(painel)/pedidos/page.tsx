import type { Metadata } from "next";
import Link from "next/link";
import { SearchIcon } from "lucide-react";
import { requireMember } from "@/lib/admin/auth/member";
import { loadOrders } from "@/lib/admin/queries";
import type { AdminOrder } from "@/lib/admin/commerce/types";
import { PageBody, PageHeader } from "@/components/admin/PageHeader";
import { LoadError } from "@/components/admin/LoadError";
import { FulfillmentBadge, PaymentBadge } from "@/components/admin/StatusBadges";
import { dateTime, money } from "@/components/admin/format";
import { Card } from "@/components/admin/ui/card";
import { Input } from "@/components/admin/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/admin/ui/table";
import { cn } from "@/components/admin/ui/cn";

export const metadata: Metadata = { title: "Pedidos" };

const filters = [
  { value: "todos", label: "Todos", test: () => true },
  { value: "a-enviar", label: "A enviar", test: (o: AdminOrder) => o.payment === "paid" && o.fulfillment !== "fulfilled" && o.state !== "cancelled" },
  { value: "pagamento-pendente", label: "Pagamento pendente", test: (o: AdminOrder) => o.payment === "pending" && o.state !== "cancelled" },
  { value: "enviados", label: "Enviados", test: (o: AdminOrder) => o.fulfillment === "fulfilled" },
  { value: "cancelados", label: "Cancelados", test: (o: AdminOrder) => o.state === "cancelled" },
] as const;

const fold = (v: string) => v.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

type Props = { searchParams: Promise<{ estado?: string; q?: string }> };

export default async function OrdersPage({ searchParams }: Props) {
  await requireMember();
  const params = await searchParams;
  const filter = filters.find((f) => f.value === params.estado) ?? filters[0];
  const query = fold((params.q ?? "").trim());
  const orders = await loadOrders();
  const list = orders.ok
    ? orders.data.filter(
        (o) =>
          filter.test(o) &&
          (!query ||
            fold([o.number, o.customer.name, o.customer.email, ...o.items.map((i) => i.title)].filter(Boolean).join(" ")).includes(query)),
      )
    : [];

  return (
    <>
      <PageHeader
        title="Pedidos"
        description="Pedidos feitos no checkout da loja. Nesta versão, o painel mostra os pedidos; marcar como enviado chega numa próxima etapa."
      />
      <PageBody className="grid gap-4">
        {!orders.ok && <LoadError title="Não foi possível ler os pedidos da loja" error={orders.error} />}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav aria-label="Filtrar pedidos" className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
            {filters.map((f) => {
              const active = f.value === filter.value;
              const count = orders.ok ? orders.data.filter(f.test).length : 0;
              return (
                <Link
                  key={f.value}
                  href={`/admin/pedidos?estado=${f.value}${params.q ? `&q=${encodeURIComponent(params.q)}` : ""}`}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                    active && "bg-background text-foreground shadow-xs",
                  )}
                >
                  {f.label}
                  <span className="tabular text-xs text-muted-foreground">{count}</span>
                </Link>
              );
            })}
          </nav>
          <form className="relative w-full sm:w-72" role="search">
            <input type="hidden" name="estado" value={filter.value} />
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input name="q" defaultValue={params.q ?? ""} placeholder="Nº, cliente, e-mail ou produto" className="pl-8" aria-label="Buscar pedidos" />
          </form>
        </div>

        <Card className="gap-0 overflow-hidden py-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Pedido</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Envio</TableHead>
                <TableHead className="pr-4 text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((o) => (
                <TableRow key={o.id} className="relative">
                  <TableCell className="pl-4">
                    <Link href={`/admin/pedidos/${o.id}`} className="font-medium outline-none after:absolute after:inset-0 hover:underline focus-visible:underline">
                      {o.number ? `#${o.number}` : o.id}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {o.items.reduce((n, i) => n + i.quantity, 0)} {o.items.reduce((n, i) => n + i.quantity, 0) === 1 ? "item" : "itens"}
                    </p>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{dateTime(o.createdAt)}</TableCell>
                  <TableCell>
                    <p className="font-medium">{o.customer.name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{o.customer.email ?? ""}</p>
                  </TableCell>
                  <TableCell>
                    <PaymentBadge status={o.payment} />
                  </TableCell>
                  <TableCell>
                    <FulfillmentBadge status={o.fulfillment} state={o.state} />
                  </TableCell>
                  <TableCell className="tabular pr-4 text-right font-medium">{money(o.total, o.currency, o.decimalDigits)}</TableCell>
                </TableRow>
              ))}
              {list.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                    {orders.ok ? "Nenhum pedido neste filtro." : "Sem dados da loja."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </PageBody>
    </>
  );
}
