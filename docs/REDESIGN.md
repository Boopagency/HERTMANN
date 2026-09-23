# Redesign — mapa SPINELLI → HERTMANN

Branch: `redesign/loja-alta-joalheria`

A Spinelli Kilcollin é o molde de **estrutura, composição, proporção, ritmo,
densidade e comportamento**. Tudo o que se vê — logotipo, cores, tipografia,
produtos, imagens e textos — é HERTMANN. Nenhum texto, imagem, nome de produto
ou código da Spinelli foi usado.

---

## 1. Como a referência foi medida

A política de rede deste ambiente bloqueia `www.spinellikilcollin.com` e
`hertmann.vercel.app` (proxy e WebFetch). A análise foi feita assim:

- **Home** — o screenshot de página inteira enviado (676 × 2000 px), medido
  pixel a pixel (limites de secção, colunas dos tiles, cores, posição dos
  textos). Todas as medidas abaixo estão em **vw**, porque o screenshot é uma
  redução da largura real; em 1440 px, 1 vw = 14,4 px.
- **Arquitectura das PLPs e do menu** — índices de busca (as rotas
  `/collections/rings`, `/collections/earrings`, `/collections/newarrivals`,
  `/collections/in-stock`, `/collections/jewelry`, filtros por metal e pedra)
  e a descrição detalhada do briefing.
- **Hertmann actual** — compilada e fotografada localmente (Playwright) em
  1440 px.

### Medidas-chave da home da referência

| Elemento | Medida | Em 1440 px |
| --- | --- | --- |
| Altura total da home | 2,96 × largura | ≈ 4 260 px |
| Barra superior | 2,1 vw | ≈ 30 px |
| Linha do header (inset) | margem 2,2 vw | ≈ 32 px |
| Hero | 58 vw (≈ 100 vh) | ≈ 840 px |
| Texto do hero | canto inf. esq., margem 2,2 vw, título ≈ 4,2 vw itálico leve | ≈ 60 px |
| Vitrine: altura total | 27,8 vw | ≈ 400 px |
| Vitrine: margem lateral | 6,2 vw (setas centradas nessa margem) | ≈ 90 px |
| Vitrine: tile | 16 vw, **quadrado**, 5 visíveis | ≈ 230 px |
| Vitrine: gap | 1,9 vw | ≈ 28 px |
| Vitrine: respiro sup./inf. | 3,1 vw / 4,4 vw | ≈ 45 / 64 px |
| Cor do tile | `#F5F3F3` sobre página `#FFFFFF` | — |
| Blocos editoriais 50/50 | **quadrados de 50 vw**, gap 0, sangria total | 720 × 720 px |
| Texto editorial | canto sup. esq., inset ≈ 2 vw × 3 vw | título ≈ 26 px, link ≈ 12 px |
| Footer | 31 vw, 2 colunas de links + newsletter + fio + redes/legais | ≈ 450 px |

### Hertmann antes do redesign (1440 px)

- Home com **13 494 px** de altura — 3,2 × a referência.
- Intervalo entre secções `clamp(6.5rem, 13vw, 14rem)` (até 224 px), mais
  `section-lg` até 320 px.
- Manifesto de 4 linhas entre o hero e o primeiro produto; o primeiro produto
  aparece a ≈ 3 000 px do topo.
- Fotos de produto mostradas pequenas, dentro de uma prancha cinza com 7 % de
  margem — "caixa dentro da caixa".
- Rodapé azul-marinho, alto, com a assinatura em destaque.

---

## 2. Mapa elemento a elemento

| Spinelli | HERTMANN | Adaptação |
| --- | --- | --- |
| Barra superior fina com mensagem em movimento e × | `AnnouncementBar` | 30 px (28 no móvel), Inter 10 px em caixa alta espaçada, marquee muito lento (90 s) com máscara de desvanecimento nas bordas, pausa no hover, estática com `prefers-reduced-motion`. Mensagens da casa. Fio inferior de 1 px. Pode ser fechada. |
| Header transparente sobre o hero, logo central, hambúrguer à esquerda, utilidades à direita, fio inset | `Header` | Mesma composição. Monograma + assinatura HERTMANN ao centro. Fio de 1 px com margens de 2,2 vw. Sobre o hero: transparente, azul-marinho nos ecrãs deitados e branco nos ecrãs de pé (onde o topo da fotografia é o cabelo da modelo, com um sopro de sombra). Ao rolar — e nas outras páginas: vidro fosco `rgba(255,255,255,.74)` + `backdrop-filter: blur(18px) saturate(1.4)`, o fio passa a toda a largura. Sem sombra, sem cantos. |
| Três "pílulas" sob o fio (visita, medidor, atendimento virtual) | Linha de acessos sob o fio | Três acessos rectangulares de fio fino (a marca não usa cantos redondos): Visite a boutique, Atendimento por vídeo, WhatsApp. Só no topo da home, a partir de 1024 px; recolhem ao rolar. |
| Menu lateral a partir da esquerda, busca no topo, lista com fios e "+" | `SideMenu` | Painel off-white (≈ 34 vw, 88 vw no móvel), a página continua visível sob um véu leve. Busca que responde ao escrever. Lista comercial: Novidades · Disponíveis · Anéis + · Brincos + · Colares + · Pulseiras + · Coleções + · Presentes · A casa + · Atendimento. Cormorant SC, fios de 1 px, "+" que se fecha em "−". |
| Hero ≈ 100 vh, texto mínimo no canto inferior esquerdo | `HomeHero` | 92 svh (88 no telemóvel). Retrato de campanha Vertente, enquadrado para que o brinco e o anel fiquem livres e o texto assente no blazer. Rótulo HERTMANN, título "Vertente", uma linha, um link. Sem manifesto, sem parágrafo, um só CTA. A vitrine seguinte já espreita na dobra. |
| Vitrine "The … Collection": título pequeno central, 5 tiles quadrados, nome minúsculo, seta na margem | `ProductRail` — "Seleção Hertmann" | Mesmas proporções (6,2 vw de margem, 16 vw por tile, 1,9 vw de gap, 45/64 px de respiro). Nome em Cormorant SC 15 px, preço Inter 11 px, amostras de metal. Setas finas nas margens, sem UI de carrossel. No móvel: faixa com 2,2 tiles e *scroll-snap*. |
| 50/50 "Wren is here" + "Wear it your way" | `EditorialPair` | Dois quadrados de 50 vw colados à vitrine, gap 0. Vertente (fotografia de campanha, texto em baixo) + "Use do seu jeito" (filme Solstício, texto em cima) — a mesma assimetria da referência. Título Cormorant SC ≈ 27 px, link em Cormorant itálico sublinhado. |
| 50/50 "To be charming" + anel gigante em fundo claro "Create your own style" | `EditorialPair` com painel de produto | Noturno (fotografia azul-noite) + o anel de assinatura HERTMANN em escala enorme sobre a névoa de estúdio: "Sob encomenda — Desenhe a sua peça". |
| Vitrine "Shop Best Sellers" com setas nas duas pontas | `ProductRail` — "Mais desejadas" | Idem, todas as peças, ordenadas por destaque. |
| 50/50 "Earrings" + "Make an appointment" (vitrina da loja) | `EditorialPair` | Brincos (Circunferência) + Atendimento Hertmann (a boutique do Batel, texto em baixo para não cruzar a placa da fachada). No telemóvel ficam lado a lado, em dois retratos, só com título e seta. |
| — (não existe na referência) | `HouseNote` | A história entra só aqui, depois de cinco momentos comerciais: duas linhas, três números entre fios, "Conheça a Hertmann →". |
| Footer branco: 2 colunas, newsletter com botão rectangular, fio, redes à esquerda, legais e © à direita | `Footer` | Fundo claro. Colunas Loja · A casa · Atendimento + newsletter com botão rectangular de fio. Fio de 1 px. Instagram/WhatsApp à esquerda, legais, morada e © à direita. |
| PLP: hero editorial, título, barra de filtros, ordenação à direita, grelha limpa | `CollectionHero` + `CatalogueView` | Par de imagens 50/50 com o título sobre a primeira (quando há fotografia adequada). Barra de filtros com fios: Coleção · Material · Pedra · Preço · Entrega, painel que abre por baixo; ordenação à direita; contagem. Filtros sincronizados com a URL (`?colecao=`, `?material=`, `?entrega=pronta`, `?novidades=1`, `?preco=ate-10000`, `?ordem=`). |
| Grelha de produto: tiles quadrados, fundo contínuo, sem cartão | `ProductTile` | 3 por linha a partir de 768 px (2 no telemóvel), gap 1,4 vw, ≤ 48 px entre linhas. Respiro **dentro** do tile, não entre linhas. Hover troca de fotografia (packshot → peça usada) ou aproxima 3,5 %. Favorito discreto no canto. Em "Todas as joias", um capítulo editorial em toda a largura entra a meio da grelha sem desequilibrar as linhas. |
| Tile com fundo `#F5F3F3` e joia a flutuar | Slot `packshot` | O catálogo ganha o campo `packshot`. Quando preenchido: joia recortada/centrada sobre a névoa de estúdio `#F5F5F5` (derivada do cinza oficial `#EBEBEB`), foto usada no hover. Enquanto não existir: a melhor fotografia disponível, em sangria total, com ponto focal na joia (`focus`). |

### Escala de espaçamento

| Token | Valor | Uso |
| --- | --- | --- |
| `--gutter` | `clamp(16px, 2.2vw, 44px)` | header, textos editoriais, PLP |
| `--gutter-rail` | `clamp(16px, 6.2vw, 124px)` | vitrines e rodapé |
| `--space-commerce` | `clamp(40px, 4.4vw, 80px)` | respiro das secções comerciais |
| `--space-title` | `clamp(28px, 3.1vw, 56px)` | topo das vitrines até o título |
| Editorial | `0` | pares 50/50 encostam uns nos outros e nas bordas |

Nenhuma secção usa mais de 80 px de respiro vertical.

### Tipografia

| Papel | Família | Tamanho (1440) |
| --- | --- | --- |
| Título do hero | Cormorant SC 300 | ≈ 66 px |
| Título editorial | Cormorant SC | ≈ 27 px |
| Título de vitrine | Cormorant SC | 16 px |
| Nome de peça | Cormorant SC | 15 px |
| Preço | Inter, tabular | 11 px |
| Links editoriais | Cormorant Garamond itálico, sublinhado | 15 px |
| Rótulos, navegação utilitária | Inter caixa alta, 0,16 em | 10–11 px |

### Móvel (390 px)

Experiência própria, não um empilhamento: barra 28 px, header 56 px,
hero 88 svh com o mesmo texto; vitrines em faixa horizontal com
*scroll-snap* (2,2 tiles); o primeiro par editorial empilha em sangria total
(4:5), o segundo alterna retrato + produto, o terceiro fica lado a lado em
dois retratos; PLP a 2 colunas com o painel de filtros em folha inferior;
menu a 88 vw.

---

## 3. Validação

Comparação lado a lado com o screenshot da referência, à mesma escala, e QA em
Playwright (servidor de produção) em 1920, 1440, 1024, 768 e 390 px.

| Medida | Referência | HERTMANN antes | HERTMANN agora |
| --- | --- | --- | --- |
| Altura da home em 1440 px | ≈ 4 260 px | 13 494 px | 4 639 px (inclui o bloco "a casa", que a referência não tem) |
| Primeiro produto a partir do topo | ≈ 900 px | ≈ 3 000 px | ≈ 900 px — espreita na dobra |
| Maior respiro vertical entre blocos | ≈ 64 px | até 320 px | 64 px (vitrines); 0 entre capítulos |
| Momentos de produto na home | 2 vitrines + 1 painel | 1 grelha | 2 vitrines + 1 painel |

- Overflow horizontal: 0 px em todas as páginas e larguras.
- CLS: 0,0000 em todas as páginas medidas (1440 e 390 px).
- Consola: sem erros.
- 31 links internos percorridos, nenhum partido.
- Menu (abrir, acordeão, busca, Escape), setas da vitrine, gesto horizontal de
  trackpad com Lenis activo, cabeçalho de vidro ao rolar, filtros (painel,
  selecção, URL, ordenação, atalhos), folha de filtros no telemóvel e sacola —
  verificados.
- SEO: HTML estático com a grelha completa, JSON-LD (`JewelryStore`, `Product`,
  `BreadcrumbList`), canónicos e Open Graph inalterados; as 33 páginas continuam
  estáticas.

A comparação com a referência ao vivo, no browser, fica por fazer enquanto o
domínio estiver bloqueado neste ambiente.

---

## 4. Fotografia — o que precisa de ser produzido

O redesign está pronto para fotografia definitiva: nenhum componente muda quando
ela chegar. Por ordem de impacto:

### 4.1 Packshots das 12 peças — prioridade máxima

É o que transforma as vitrines e a grelha na experiência completa (joia a
flutuar sobre fundo contínuo, peça usada no hover).

| Especificação | Valor |
| --- | --- |
| Formato | Quadrado, 2400 × 2400 px (mínimo 2000) |
| Fundo | Off-white uniforme `#F5F5F5`, ou PNG com transparência e sombra de contacto |
| Enquadramento | Joia centrada, a ocupar 55–65 % do quadro; a mesma escala por categoria |
| Luz | Suave, frontal-superior (softbox grande), sombra natural de contacto, sem reflexos duros |
| Temperatura | 5000–5500 K, igual em toda a série |
| Ângulo | Anéis de pé, a 3/4 · colares pousados em curva ou em busto invisível · brincos em par, de frente · pulseiras fechadas, a 3/4 |
| Entrega | `packshot-<slug>.png` → campo `packshot` em `lib/data/catalogue.ts` |

Peças: Perene, Vertente (par), Meridiano, Noturno (colar), Circunferência,
Solstício (brinco), Cadência, Arquétipo, Noturno (anel), Solstício (colar),
Ponto, Noturno (pulseira). Uma segunda vista por peça (`imageAlt`) é
recomendada.

### 4.2 Seis capítulos editoriais — alta resolução

As fotografias actuais têm 736–1176 px de largura e são ampliadas nos ecrãs
grandes (o hero chega a 1,9 × em 1920 px). Menos imagens, maiores:

| Capítulo | Formato mínimo | Nota de direcção |
| --- | --- | --- |
| Hero Vertente | 3840 × 2160 (16:9) + versão 4:5 para telemóvel | Espaço calmo no canto inferior esquerdo para o título; o topo ao centro livre para o logotipo |
| Vertente (par) | 2400 × 2400 | Peças em ouro amarelo em movimento |
| "Use do seu jeito" | Filme 1080 × 1350 ou maior, 8–15 s, em loop | Uso diário, luz natural |
| Noturno | 2400 × 2400 | Luz baixa, azul-noite, ouro branco e safira |
| Brincos | 2400 × 2400 | Grande plano, fundo escuro |
| Atendimento / boutique | 2400 × 2400 | Sem letreiros no terço superior esquerdo, onde vive o texto |

### 4.3 Aberturas de categoria e de coleção

Pares 4:5 (2000 × 2500 px cada) para Anéis, Colares, Brincos, Pulseiras e para
as quatro coleções — hoje reutilizam as fotografias das peças.

### 4.4 Ateliê

Mãos na bancada, cravação, polimento, desenhos técnicos — para a página Ateliê e
para o bloco "a casa" da home, que hoje é só tipográfico.
