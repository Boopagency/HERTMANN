# HERTMANN — instruções permanentes

## Documentação de entregas (regra do cliente)

**Toda entrega que gere demanda devolve um ficheiro Markdown.** Diagnóstico,
plano, implementação, análise, decisão técnica, levantamento de bloqueios: o
que for respondido no chat tem de existir também como documento. Responder só
no terminal não serve — o utilizador não quer copiar texto do chat de cada vez.

Regras:

- Um ficheiro por entrega, em `docs/`, nomeado `<assunto>-<tipo>-AAAA-MM-DD.md`
  (ex.: `hostinger-ecommerce-diagnostico-2026-09-19.md`).
- Escrito em português, completo e autónomo: quem abre o ficheiro sem ter lido
  a conversa entende tudo.
- Inclui sempre, quando aplicável: o que foi feito, ficheiros alterados, fluxo
  completo, verificações executadas, bloqueios e próximos passos.
- **Commitado na branch de trabalho.** O ambiente de execução é efémero: o que
  não for commitado e enviado desaparece quando a sessão termina.
- Entregue ao utilizador no fim da resposta, não apenas mencionado.
