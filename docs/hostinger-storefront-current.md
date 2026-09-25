# Hostinger eCommerce — integração sobre o front atual

Data: 2026-09-24

> **Substituído** por [`hostinger-storefront-implementacao-2026-09-25.md`](hostinger-storefront-implementacao-2026-09-25.md)
> (Fases 0 e 1). Em particular, `NEXT_PUBLIC_SITE_URL` deixou de ser necessário: fica vazio até
> existir domínio definitivo — ver `lib/site-url.ts`.

## Objetivo

Conectar o front atual da HERTMANN à Hostinger eCommerce usando o Custom Storefront, sem recriar o site no Website Builder e sem alterar o layout aprovado.

## O que esta branch faz

- parte exatamente da `main` atual;
- adiciona cliente tipado para a Storefront API v2;
- adiciona suporte ao checkout hospedado da Hostinger;
- adiciona `.env.example` com as três configurações públicas;
- adiciona `/api/hostinger-status` para validar a conexão e enxergar o catálogo disponível;
- não muda nenhuma página, componente, animação ou fotografia do site.

## Configuração na Vercel

Adicionar como **Config (pública / não sensível)**:

- `NEXT_PUBLIC_HOSTINGER_SALES_CHANNEL_ID`
- `NEXT_PUBLIC_HOSTINGER_STOREFRONT_API_URL`
- `NEXT_PUBLIC_SITE_URL`

Não existe Secret nesta etapa. A Storefront API pública não usa token no navegador.

## Próxima etapa

Depois de o catálogo real da HERTMANN existir na Hostinger:

1. mapear cada peça do catálogo editorial para `product_id` e `variant_id`;
2. substituir preço e estoque estáticos pelos dados ao vivo;
3. converter a sacola atual em itens de checkout da Hostinger;
4. criar páginas de sucesso/cancelamento;
5. testar frete, pagamento e pedido ponta a ponta;
6. somente depois fazer merge na `main`.

A branch antiga `feature/hostinger-ecommerce` não deve ser mergeada diretamente porque está baseada em uma versão anterior do site e ficou atrás do redesign atual.
