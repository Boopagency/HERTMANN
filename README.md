# HERTMANN

Experiência digital da joalheria HERTMANN. Next.js 15 (App Router), TypeScript,
Tailwind CSS 4 e Motion.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

---

## Direcção de arte

O Manual de Marca é a fonte de verdade. As decisões que dele decorrem:

| Elemento | Decisão |
| --- | --- |
| Paleta | `#051D41` azul-marinho, `#000000`, `#EBEBEB`, `#FFFFFF`. Nenhuma cor fora destas. As derivadas (`--color-ink-70`, `--color-rule`, …) são opacidades do azul-marinho, não cores novas. |
| Azul-marinho | O coração da marca. Superfície da barra superior, do menu aberto, do rodapé e do bloco "O traço" do ateliê; cor do texto, dos fios e dos botões em tudo o resto; e presente na fotografia (hero, Noturno). Texto sobre azul: branco, e nunca abaixo de 62 % de opacidade (≈ 7:1). |
| Tipografia | **Cormorant SC** para a marca, títulos, manifestos e nomes de coleções. **Inter** para navegação, preços, rótulos e informação técnica. Duas famílias, nada mais. |
| Logotipo | Monograma HM servido como máscara CSS (`/public/brand/monogram-white.png`), pelo que herda a cor do contexto. A assinatura "Hertmann" é **texto vivo** em Cormorant SC — nítida em qualquer densidade e legível por leitores de ecrã. Restrições da p.14 respeitadas: sem rotação, recorte, sombra ou alteração de cor. |
| Ícones | "Linha Heritage" (p.15): traço fino de espessura constante, geometria sóbria, vazados, grid de 24×24. Ver `components/brand/Icons.tsx`. |
| Ilustrações | Estilo *Fine Line* (p.15): desenhos técnicos de traço fino. Ver `components/brand/Marks.tsx`. |

### Grelha e ritmo — densidade de loja

A estrutura segue a escola de e-commerce de alta joalharia documentada em
[`docs/REDESIGN.md`](docs/REDESIGN.md): **o respiro vive à volta da joia, não
entre secções**.

| Token | Valor | Uso |
| --- | --- | --- |
| `--spacing-gutter` | `clamp(16px, 2.2vw, 44px)` | cabeçalho, textos editoriais, catálogo |
| `--spacing-rail` | `clamp(16px, 6.2vw, 124px)` | vitrines e rodapé (as setas vivem nesta margem) |
| `--spacing-commerce` | `clamp(40px, 4.4vw, 80px)` | respiro das secções comerciais — nunca mais de 80 px |
| `--spacing-title` | `clamp(28px, 3.1vw, 56px)` | do topo da vitrine ao título |

Os capítulos editoriais (`EditorialPair`) são pares 50/50 em sangria, sem
intervalo, cada um um quadrado de meia largura limitado à altura útil do ecrã.
O catálogo tem 3 colunas a partir de 768 px e 2 no telemóvel. As vitrines
mostram 5 tiles a partir de 1280 px, 4 a partir de 1024, 3¼ no tablet e 2¼ no
telemóvel.

### Movimento

Só `opacity`, `transform` e `clip-path`. Curva única (`cubic-bezier(0.16, 1, 0.3, 1)`),
durações de 0,6 a 1,9 s. Rolagem suave por Lenis, desligada em dispositivos de toque
e sob `prefers-reduced-motion`, que também neutraliza todas as revelações — o conteúdo
aparece de imediato, sem deslocamento.

Primitivas em `components/motion/Reveal.tsx`: `Reveal`, `RevealGroup`, `RevealLines`,
`RevealVeil`, `Parallax`, `ScrollScale`.

> **Nota de implementação.** Em `RevealLines` e `RevealVeil` o observador vive
> sempre no elemento **exterior**. As linhas interiores estão escondidas pelo
> `overflow: hidden` do seu invólucro e, se fossem elas a ser observadas, nunca
> chegariam a intersectar a janela — ficariam invisíveis para sempre. São por isso
> conduzidas por variantes.

---

## Fotografia

Toda a imagem servida vem do próprio Manual de Marca — campanha, peças usadas,
embalagem e boutique. Nenhuma imagem foi gerada ou inventada no redesign; os
cartazes dos filmes (`public/images/posters/`) são fotogramas dos próprios filmes.

### O slot `packshot`

Cada peça do catálogo pode declarar três imagens:

```ts
image: { src, cutout: false, alt, focus: "50% 40%" },   // a peça usada — sempre
packshot: { src, cutout: true, alt },                    // a peça isolada — quando existir
imageAlt: { src, cutout: false, alt },                   // segunda vista — opcional
```

- Com `packshot`, as vitrines e a grelha mostram a joia centrada, com respiro,
  sobre a névoa de estúdio (`--color-studio`, `#F5F5F5`), e a fotografia usada
  revela-se no hover — o comportamento completo da loja.
- Sem `packshot` (o estado actual das 12 peças), a fotografia usada ocupa o tile
  em sangria, enquadrada pela joia através de `focus` (`object-position`), e o
  hover aproxima 3,5 %.

Nenhum componente precisa de mudar quando os packshots chegarem: basta
preencher o campo em `lib/data/catalogue.ts`. A especificação de produção está
em `docs/REDESIGN.md`.

### Onde cada fotografia aparece

As escolhas editoriais vivem em `lib/data/editorial.ts` (hero, vitrines, pares
editoriais, aberturas de categoria e de coleção, capítulo da grelha).

| Ficheiro | Onde aparece |
| --- | --- |
| `hertmann/hero/campanha-safira-seda.jpg` | Hero da home — fotografia enviada pela HERTMANN |
| `hertmann/editorial/vertente-colar-malha-blazer.jpg` + `use-do-seu-jeito-pulseira-elos.jpg` | Primeiro par editorial |
| `hertmann/editorial/noturno-anel-safira.jpg` + `hertmann/atelier/sob-encomenda-cravacao-bancada.jpg` | Noturno + Sob encomenda |
| `hertmann/editorial/brincos-ponto-de-luz.jpg` + `hertmann/boutique/sala-privada.jpg` | Brincos + Atendimento (e Contato) |
| `hertmann/heritage/maos-bigorna.jpg` + `anel-que-atravessa-geracoes.jpg` | Sobre |
| `hertmann/atelier/macarico-solda.jpg` | Ateliê |
| `campaign-portrait.png` · `campaign-hero.jpg` | Capítulo da grelha "Todas as joias", abertura da coleção Vertente, Open Graph |
| `colar-noturn.jpg` + `hero-ring.png` | Abertura da coleção Noturno |
| `piece-bag.png` | Vista "Como chega" na página de produto |
| Fotografias das peças | Tiles, página de produto, aberturas de categoria e de coleção |

As fotografias em `public/images/hertmann/` (excepto o hero) vêm da curadoria `ASSETS-SHORT`
(licença Unsplash, uso comercial livre) e são **editoriais**: as joias que
mostram não são peças do catálogo e nunca aparecem em tiles de produto. Origem,
autor e licença de cada uma estão em `docs/REDESIGN.md`, secção 5.

### Recortar uma fotografia nova

`scripts/cutout.py` é o processo que produziu todas as imagens acima. A chave
parte da cor do fundo lida nas margens, propaga-se apenas pelos pixels ligados à
borda — para não abrir buracos dentro da peça — e usa uma rampa suave, de modo
que a **sombra de contacto sobrevive**. É essa sombra que faz a peça assentar na
página em vez de flutuar sobre ela.

```bash
pip install pillow
python3 scripts/cutout.py foto-original.png public/images/nome.png
```

Se o fundo não for uniforme, `--inner` e `--outer` afinam os limiares da chave.

**Antes de recortar uma imagem, verifique se ela já não vem com canal alfa.**
Um PNG exportado de outro sítio pode já trazer a transparência certa — nesse
caso `cutout.py` está a mais e, pior, pode introduzir defeitos que o ficheiro
original não tinha (foi o que aconteceu com `hero-ring.png`: a fotografia
enviada já vinha correctamente recortada, com a abertura entre os aros
entrelaçados incluída; o utilitário só precisava de a cortar à medida):

```bash
python3 -c "from PIL import Image; im = Image.open('foto.png'); print(im.mode, im.getchannel('A').getextrema() if 'A' in im.mode else 'sem alfa')"
```

Se o modo for `RGBA` e os extremos do canal alfa cobrirem `0` e próximo de
`255`, a imagem já está recortada — baste enquadrar:

```bash
python3 -c "
from PIL import Image
im = Image.open('foto.png')
box = im.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
pad = 20
im.crop((max(0,box[0]-pad), max(0,box[1]-pad), min(im.width,box[2]+pad), min(im.height,box[3]+pad))).save('public/images/nome.png')
"
```

### Os desenhos de ateliê

Os dez desenhos Fine Line (`band`, `solitaire`, `pendant`, `pendantGem`,
`choker`, `hoop`, `drop`, `stud`, `links`, `bangle`) acompanham cada peça na
página de produto ("Desenho de ateliê") e no bloco "O traço" do ateliê. Se uma
peça não tiver fotografia nenhuma, o desenho ocupa o seu tile.

---

## Estrutura

```
app/
  page.tsx                    Home — hero, vitrine, 50/50, editorial + produto,
                              vitrine, 50/50, a casa
  joias/                      Catálogo e catálogo por categoria (filtros na URL)
  colecoes/                   Índice de coleções e página de coleção
  produto/[slug]/             Página de peça
  sobre/  atelie/  contato/   Institucional
  termos/  privacidade/       Legal
  sitemap.ts  robots.ts
components/
  brand/      Logotipo, ícones Linha Heritage, desenhos Fine Line
  layout/     Barra superior, cabeçalho, menu lateral, busca, rodapé, camada modal
  motion/     Primitivas de revelação
  sections/   Hero, pares editoriais, filme, "a casa", newsletter, contacto
  product/    Tile, vitrine, grelha, barra de filtros, abertura de coleção,
              galeria, painel de peça
  commerce/   Sacola e favoritos (estado local), gaveta da sacola
  ui/         Botões
lib/data/     catalogue.ts (o que a casa faz) · editorial.ts (como a loja o
              mostra) · site.ts
lib/          filters.ts (filtros e ordenação) · search.ts (busca)
docs/         REDESIGN.md — o mapa da referência e a especificação de fotografia
```

### Filtros e atalhos

O estado dos filtros vive na URL, para que cada selecção seja partilhável e os
atalhos do menu sejam endereços simples. As páginas continuam estáticas: o HTML
servido traz a grelha completa e a selecção é aplicada ao hidratar.

| Endereço | Resultado |
| --- | --- |
| `/joias?novidades=1` | Novidades (coleções mais recentes) |
| `/joias?entrega=pronta` | Disponíveis — pronta-entrega |
| `/joias?preco=ate-10000` | Presentes — até R$ 10 mil |
| `?colecao=` `?material=` `?pedra=` `?preco=` `?entrega=` | Filtros combináveis (valores separados por vírgula) |
| `?ordem=novidades` `preco-asc` `preco-desc` | Ordenação |

### Estado de loja

Sacola e favoritos vivem em `localStorage`, no dispositivo de quem visita — nunca
saem do navegador. A escrita está protegida contra armazenamento indisponível
(janela privada, dados bloqueados): a loja continua a funcionar em memória.

---

## Pontos de integração

Três lugares esperam um serviço real; até lá simulam a resposta e mostram os
estados corretos:

- `components/sections/Newsletter.tsx` — subscrição
- `components/sections/ContactForm.tsx` — envio de mensagem
- `components/commerce/BagDrawer.tsx` — "Finalizar compra"

---

## Acessibilidade

Semântica correta (`header`/`main`/`nav`/`footer`, títulos em ordem, botões e links
reais), *skip link*, foco visível como um fio de 1 px, foco preso e devolvido nas
camadas modais, `Escape` fecha, rolagem do corpo bloqueada enquanto abertas,
`aria-live` nas mudanças de quantidade e nos estados de formulário, `alt` descritivo
em todas as imagens e áreas de toque de 44 px em ecrãs pequenos.

## SEO

Metadados por página com `title` em template, Open Graph e Twitter Card, canónicos,
`sitemap.xml`, `robots.txt`, e JSON-LD de `JewelryStore` (global), `Product` e
`BreadcrumbList` (página de peça).
