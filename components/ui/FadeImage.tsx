"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

/* ============================================================================
   Imagem com entrada — o next/image de sempre, que assenta num fade curto
   no instante em que o ficheiro chega (ver `img[data-fade]` no CSS).
   As prioritárias (primeiro ecrã, LCP) não levam fade: aparecem já.
   O next/image confirma no mount as imagens que já vêm da cache, por isso
   nenhuma fica presa invisível.
   ========================================================================== */

export function FadeImage({ priority, onLoad, ...props }: ImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <Image
      {...props}
      priority={priority}
      data-fade={priority ? undefined : ""}
      data-loaded={loaded ? "" : undefined}
      onLoad={(event) => {
        setLoaded(true);
        onLoad?.(event);
      }}
    />
  );
}
