import { NextResponse } from "next/server";
import {
  HostingerApiError,
  isStoreConfigured,
  listProducts,
  listVariants,
  salesChannelId,
  storefrontBaseUrl,
  variantSnapshot,
} from "@/lib/hostinger/client";
import { homologationEnabled } from "@/lib/data/homologation";

export const dynamic = "force-dynamic";

/* ============================================================================
   Diagnóstico da ligação à Storefront API — só dados públicos do canal.
   Mostra o catálogo normalizado (preço, promoção, estoque) e uma amostra
   crua da primeira resposta de produto e de variante, para conferir o
   formato real da API no Preview sem adivinhar.
   ========================================================================== */

const headers = { "Cache-Control": "no-store" };

export async function GET() {
  if (!isStoreConfigured) {
    return NextResponse.json(
      {
        ok: false,
        configured: false,
        message:
          "Configure NEXT_PUBLIC_HOSTINGER_SALES_CHANNEL_ID na Vercel.",
      },
      { status: 503, headers },
    );
  }

  try {
    const products = await listProducts({ limit: 100 });
    const variantsByProduct = await Promise.all(
      products.map((product) => listVariants([product.id])),
    );

    return NextResponse.json(
      {
        ok: true,
        configured: true,
        salesChannelId,
        storefrontBaseUrl,
        homologation: homologationEnabled,
        productCount: products.length,
        products: products.map((product, index) => ({
          id: product.id,
          title: product.title,
          status: product.status ?? null,
          variants: variantsByProduct[index].map((variant) => ({
            id: variant.id,
            title: variant.title ?? null,
            sku: variant.sku ?? null,
            snapshot: variantSnapshot(variant, product.id),
          })),
        })),
        sample: {
          product: products[0] ?? null,
          variant: variantsByProduct[0]?.[0] ?? null,
        },
      },
      { headers },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        configured: true,
        message:
          error instanceof Error
            ? error.message
            : "Falha ao consultar a Storefront API da Hostinger.",
        detail: error instanceof HostingerApiError ? error.detail : null,
      },
      { status: 502, headers },
    );
  }
}
