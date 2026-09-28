import "server-only";
import type {
  AdminOrder,
  AdminProduct,
} from "@/lib/admin/commerce/types";
import { DEFAULT_SITE_SETTINGS, type EditorialItem, type SiteSettings } from "@/lib/catalog/types";

/* ============================================================================
   Dados simulados — em memória, só com o modo simulado (lib/simulation.ts)
   ----------------------------------------------------------------------------
   Uma loja e um banco editorial de mentira, para desenvolvimento local e
   testes E2E. NÃO são respostas da Hostinger nem do Supabase: são
   fixtures rotuladas, que se perdem a cada reinício do servidor.

   O estado vive em `globalThis` porque o Next empacota cada rota à parte:
   um módulo comum não seria partilhado entre o Admin, as páginas do site e
   a Storefront simulada.
   ========================================================================== */

export type StoredImage = { type: string; bytes: Uint8Array };

export type AuditRecord = {
  at: string;
  userId: string;
  action: string;
  target: string | null;
  system: "hostinger" | "supabase";
  outcome: "ok" | "error";
  detail: Record<string, unknown> | null;
};

type SimulatedState = {
  products: AdminProduct[];
  orders: AdminOrder[];
  editorial: EditorialItem[];
  settings: SiteSettings;
  images: Map<string, StoredImage>;
  audit: AuditRecord[];
  sequence: number;
};

const KEY = Symbol.for("hertmann.simulated-store");

function now(offsetMinutes = 0): string {
  return new Date(Date.now() - offsetMinutes * 60_000).toISOString();
}

/** Fixtures — espelham o formato do produto de teste, com IDs próprios. */
function seed(): SimulatedState {
  const product: AdminProduct = {
    id: "sim_prod_anel_prata",
    title: "Anel Solitário de Prata com Zircônias (simulado)",
    description: "Produto simulado para desenvolvimento. Não existe na loja real.",
    status: "published",
    images: [],
    variants: [
      {
        id: "sim_var_anel_prata",
        productId: "sim_prod_anel_prata",
        title: null,
        sku: "SIM-001",
        options: [],
        price: 39990,
        salePrice: 29990,
        currency: "BRL",
        decimalDigits: 2,
        manageInventory: true,
        inventoryQuantity: 10,
      },
    ],
    createdAt: now(60 * 24 * 3),
    updatedAt: now(60 * 24),
  };

  const draft: AdminProduct = {
    id: "sim_prod_brinco_rascunho",
    title: "Brinco Argola em Prata (simulado)",
    description: null,
    status: "draft",
    images: [],
    variants: [
      {
        id: "sim_var_brinco_p",
        productId: "sim_prod_brinco_rascunho",
        title: "P",
        sku: "SIM-002-P",
        options: [{ name: "Tamanho", value: "P" }],
        price: 18900,
        salePrice: null,
        currency: "BRL",
        decimalDigits: 2,
        manageInventory: true,
        inventoryQuantity: 2,
      },
      {
        id: "sim_var_brinco_g",
        productId: "sim_prod_brinco_rascunho",
        title: "G",
        sku: "SIM-002-G",
        options: [{ name: "Tamanho", value: "G" }],
        price: 21900,
        salePrice: null,
        currency: "BRL",
        decimalDigits: 2,
        manageInventory: true,
        inventoryQuantity: 0,
      },
    ],
    createdAt: now(60 * 5),
    updatedAt: now(60 * 5),
  };

  const address = {
    name: "Cliente de teste",
    line1: "Rua Simulada, 100",
    line2: null,
    city: "Curitiba",
    state: "PR",
    postalCode: "80000-000",
    country: "BR",
    phone: null,
  };

  const orders: AdminOrder[] = [
    {
      id: "sim_order_1002",
      number: "1002",
      createdAt: now(90),
      state: "open",
      payment: "paid",
      fulfillment: "unfulfilled",
      customer: { name: "Cliente de teste", email: "cliente@exemplo.invalid", phone: null },
      shippingAddress: address,
      items: [
        {
          title: product.title,
          variantTitle: null,
          sku: "SIM-001",
          quantity: 1,
          unitPrice: 29990,
          total: 29990,
          productId: product.id,
          variantId: "sim_var_anel_prata",
        },
      ],
      currency: "BRL",
      decimalDigits: 2,
      subtotal: 29990,
      shipping: 2500,
      discount: null,
      total: 32490,
      shippingMethod: "Envio padrão (simulado)",
      paymentMethod: "Test Payment (simulado)",
      fulfillments: [],
      note: null,
    },
    {
      id: "sim_order_1001",
      number: "1001",
      createdAt: now(60 * 26),
      state: "completed",
      payment: "paid",
      fulfillment: "fulfilled",
      customer: { name: "Outra cliente de teste", email: "outra@exemplo.invalid", phone: null },
      shippingAddress: { ...address, name: "Outra cliente de teste" },
      items: [
        {
          title: product.title,
          variantTitle: null,
          sku: "SIM-001",
          quantity: 2,
          unitPrice: 29990,
          total: 59980,
          productId: product.id,
          variantId: "sim_var_anel_prata",
        },
      ],
      currency: "BRL",
      decimalDigits: 2,
      subtotal: 59980,
      shipping: 0,
      discount: null,
      total: 59980,
      shippingMethod: "Retirada (simulado)",
      paymentMethod: "Test Payment (simulado)",
      fulfillments: [
        { createdAt: now(60 * 20), carrier: "Correios", trackingNumber: "SIM000000000BR", trackingUrl: null },
      ],
      note: null,
    },
  ];

  return {
    products: [product, draft],
    orders,
    editorial: [],
    settings: { ...DEFAULT_SITE_SETTINGS },
    images: new Map(),
    audit: [],
    sequence: 1,
  };
}

export function simulatedState(): SimulatedState {
  const holder = globalThis as unknown as Record<symbol, SimulatedState | undefined>;
  holder[KEY] ??= seed();
  return holder[KEY]!;
}

export function nextSimulatedId(prefix: string): string {
  const state = simulatedState();
  state.sequence += 1;
  return `${prefix}_${Date.now().toString(36)}${state.sequence}`;
}
