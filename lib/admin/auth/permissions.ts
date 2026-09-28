/* ============================================================================
   Papéis e permissões do painel
   ----------------------------------------------------------------------------
   Uma tabela só, lida pelo servidor antes de cada operação (e espelhada no
   RLS do banco, que é a segunda barreira). A interface também a usa para
   esconder o que o papel não pode fazer — por conveniência, nunca como
   segurança.
   ========================================================================== */

export type AdminRole = "admin" | "editor" | "leitura";

export const roleLabel: Record<AdminRole, string> = {
  admin: "Administrador",
  editor: "Editor",
  leitura: "Leitura",
};

export type Permission =
  | "painel.ver"
  | "produtos.editar"
  | "produtos.publicar"
  | "produtos.arquivar"
  | "variantes.excluir"
  | "pedidos.ver"
  | "site.configurar";

const grants: Record<AdminRole, readonly Permission[]> = {
  admin: [
    "painel.ver",
    "produtos.editar",
    "produtos.publicar",
    "produtos.arquivar",
    "variantes.excluir",
    "pedidos.ver",
    "site.configurar",
  ],
  editor: ["painel.ver", "produtos.editar", "produtos.publicar", "pedidos.ver"],
  leitura: ["painel.ver", "pedidos.ver"],
};

export function can(role: AdminRole | null | undefined, permission: Permission): boolean {
  return role ? grants[role].includes(permission) : false;
}

export function isAdminRole(value: unknown): value is AdminRole {
  return value === "admin" || value === "editor" || value === "leitura";
}
