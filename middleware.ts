import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SIMULATED_SESSION_COOKIE, simulationEnabled } from "@/lib/simulation";

/* ============================================================================
   Middleware — só /admin (o site público nunca passa por aqui)
   ----------------------------------------------------------------------------
   1. Painel não configurado neste ambiente → 404, sem corpo.
   2. Renova a sessão do Supabase (cookies httpOnly) e redireciona para
      /admin/entrar quem não tem sessão.
   3. Cabeçalhos de segurança do painel.

   Isto é conveniência e primeira linha, não a fronteira de segurança: cada
   página e cada Server Action voltam a verificar sessão e papel no servidor
   (lib/admin/auth/member.ts), e o RLS do banco verifica de novo.
   ========================================================================== */

export const config = { matcher: ["/admin", "/admin/:path*"] };

/** Caminhos do painel abertos a quem ainda não entrou. */
const PUBLIC_PATHS = ["/admin/entrar", "/admin/senha/recuperar", "/admin/auth/confirmar"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function secure(response: NextResponse): NextResponse {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Content-Security-Policy", "frame-ancestors 'none'");
  response.headers.set("Referrer-Policy", "same-origin");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export async function middleware(request: NextRequest) {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!simulationEnabled && !(url && key)) {
    return new NextResponse(null, { status: 404 });
  }

  let response = NextResponse.next({ request });
  let signedIn: boolean;

  if (simulationEnabled) {
    signedIn = request.cookies.has(SIMULATED_SESSION_COOKIE);
  } else {
    const supabase = createServerClient(url!, key!, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
          for (const [name, value] of Object.entries(headers ?? {})) {
            response.headers.set(name, value);
          }
        },
      },
    });
    // Verifica a assinatura do token (e renova-o, se preciso).
    const { data } = await supabase.auth.getClaims();
    signedIn = Boolean(data?.claims?.sub);
  }

  const { pathname } = request.nextUrl;
  if (!signedIn && !isPublic(pathname)) {
    const login = request.nextUrl.clone();
    login.pathname = "/admin/entrar";
    login.search = pathname === "/admin" ? "" : `?seguir=${encodeURIComponent(pathname)}`;
    return secure(NextResponse.redirect(login));
  }

  return secure(response);
}
