"use client";

import { useActionState, useState } from "react";
import { LoaderIcon } from "lucide-react";
import { saveSiteSettings } from "@/lib/admin/actions/products";
import { idle } from "@/lib/admin/action-result";
import { Button } from "@/components/admin/ui/button";
import { Switch } from "@/components/admin/ui/switch";
import { Label } from "@/components/admin/ui/label";
import { FormMessage } from "@/components/admin/FormMessage";

export function SiteSettingsForm({ showPrototypes }: { showPrototypes: boolean }) {
  const [state, action, pending] = useActionState(saveSiteSettings, idle);
  const [value, setValue] = useState(showPrototypes);

  return (
    <form action={action} className="grid gap-4">
      <div className="flex items-start gap-3">
        <Switch id="showPrototypes" checked={value} onCheckedChange={setValue} className="mt-0.5" />
        <input type="hidden" name="showPrototypes" value={value ? "on" : "off"} />
        <div className="grid gap-1">
          <Label htmlFor="showPrototypes">Mostrar as peças de protótipo</Label>
          <p className="text-sm text-muted-foreground">
            As 12 peças do catálogo original do site (Perene, Vertente, Meridiano…). Não estão à venda: mostram o preço
            editorial e “Consultar disponibilidade”. Desligue quando o catálogo real estiver publicado.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FormMessage state={state} />
        <Button type="submit" disabled={pending || value === showPrototypes} className="ml-auto">
          {pending && <LoaderIcon className="animate-spin" />}
          Salvar
        </Button>
      </div>
    </form>
  );
}
