import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InfoIcon, TruckIcon } from "lucide-react";
import { requireMember } from "@/lib/admin/auth/member";
import { loadOrder } from "@/lib/admin/queries";
import type { Address } from "@/lib/admin/commerce/types";
import { PageBody, PageHeader } from "@/components/admin/PageHeader";
import { LoadError } from "@/components/admin/LoadError";
import { FulfillmentBadge, PaymentBadge } from "@/components/admin/StatusBadges";
import { dateTime, money } from "@/components/admin/format";
import { Alert, AlertDescription } from "@/components/admin/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Separator } from "@/components/admin/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/admin/ui/table";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const order = await loadOrder((await params).id);
  return { title: order.ok && order.data?.number ? `Pedido #${order.data.number}` : "Pedido" };
}

function AddressBlock({ address }: { address: Address | null }) {
  if (!address) return <p className="text-sm text-muted-foreground">Sem endereço de entrega.</p>;
  const lines = [
    address.name,
    address.line1,
    address.line2,
    [address.postalCode, address.city, address.state].filter(Boolean).join(" · "),
    address.country,
    address.phone,
  ].filter(Boolean);
  return (
    <address className="grid gap-0.5 text-sm not-italic">
      {lines.map((line) => (
        <span key={line}>{line}</span>
      ))}
    </address>
  );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className={strong ? "font-medium" : "text-muted-foreground"}>{label}</span>
      <span className={`tabular ${strong ? "font-semibold" : ""}`}>{value}</span>
    </div>
  );
}

export default async function OrderPage({ params }: Props) {
  await requireMember();
  const { id } = await params;
  const loaded = await loadOrder(id);
  if (!loaded.ok) {
    return (
      <>
        <PageHeader title="Pedido" crumbs={[{ href: "/admin/pedidos", label: "Pedidos" }]} />
        <PageBody>
          <LoadError title="Não foi possível ler o pedido" error={loaded.error} />
        </PageBody>
      </>
    );
  }
  const order = loaded.data;
  if (!order) notFound();
  const m = (v: number | null) => money(v, order.currency, order.decimalDigits);

  return (
    <>
      <PageHeader
        crumbs={[{ href: "/admin/pedidos", label: "Pedidos" }]}
        title={order.number ? `Pedido #${order.number}` : "Pedido"}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <PaymentBadge status={order.payment} />
            <FulfillmentBadge status={order.fulfillment} state={order.state} />
            <span className="text-xs">{dateTime(order.createdAt)}</span>
          </span>
        }
      />
      <PageBody className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid gap-6">
          <Card className="gap-0 overflow-hidden pb-0">
            <CardHeader className="pb-4">
              <CardTitle>Itens</CardTitle>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-5">Produto</TableHead>
                  <TableHead className="text-right">Qtd.</TableHead>
                  <TableHead className="text-right">Unitário</TableHead>
                  <TableHead className="pr-5 text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item, i) => (
                  <TableRow key={`${item.variantId ?? item.title}-${i}`} className="hover:bg-transparent">
                    <TableCell className="pl-5">
                      {item.productId ? (
                        <Link href={`/admin/produtos/${item.productId}`} className="font-medium hover:underline">
                          {item.title}
                        </Link>
                      ) : (
                        <span className="font-medium">{item.title}</span>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {[item.variantTitle, item.sku && `SKU ${item.sku}`].filter(Boolean).join(" · ")}
                      </p>
                    </TableCell>
                    <TableCell className="tabular text-right">{item.quantity}</TableCell>
                    <TableCell className="tabular text-right">{m(item.unitPrice)}</TableCell>
                    <TableCell className="tabular pr-5 text-right">{m(item.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="grid gap-1.5 border-t bg-muted/30 px-5 py-4">
              {order.subtotal !== null && <Row label="Subtotal" value={m(order.subtotal)} />}
              {order.shipping !== null && <Row label="Frete" value={m(order.shipping)} />}
              {order.discount !== null && order.discount > 0 && <Row label="Desconto" value={`− ${m(order.discount)}`} />}
              <Separator className="my-1" />
              <Row label="Total" value={m(order.total)} strong />
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TruckIcon className="size-4 text-muted-foreground" />
                Envio
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <p>
                <span className="text-muted-foreground">Método: </span>
                {order.shippingMethod ?? "—"}
              </p>
              {order.fulfillments.length === 0 ? (
                <p className="text-muted-foreground">Ainda sem envio registrado.</p>
              ) : (
                <ul className="grid gap-2">
                  {order.fulfillments.map((f, i) => (
                    <li key={i} className="rounded-md border p-3">
                      <p className="font-medium">{[f.carrier, f.trackingNumber].filter(Boolean).join(" · ") || "Envio registrado"}</p>
                      <p className="text-xs text-muted-foreground">{dateTime(f.createdAt)}</p>
                      {f.trackingUrl && (
                        <a href={f.trackingUrl} target="_blank" rel="noreferrer" className="text-xs text-brand hover:underline">
                          Rastrear envio
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <Alert variant="info" className="mt-1">
                <InfoIcon />
                <AlertDescription>
                  <p>Registrar o envio e o código de rastreio pelo painel chega na próxima etapa. Por enquanto, faça-o no painel da loja.</p>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Cliente</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-1 text-sm">
              <p className="font-medium">{order.customer.name ?? "—"}</p>
              {order.customer.email && (
                <a href={`mailto:${order.customer.email}`} className="text-brand hover:underline">
                  {order.customer.email}
                </a>
              )}
              {order.customer.phone && <p>{order.customer.phone}</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Entrega</CardTitle>
            </CardHeader>
            <CardContent>
              <AddressBlock address={order.shippingAddress} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-1 text-sm">
              <p>{order.paymentMethod ?? "—"}</p>
              <PaymentBadge status={order.payment} />
            </CardContent>
          </Card>
          {order.note && (
            <Card>
              <CardHeader>
                <CardTitle>Nota do cliente</CardTitle>
              </CardHeader>
              <CardContent className="text-sm whitespace-pre-line">{order.note}</CardContent>
            </Card>
          )}
        </div>
      </PageBody>
    </>
  );
}
