"use client";

import { useTransition } from "react";

/**
 * Formulário ligado a uma Server Action (via useActionState) que NÃO se
 * reinicia no fim, ao contrário de <form action={…}>. Com o reinício
 * automático do React 19, os Switch e Checkbox voltavam ao valor inicial e a
 * tela deixava de mostrar o que tinha sido gravado.
 */
export function ActionForm({
  action,
  onSubmit,
  ...props
}: Omit<React.ComponentProps<"form">, "action"> & { action: (data: FormData) => void }) {
  const [, startTransition] = useTransition();
  return (
    <form
      {...props}
      onSubmit={(event) => {
        onSubmit?.(event);
        if (event.defaultPrevented) return;
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(() => action(data));
      }}
    />
  );
}
