import { NextResponse } from "next/server";
import {
  isStoreConfigured,
  listProducts,
  salesChannelId,
} from "@/lib/hostinger/client";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isStoreConfigured) {
    return NextResponse.json(
      {
        ok: false,
        configured: false,
        message:
          "Configure NEXT_PUBLIC_HOSTINGER_SALES_CHANNEL_ID na Vercel.",
      },
      { status: 503 },
    );
  }

  try {
    const products = await listProducts({ limit: 100 });

    return NextResponse.json({
      ok: true,
      configured: true,
      salesChannelId,
      productCount: products.length,
      products: products.map((product) => ({
        id: product.id,
        title: product.title,
        status: product.status ?? null,
        variants: product.variants?.map((variant) => ({
          id: variant.id,
          title: variant.title ?? null,
          inventoryQuantity:
            variant.inventory_quantity ?? null,
        })) ?? [],
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        configured: true,
        message:
          error instanceof Error
            ? error.message
            : "Falha ao consultar a Storefront API da Hostinger.",
      },
      { status: 502 },
    );
  }
}
