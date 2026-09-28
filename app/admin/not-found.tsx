import Link from "next/link";
import { Button } from "@/components/admin/ui/button";

export default function AdminNotFound() {
  return (
    <main className="grid min-h-dvh place-items-center p-6">
      <div className="max-w-sm text-center">
        <p className="text-sm font-medium text-muted-foreground">404</p>
        <h1 className="mt-2 text-xl font-semibold">Página não encontrada</h1>
        <p className="mt-2 text-sm text-muted-foreground">O endereço não existe ou o item foi removido.</p>
        <Button asChild className="mt-6">
          <Link href="/admin">Voltar ao painel</Link>
        </Button>
      </div>
    </main>
  );
}
