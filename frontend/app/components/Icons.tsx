import type { ReactNode } from "react";

/**
 * Set de iconos lineales (outline) de Matchia.
 * Trazo con `currentColor` y tamaño `1em`, por lo que heredan el `font-size`
 * y `color` del contenedor. Estilo Feather: limpio y consistente.
 */
function Icon({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg
      className={className}
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

type IconProps = { className?: string };

export const ZapIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" />
  </Icon>
);

export const TargetIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.5" />
  </Icon>
);

export const ClipboardCheckIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="8" y="3" width="8" height="4" rx="1" />
    <path d="M16 5h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2" />
    <path d="m9 14 2 2 4-4" />
  </Icon>
);

export const FileTextIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5" />
    <path d="M9 13h6M9 17h5" />
  </Icon>
);

export const BarChartIcon = (p: IconProps) => (
  <Icon {...p}>
    <line x1="6" y1="20" x2="6" y2="12" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="18" y1="20" x2="18" y2="9" />
  </Icon>
);

export const SparklesIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Z" />
    <path d="M19 14l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7.7-1.9Z" />
  </Icon>
);

export const SearchIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.5" y2="16.5" />
  </Icon>
);

export const BriefcaseIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="3" y1="12" x2="21" y2="12" />
  </Icon>
);

export const GraduationCapIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M22 9 12 5 2 9l10 4 10-4Z" />
    <path d="M6 11v4c0 1.1 2.7 3 6 3s6-1.9 6-3v-4" />
  </Icon>
);

export const UsersIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </Icon>
);

export const ShieldCheckIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    <path d="m9 12 2 2 4-4" />
  </Icon>
);

export const RefreshIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
    <path d="M21 3v5h-5" />
  </Icon>
);

export const ArrowRightIcon = (p: IconProps) => (
  <Icon {...p}>
    <line x1="4" y1="12" x2="19" y2="12" />
    <path d="m13 6 6 6-6 6" />
  </Icon>
);

export const CheckIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m5 13 4 4L19 7" />
  </Icon>
);

export const UploadIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="M7 9l5-5 5 5" />
    <line x1="12" y1="4" x2="12" y2="16" />
  </Icon>
);
