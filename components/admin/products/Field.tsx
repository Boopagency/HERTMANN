import { Label } from "@/components/admin/ui/label";
import { FieldError } from "@/components/admin/FormMessage";
import { cn } from "@/components/admin/ui/cn";

/** Rótulo, controlo, ajuda e erro — sempre na mesma ordem. */
export function Field({
  id,
  label,
  hint,
  error,
  className,
  children,
}: {
  id: string;
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("grid content-start gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      <FieldError id={`${id}-erro`} message={error} />
    </div>
  );
}
