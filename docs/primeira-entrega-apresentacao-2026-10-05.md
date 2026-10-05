# Apresentação da primeira entrega — HERTMANN

_2026-10-05 · branch `apresentacao/primeira-entrega` · nenhuma mudança de código do site._

## O que foi feito

Uma apresentação de 29 slides para a primeira reunião formal com as responsáveis pela HERTMANN.
Ela foi publicada como deck de slides (Artifact privado do claude.ai):

- **Link:** https://claude.ai/artifact/WGZQFQzckde8WhBdvH74SX
- O deck é privado. Para outras pessoas o abrirem, ele precisa ser partilhado pelo menu Share da
  própria página.
- Pode ser apresentado no navegador e exportado para PDF ou PPTX pelo próprio deck.

A apresentação não é técnica. Ela conta o site como uma jornada e separa com clareza o que a Boop
construiu, o que depende da HERTMANN e o que será decidido em conjunto.

**Ideia central:** o digital foi pensado como parte da marca, com o mesmo cuidado da vitrine, do
atendimento e da embalagem.

## Estrutura narrativa

| # | Slide | Função |
|---|---|---|
| 1 | Capa | HERTMANN · A experiência digital da casa |
| 2 | Ponto de partida | O site como primeiro encontro com a marca |
| 3 | Três ideias | Joia em primeiro plano · Desejo antes da venda · Clareza na compra |
| 4 | Hero (tela cheia) | Primeira impressão, sem texto |
| 5 | Abertura | A entrada da home em três quadros reais |
| 6 | Produto, imediatamente | ≈ 900 px até o primeiro produto; home com ⅓ da altura original |
| 7 | Ritmo editorial | A home inteira em escala, com o mapa dos blocos |
| 8 | Capítulos (tela cheia) | Par Noturno + Sob encomenda |
| 9 | No celular | Quatro decisões específicas do mobile |
| 10 | Navegação | Menu discreto até ser chamado (desktop + celular) |
| 11 | Catálogo | Filtros, links compartilháveis, folha de filtros no celular |
| 12 | Coleção (tela cheia) | Abertura da coleção Noturno |
| 13 | Página de produto | O mínimo para decidir; "Consultar disponibilidade" |
| 14 | Detalhe da peça | Desenho de ateliê e "Como chega" |
| 15 | Movimento | Uma curva, três durações; respeito ao movimento reduzido |
| 16 | Compra | Sacola: uma lista, um total, um botão (rotulada como ambiente de teste) |
| 17 | Do desejo ao pedido | Peça → Sacola → Conferência → Pagamento → Retorno |
| 18 | Por trás da interface | Site (o que a cliente vê) ⇄ Loja (o que a operação controla) |
| 19 | Homologação | Teste real com a loja, 76 verificações automatizadas |
| 20 | Preparado para crescer | Peça a peça, packshots, buscas, acessibilidade |
| 21 | Onde estamos | Mudança de etapa |
| 22 | O que já existe | Construído pela Boop |
| 23 | O que dá vida à estrutura | Insumos da HERTMANN |
| 24 | Fotografia | Especificação resumida de packshots e campanha |
| 25 | O que definimos juntos | Pagamento, frete, medição, formulários, buscas |
| 26 | Domínio | Registrado pela própria HERTMANN, em seu nome |
| 27 | Continuidade | Caminho A (infraestrutura própria) · Caminho B (serviço recorrente Boop) |
| 28 | A próxima fase | Produto → Conteúdo → Lançamento → Operação |
| 29 | Encerramento | "Por onde começamos: as primeiras peças." |

Cada slide tem notas do apresentador com o contexto e as ressalvas.

## Direção de arte

- Paleta e tipografia do próprio site: azul-marinho `#051D41`, branco, névoa de estúdio `#F5F5F5`;
  Cormorant SC (títulos), Cormorant Garamond itálico (voz) e Inter (rótulos e texto).
- Fios finos no lugar de cartões, poucas palavras por slide, alternância entre slides claros,
  slides em azul-marinho e slides só de imagem.
- Nenhum ícone genérico, degradê ou mockup de dispositivo: os telemóveis são as próprias capturas,
  com cantos arredondados e um fio.

## Fontes de verdade usadas

- `README.md`, `docs/REDESIGN.md`, `docs/hostinger-storefront-*.md`, `CLAUDE.md`.
- Código: `app/page.tsx`, `lib/data/editorial.ts`, `lib/data/catalogue.ts`, `lib/data/site.ts`,
  `components/sections/HomeHero.tsx`, `components/layout/*`, `components/product/*`,
  `components/commerce/*`, `components/motion/tokens.ts`.
- Os números citados vêm da documentação do projeto: alturas da home (13.494 px → 4.639 px) e
  posição do primeiro produto (≈ 3.000 px → ≈ 900 px) em `docs/REDESIGN.md`; 76 verificações e a
  homologação de 2026-09-26 em `docs/hostinger-storefront-release-2026-09-26.md`; durações de
  movimento em `components/motion/tokens.ts`.

## Como as capturas foram feitas

Todas as imagens do deck são capturas reais do site, feitas com Playwright (Chromium do ambiente)
sobre `next build` + `next start`, desta mesma versão da `main` (`797322e`):

- **Desktop:** 1440 × 900, densidade 1,5.
- **Celular:** viewport do iPhone 13, densidade 2.
- **Entrada da home:** três quadros da animação de abertura, capturados em momentos diferentes
  depois do carregamento.
- **Home em tira:** captura de página inteira, com a barra superior e o cabeçalho ocultos só para a
  captura.

**Sacola e fluxo de compra — ambiente simulado.** Como nenhuma peça está à venda, as capturas da
sacola cheia foram feitas com a Storefront **simulada** do projeto (`scripts/e2e/storefront-simulada.mjs`)
e o produto técnico de homologação. **Não é a Hostinger real.** O slide 16 diz isso na própria
página ("Ambiente de teste, com o produto de homologação da loja. Não é uma peça HERTMANN.") e nas
notas. O checkout hospedado da Hostinger não aparece em captura.

## O que a apresentação afirma, e o que ela evita afirmar

**Afirma (implementado e verificável no repositório):**
- design, páginas, versão mobile própria, menu, busca, filtros, movimento;
- sacola e favoritos, leitura ao vivo de preço e estoque, checkout hospedado, retorno;
- homologação real em 2026-09-26 (relatada pelo usuário) e 76 verificações automatizadas contra a
  Storefront simulada;
- proteções de produção: `noindex`, nada à venda, páginas técnicas só no Preview.

**Apresenta como pendente ou a decidir:**
- analytics: **não existe** no código;
- painel administrativo: **não foi construído**; a gestão é o painel da Hostinger;
- newsletter e formulário de contato: simulam o envio, não têm serviço real;
- meio de pagamento definitivo (só Test Payment; Stripe planejado);
- frete: regra da Região Sul planejada e não configurada;
- domínio e indexação.

**Ressalva importante para a reunião (slide 23 e notas):** os textos institucionais do site são
provisórios e precisam de validação da HERTMANN — "desde 1948", "78 anos de casa", "14 semanas por
peça", "9 artesãos", endereço no Batel, telefones, e-mail e políticas de entrega, troca e cuidados.
O catálogo de 12 peças e os seus preços são protótipo. As imagens editoriais em
`public/images/hertmann/` são de banco (licença Unsplash) e temporárias.

## Campos a preencher antes da reunião

- **Slide 27 — Continuidade:** `R$ [ ____ ] / mês`, valor do serviço recorrente da Boop. Nenhum
  valor foi inventado.
- Confirmar o mês da capa ("Outubro de 2026") se a reunião for noutra data.

## Verificações

| Verificação | Resultado |
|---|---|
| `npx tsc --noEmit` | ✅ sem erros |
| `npm run build` | ✅ 35 rotas |
| Capturas desktop e celular | ✅ 56 capturas + 10 do fluxo de compra simulado |

Nenhum arquivo do site foi alterado. Esta branch contém só este documento.

## Bloqueios

Nenhum. O deck não foi verificado visualmente depois de publicado (o tipo de artifact desaconselha
renderizações de verificação sem pedido); ajustes finos de layout podem ser feitos a partir da
revisão do usuário.

## Próximos passos

1. Revisar o deck e preencher o valor do slide 27.
2. Partilhar o link com quem vai apresentar (menu Share do deck).
3. Depois da reunião: registar as decisões (peças iniciais, fotografia, pagamento, frete, domínio,
   continuidade) e abrir a fase de produto e conteúdo.
