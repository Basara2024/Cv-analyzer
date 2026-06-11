import type { CSSProperties } from "react";

/**
 * Marca de Matchia: una "M" de trazo redondeado cuyos picos sugieren un
 * "match" (dos curvas que se encuentran), rematada con un destello que
 * representa la IA. Hereda tamaño (1em) y color (currentColor) del contenedor,
 * por lo que respeta el `font-size` y `color` definidos en `.logoIcon`.
 */
export function MatchiaLogo({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      className={className}
      style={{ display: "block", ...style }}
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      role="img"
      aria-label="Matchia"
    >
      <path
        d="M4 19.5V8.4c0-.86 1.04-1.28 1.64-.66L12 14l6.36-6.26c.6-.62 1.64-.2 1.64.66V19.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20.5 2.4l.55 1.55 1.55.55-1.55.55-.55 1.55-.55-1.55L19.95 5l1.55-.55z"
        fill="currentColor"
      />
    </svg>
  );
}
