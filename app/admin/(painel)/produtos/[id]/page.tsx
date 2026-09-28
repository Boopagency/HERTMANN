import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangleIcon, CheckCircle2Icon, ExternalLinkIcon, InfoIcon } from "lucide-react";
import { requireMember } from "@/lib/admin/auth/member";
import { can } from "@/lib/admin/auth/permissions";
import { commerce, loadProduct } from "@/lib/admin/queries";
import { publishReadiness, sitePresence } from "@/lib/admin/readiness";
import { categories, collections } from "@/lib/data/catalogue";
import { defaultDrawing, drawingVariants, slugify } from "@/lib/catalog/types";
import { PageBody, PageHeader } from "@/components/admin/PageHeader";
import { LoadError } from "@/components/admin/LoadError";
import { ProductStatusBadge, SitePresenceBadge } from "@/components/admin/StatusBadges";
import { EditorialForm } from "@/components/admin/products/EditorialForm";
import { ImagesPanel } from "@/components/admin/products/ImagesPanel";
import { PublishPanel } from "@/components/admin/products/PublishPanel";
import { StoreInfoForm } from "@/components/admin/products/StoreInfoForm";
import { VariantsEditor } from "@/components/admin/products/VariantsEditor";
import { Alert, AlertDescription, AlertTitle } from "@/components/admin/ui/alert";
import { Button } from "@/components/admin/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { date } from "@/components/admin/format";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ criado?: string; ficha?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { product } = await loadProduct((await params).id);
  return { title: product?.title ?? "Produto" };
}

export default async function ProductPage({ params, searchParams }: Props) {
  const member = await requireMember();
  const { id } = await params;
  const flags = await searchParams;
  const { product, editorial, error } = await loadProduct(id);

  if (error && !product) {
    return (
      <>
        <PageHeader title="Produto" crumbs={[{ href: "/admin/produtos", label: "Produtos" }]} />
        <PageBody>
          <LoadError title="Não foi possível ler o produto na loja" error={error} />
        </PageBody>
      </>
    );
  }
  if (!product) notFound();

  const item = editorial.ok ? editorial.data : null;
  const presence = sitePresence(product, item);
  const readiness = publishReadiness(product, item);
  const resolution = commerce();
  const capabilities = resolution.ok ? resolution.provider.capabilities : { removeImage: false, editSku: false };
  const canEdit = can(member.role, "produtos.editar");
  const category = item?.category ?? categories[0].slug;

  return (
    <>
      <PageHeader
        crumbs={[{ href: "/admin/produtos", label: "Produtos" }]}
        title={product.title}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <ProductStatusBadge status={product.status} />
            <SitePresenceBadge presence={presence} />
            <span className="text-xs">Atualizado em {date(product.updatedAt)}</span>
          </span>
        }
        actions={
          presence.state === "live" && (
            <Button asChild variant="outline" size="sm">
              <a href={`/produto/${presence.slug}`} target="_blank" rel="noreferrer">
                <ExternalLinkIcon />
                Ver no site
              </a>
            </Button>
          )
        }
      />
      <PageBody className="grid gap-6">
        {flags.criado && (
          <Alert variant="info">
            <CheckCircle2Icon />
            <AlertTitle>Produto criado como rascunho</AlertTitle>
            <AlertDescription>
              <p>Complete a ficha do site e envie as imagens. Quando a lista de publicação estiver completa, publique-o.</p>
            </AlertDescription>
          </Alert>
        )}
        {(flags.ficha === "falhou" || presence.state === "missing-editorial") && (
          <Alert variant="warning">
            <AlertTriangleIcon />
            <AlertTitle>{presence.state === "missing-editorial" && presence.published ? "Publicado na loja, mas sem ficha do site" : "Falta a ficha do site"}</AlertTitle>
            <AlertDescription>
              <p>
                O produto existe na loja, mas não tem ficha do site — por isso não aparece no site.
                {presence.state === "missing-editorial" && presence.published && " Ele pode ser comprado por quem tiver o endereço direto do checkout; complete a ficha ou despublique-o."}{" "}
                Preencha a ficha abaixo e salve.
              </p>
            </AlertDescription>
          </Alert>
        )}
        {!editorial.ok && <LoadError title="Não foi possível ler a ficha do site" error={editorial.error} />}

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Variantes, preço e estoque</CardTitle>
                <CardDescription>Salvo na loja. Os preços mudam no site em até um minuto.</CardDescription>
              </CardHeader>
              <CardContent>
                <VariantsEditor
                  productId={product.id}
                  variants={product.variants}
                  canEdit={canEdit}
                  canDelete={can(member.role, "variantes.excluir")}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ficha do site</CardTitle>
                <CardDescription>Como a peça aparece no site: endereço, textos, coleção e apresentação.</CardDescription>
              </CardHeader>
              <CardContent>
                {editorial.ok ? (
                  <EditorialForm
                    productId={product.id}
                    item={item}
                    suggestion={{ slug: slugify(product.title), drawing: defaultDrawing[category] }}
                    slugLocked={product.status === "published" && Boolean(item)}
                    canEdit={canEdit}
                    storeTitle={product.title}
                    categories={categories.map((c) => ({ value: c.slug, label: c.name }))}
                    collections={collections.map((c) => ({ value: c.slug, label: c.name }))}
                    drawings={drawingVariants}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">A ficha fica disponível quando a ligação ao banco voltar.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informações da loja</CardTitle>
                <CardDescription>O nome que aparece no checkout e nos pedidos.</CardDescription>
              </CardHeader>
              <CardContent>
                <StoreInfoForm productId={product.id} title={product.title} description={product.description} canEdit={canEdit} />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:sticky lg:top-6">
            <Card>
              <CardHeader>
                <CardTitle>Publicação</CardTitle>
                <CardDescription>
                  {product.status === "published"
                    ? "Publicado: aparece no site e pode ser comprado."
                    : product.status === "archived"
                      ? "Arquivado: fora do site e da venda."
                      : "Rascunho: fora do site e da venda."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PublishPanel
                  productId={product.id}
                  status={product.status}
                  readiness={readiness}
                  canPublish={can(member.role, "produtos.publicar")}
                  canArchive={can(member.role, "produtos.arquivar")}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Imagens</CardTitle>
              </CardHeader>
              <CardContent>
                <ImagesPanel productId={product.id} images={product.images} canEdit={canEdit} canRemove={capabilities.removeImage} />
              </CardContent>
            </Card>

            <Card className="gap-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <InfoIcon className="size-4 text-muted-foreground" />
                  Onde vive cada dado
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-1.5 text-xs text-muted-foreground">
                <p>
                  <strong className="font-medium text-foreground">Loja</strong> — nome comercial, variantes, preços, estoque,
                  imagens e publicação.
                </p>
                <p>
                  <strong className="font-medium text-foreground">Ficha do site</strong> — endereço, textos, coleção,
                  desenho e ordem.
                </p>
                <p className="pt-1">
                  <Link href="/admin/produtos" className="text-brand hover:underline">
                    Voltar à lista
                  </Link>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageBody>
    </>
  );
}
