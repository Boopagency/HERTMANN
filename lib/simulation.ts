/* ============================================================================
   Modo simulado — só desenvolvimento local e testes automatizados
   ----------------------------------------------------------------------------
   Com ADMIN_SIMULATION=true, o Admin e o catálogo do site usam dados em
   memória (uma loja Hostinger e um Supabase de mentira) e uma sessão de
   teste, para correr o painel e os testes E2E sem tocar em nenhum serviço
   real. Tudo o que é simulado aparece rotulado como tal na interface.

   Nunca liga na Vercel: a plataforma define sempre VERCEL=1, e com ele o
   modo simulado fica desligado, esteja a variável como estiver. Não há
   forma de o ativar num deploy — nem Preview, nem Production.
   ========================================================================== */

export const simulationEnabled =
  process.env.ADMIN_SIMULATION === "true" && !process.env.VERCEL;
