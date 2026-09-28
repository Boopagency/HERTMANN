import type { FulfillmentStatus, OrderState, PaymentStatus, ProductStatus } from "@/lib/admin/commerce/types";
import type { SitePresence } from "@/lib/admin/readiness";
import { Badge } from "@/components/admin/ui/badge";

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  if (status === "published") return <Badge variant="brand">Publicado</Badge>;
  if (status === "archived") return <Badge variant="muted">Arquivado</Badge>;
  return <Badge variant="outline">Rascunho</Badge>;
}

export function SitePresenceBadge({ presence }: { presence: SitePresence }) {
  switch (presence.state) {
    case "live":
      return <Badge variant="success">No site</Badge>;
    case "draft":
      return <Badge variant="muted">Fora do site</Badge>;
    case "archived":
      return <Badge variant="muted">Arquivado</Badge>;
    case "missing-editorial":
      return presence.published ? (
        <Badge variant="warning">Publicado sem ficha</Badge>
      ) : (
        <Badge variant="warning">Ficha em falta</Badge>
      );
  }
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const map: Record<PaymentStatus, [string, "success" | "warning" | "muted" | "destructive" | "outline"]> = {
    paid: ["Pago", "success"],
    pending: ["Pagamento pendente", "warning"],
    refunded: ["Reembolsado", "muted"],
    failed: ["Pagamento cancelado", "destructive"],
    unknown: ["Pagamento —", "outline"],
  };
  const [label, variant] = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export function FulfillmentBadge({ status, state }: { status: FulfillmentStatus; state?: OrderState }) {
  if (state === "cancelled") return <Badge variant="destructive">Cancelado</Badge>;
  const map: Record<FulfillmentStatus, [string, "success" | "warning" | "muted" | "brand" | "outline"]> = {
    fulfilled: ["Enviado", "success"],
    partial: ["Envio parcial", "brand"],
    unfulfilled: ["A enviar", "warning"],
    unknown: ["Envio —", "outline"],
  };
  const [label, variant] = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}
