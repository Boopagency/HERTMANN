import "server-only";
import { CommerceError } from "../types";

/* ============================================================================
   Cliente HTTP da API de gestão da Hostinger — só no servidor
   ----------------------------------------------------------------------------
   O token (HOSTINGER_API_TOKEN, Secret) é da conta Hostinger inteira: com
   ele dá para mexer em faturamento, DNS, domínios e lojas. Por isso este
   cliente só aceita uma LISTA FECHADA de operações, todas debaixo da loja
   configurada (HOSTINGER_STORE_ID). Qualquer outro método ou caminho é
   recusado antes de sair qualquer pedido.

   Contrato: hostinger/api-mcp-server, src/core/tools/ecommerce.ts (lido em
   2026-09-28). Os formatos das RESPOSTAS ainda não foram vistos numa resposta
   real — os mapeamentos (mappers.ts) são tolerantes e estão marcados.
   ========================================================================== */

const DEFAULT_API_URL = "https://developers.hostinger.com";
const TIMEOUT_MS = 20_000;

export type HostingerAdminConfig = { token: string; storeId: string; baseUrl: string };

export function readHostingerAdminConfig(): HostingerAdminConfig | null {
  const token = process.env.HOSTINGER_API_TOKEN?.trim();
  const storeId = process.env.HOSTINGER_STORE_ID?.trim();
  if (!token || !storeId) return null;
  if (!/^store_[A-Za-z0-9]+$/.test(storeId)) return null;
  const baseUrl = (process.env.HOSTINGER_API_URL?.trim() || DEFAULT_API_URL).replace(/\/+$/, "");
  return { token, storeId, baseUrl };
}

type Method = "GET" | "POST" | "PATCH" | "DELETE";

const ID = "[A-Za-z0-9_-]+";

/**
 * As únicas operações permitidas (relativas a /api/ecommerce/v1/stores/{loja}).
 * Não estão aqui, de propósito: excluir produto, lojas, canais de venda,
 * pagamentos, frete, descontos, e as ações de pedido (enviar, cancelar), que
 * notificam clientes — ficam para uma fase com autorização própria.
 */
const ALLOWED: { method: Method; path: RegExp }[] = [
  { method: "GET", path: /^\/products$/ },
  { method: "POST", path: /^\/products\/physical$/ },
  { method: "PATCH", path: new RegExp(`^/products/${ID}$`) },
  { method: "GET", path: new RegExp(`^/products/${ID}/variants$`) },
  { method: "POST", path: new RegExp(`^/products/${ID}/variants$`) },
  { method: "PATCH", path: new RegExp(`^/products/${ID}/variants/batch$`) },
  { method: "DELETE", path: new RegExp(`^/products/${ID}/variants/${ID}$`) },
  { method: "POST", path: new RegExp(`^/products/${ID}/images/upload-url$`) },
  { method: "POST", path: new RegExp(`^/products/${ID}/images$`) },
  { method: "GET", path: /^\/orders$/ },
  { method: "GET", path: new RegExp(`^/orders/${ID}$`) },
];

export function isAllowed(method: Method, path: string): boolean {
  return ALLOWED.some((rule) => rule.method === method && rule.path.test(path));
}

/** Mensagem para a equipa; o detalhe técnico fica só no registo do servidor. */
function friendly(status: number): string {
  if (status === 401 || status === 403) return "A loja recusou o acesso. O token da Hostinger pode ter expirado.";
  if (status === 404) return "A loja não encontrou este item. Ele pode ter sido removido.";
  if (status === 422 || status === 400) return "A loja recusou os dados enviados. Confira os campos e tente de novo.";
  if (status === 429) return "A loja está a receber muitos pedidos. Tente de novo em alguns instantes.";
  if (status >= 500) return "A loja da Hostinger está indisponível no momento. Tente de novo em alguns minutos.";
  return "Não foi possível falar com a loja da Hostinger.";
}

export async function hostingerRequest<T = unknown>(
  config: HostingerAdminConfig,
  method: Method,
  path: string,
  options: { query?: URLSearchParams; body?: unknown } = {},
): Promise<T> {
  if (!isAllowed(method, path)) {
    // Nunca deve acontecer: é um erro de programação, não da loja.
    throw new CommerceError("Operação não permitida pelo painel.", 0, `${method} ${path} fora da lista fechada`);
  }

  const query = options.query && [...options.query].length > 0 ? `?${options.query}` : "";
  const url = `${config.baseUrl}/api/ecommerce/v1/stores/${config.storeId}${path}${query}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${config.token}`,
        ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    throw new CommerceError(friendly(0), 0, error instanceof Error ? error.message : String(error));
  }

  if (!response.ok) {
    const detail = (await response.text().catch(() => "")).slice(0, 500);
    console.error("[admin:hostinger]", method, path, response.status, detail);
    throw new CommerceError(friendly(response.status), response.status, detail || null);
  }

  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
