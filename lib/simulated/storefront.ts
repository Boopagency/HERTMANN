import "server-only";
import type { AdminProduct } from "@/lib/admin/commerce/types";
import type { HostingerProduct, HostingerVariant } from "@/lib/hostinger/types";
import { simulatedState } from "./store";

/* ============================================================================
   A loja simulada vista pela Storefront — o mesmo formato da API pública
   (envelope, preços em centavos, estoque na variante). Serve o catálogo do
   site no servidor e a rota /api/simulacao/storefront, que o navegador lê
   no modo simulado. Só produtos publicados, como na API real.
   ========================================================================== */

export function storefrontVariants(product: AdminProduct): HostingerVariant[] {
  return product.variants.map((variant) => ({
    id: variant.id,
    product_id: product.id,
    title: variant.title,
    sku: variant.sku,
    options: variant.options.map((o) => ({ name: o.name, value: o.value })),
    prices: [
      {
        amount: variant.price,
        sale_amount: variant.salePrice,
        currency: { code: variant.currency.toLowerCase(), decimal_digits: variant.decimalDigits },
      },
    ],
    manage_inventory: variant.manageInventory,
    inventory_quantity: variant.inventoryQuantity,
  }));
}

export function storefrontProduct(product: AdminProduct): HostingerProduct {
  return {
    id: product.id,
    title: product.title,
    description: product.description,
    thumbnail: product.images[0]?.url ?? null,
    images: product.images.map((image) => ({ id: image.id, url: image.url, alt: image.alt })),
    type: "physical",
    variants: storefrontVariants(product),
  };
}

export function simulatedStorefront(): {
  products: { product: HostingerProduct; variants: HostingerVariant[] }[];
} {
  return {
    products: simulatedState()
      .products.filter((p) => p.status === "published")
      .map((p) => ({ product: storefrontProduct(p), variants: storefrontVariants(p) })),
  };
}
