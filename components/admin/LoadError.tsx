import { AlertTriangleIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/admin/ui/alert";

/** Uma fonte de dados falhou: dizer qual, sem esconder o resto da página. */
export function LoadError({ title, error }: { title: string; error: string }) {
  return (
    <Alert variant="destructive">
      <AlertTriangleIcon />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <p>{error}</p>
      </AlertDescription>
    </Alert>
  );
}
