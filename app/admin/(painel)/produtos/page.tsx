import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon, SearchIcon } from "lucide-react";
import { requireMember } from "@/lib/admin/auth/member";
import { can } from "@/lib/admin/auth/permissions";
import { loadCatalogue, type ProductRow } from "@/lib/admin/queries";
import { LOW_STOCK, priceRange, sitePresence, totalStock } from "@/lib/admin/readiness";
import { PageBody, PageHeader } from "@/components/admin/PageHeader";
import { LoadError } from "@/components/admin/LoadError";
import { ProductStatusBadge, SitePresenceBadge } from "@/components/admin/StatusBadges";
import { Thumb } from "@/components/admin/products/Thumb";
import { OrphanRow } from "@/components/admin/products/OrphanRow";
import { money } from "@/components/admin/format";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Card } from "@/components/admin/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/admin/ui/table";
import { cn } from "@/components/admin/ui/cn";

export const metadata: Metadata = { title: "Produtos" };

const filters = [
  { value: "todos", label: "Todos" },
  { value: "publicados", label: "Publicados" },
  { value: "rascunhos", label: "Rascunhos" },
  { value: "atencao", label: "Precisam de atenção" },
  { value: "arquivados", label: "Arquivados" },
] as const;

type Filter = (typeof filters)[number]["value"];

function needsAttention(row: ProductRow): boolean {
  const presence = sitePresence(row.product, row.editorial);
  const stock = totalStock(row.product);
  return (
    row.product.status !== "archived" &&
    (presence.state === "missing-editorial" || (stock !== null && stock <= LOW_STOCK) || row.product.variants.length === 0)
  );
}

function matches(row: ProductRow, filter: Filter, query: string): boolean {
  const { product, editorial } = row;
  if (filter === "publicados" && product.status !== "published") return false;
  if (filter === "rascunhos" && product.status !== "draft") return false;
  if (filter === "arquivados" && product.status !== "archived") return false;
  if (filter === "todos" && product.status === "archived") return false;
  if (filter === "atencao" && !needsAttention(row)) return false;
  if (!query) return true;
  const haystack = [product.title, editorial?.displayName, editorial?.slug, ...product.variants.map((v) => v.sku)]
    .filter(Boolean)
    .join(" ")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
  return haystack.includes(query);
}

type Props = { searchParams: Promise<{ estado?: string; q?: string }> };

export default async function ProductsPage({ searchParams }: Props) {
  const member = await requireMember();
  const params = await searchParams;
  const filter = (filters.find((f) => f.value === params.estado)?.value ?? "todos") as Filter;
  const query = (params.q ?? "").trim().normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const { rows, orphans, products, editorial } = await loadCatalogue();
  const visible = rows.filter((row) => matches(row, filter, query));
  const canEdit = can(member.role, "produtos.editar");

  return (
    <>
      <PageHeader
        title="Produtos"
        description="O catálogo da loja. Preço, estoque e publicação ficam na loja; a ficha do site define como a peça aparece."
        actions={
          canEdit && (
            <Button asChild>
              <Link href="/admin/produtos/novo">
                <PlusIcon />
                Novo produto
              </Link>
            </Button>
          )
        }
      />
      <PageBody className="grid gap-4">
        {!products.ok && <LoadError title="Não foi possível ler os produtos da loja" error={products.error} />}
        {!editorial.ok && <LoadError title="Não foi possível ler as fichas do site" error={editorial.error} />}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav aria-label="Filtrar produtos" className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
            {filters.map((f) => {
              const active = f.value === filter;
              const href = `/admin/produtos?estado=${f.value}${params.q ? `&q=${encodeURIComponent(params.q)}` : ""}`;
              return (
                <Link
                  key={f.value}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                    active && "bg-background text-foreground shadow-xs",
                  )}
                >
                  {f.label}
                </Link>
              );
            })}
          </nav>
          <form className="relative w-full sm:w-72" role="search">
            <input type="hidden" name="estado" value={filter} />
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input name="q" defaultValue={params.q ?? ""} placeholder="Buscar por nome, endereço ou SKU" className="pl-8" aria-label="Buscar produtos" />
          </form>
        </div>

        <Card className="gap-0 overflow-hidden py-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Produto</TableHead>
                <TableHead>Loja</TableHead>
                <TableHead>Site</TableHead>
                <TableHead className="text-right">Preço</TableHead>
                <TableHead className="text-right">Estoque</TableHead>
                <TableHead className="pr-4 text-right">Variantes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map(({ product, editorial: item }) => {
                const range = priceRange(product);
                const stock = totalStock(product);
                const currency = product.variants[0]?.currency;
                return (
                  <TableRow key={product.id} className="relative">
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-3">
                        <Thumb src={product.images[0]?.url} alt="" />
                        <div className="min-w-0">
                          <Link
                            href={`/admin/produtos/${product.id}`}
                            className="font-medium outline-none after:absolute after:inset-0 hover:underline focus-visible:underline"
                          >
                            {product.title}
                          </Link>
                          <p className="truncate text-xs text-muted-foreground">
                            {item ? `/produto/${item.slug}` : "sem ficha do site"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <ProductStatusBadge status={product.status} />
                    </TableCell>
                    <TableCell>
                      <SitePresenceBadge presence={sitePresence(product, item)} />
                    </TableCell>
                    <TableCell className="tabular text-right whitespace-nowrap">
                      {range ? (range.min === range.max ? money(range.min, currency) : `${money(range.min, currency)} – ${money(range.max, currency)}`) : "—"}
                    </TableCell>
                    <TableCell className={cn("tabular text-right", stock !== null && stock <= LOW_STOCK && "font-medium text-warning")}>
                      {stock === null ? <span className="text-muted-foreground">sem controle</span> : stock}
                    </TableCell>
                    <TableCell className="tabular pr-4 text-right">{product.variants.length}</TableCell>
                  </TableRow>
                );
              })}
              {visible.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                    {products.ok ? "Nenhum produto neste filtro." : "Sem dados da loja."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>

        {orphans.length > 0 && (
          <section className="grid gap-2">
            <h2 className="text-sm font-semibold">Fichas sem produto na loja</h2>
            <p className="text-sm text-muted-foreground">
              O produto destas fichas não existe mais na loja (foi removido fora do painel). Elas não aparecem no site.
            </p>
            <Card className="gap-0 py-0">
              {orphans.map((item) => (
                <OrphanRow key={item.id} item={{ id: item.id, slug: item.slug, productId: item.hostingerProductId }} canArchive={can(member.role, "produtos.arquivar")} />
              ))}
            </Card>
          </section>
        )}
      </PageBody>
    </>
  );
}
