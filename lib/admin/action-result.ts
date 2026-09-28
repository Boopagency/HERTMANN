/** Resposta de uma Server Action do painel, para a interface mostrar. */
export type ActionResult = {
  ok: boolean;
  message: string | null;
  fieldErrors?: Record<string, string>;
};

export const idle: ActionResult = { ok: false, message: null };
