// Convierte strings con marcadores `**palabra**` en JSX con <strong>.
// Uso: {renderRich("Esto es **importante** para ti")}
// No procesa nada más — sin links, sin listas, sin cursiva. Solo bold inline.

import { Fragment } from "react";

export function renderRich(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}
