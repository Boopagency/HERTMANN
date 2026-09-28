import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { adminAuthMode } from "@/lib/admin/config";
import { createAdminSupabase } from "@/lib/supabase/server";

/* ============================================================================
   Regresso dos e-mails do Supabase Auth (convite, recuperação de senha)
   ----------------------------------------------------------------------------
   Troca o código (PKCE) ou o token do e-mail por uma sessão, gravada em
   cookies httpOnly, e segue para um caminho do painel.
   ========================================================================== */

export const dynamic = "force-dynamic";

function safeNext(value: string | null): string {
  if (!value || !value.startsWith("/admin") || value.startsWith("//") || value.includes("\\")) {
    return "/admin";
  }
  return value;
}

export async function GET(request: NextRequest) {
  if (adminAuthMode !== "supabase") return new NextResponse(null, { status: 404 });

  const { searchParams } = request.nextUrl;
  const next = safeNext(searchParams.get("seguir"));
  const supabase = await createAdminSupabase();

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      : { error: new Error("sem código") };

  const target = request.nextUrl.clone();
  target.search = "";
  if (error) {
    target.pathname = "/admin/entrar";
    target.searchParams.set("link", "expirado");
  } else {
    target.pathname = next;
  }
  return NextResponse.redirect(target);
}
