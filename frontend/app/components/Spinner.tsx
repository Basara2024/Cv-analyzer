import styles from "./Spinner.module.css";

type SpinnerVariant = "page" | "button" | "large" | "auth" | "inline" | "layout";

interface SpinnerProps {
  variant?: SpinnerVariant;
  className?: string;
}

export default function Spinner({ variant = "page", className = "" }: SpinnerProps) {
  return (
    <span
      className={`${styles.spinner} ${styles[variant]} ${className}`.trim()}
      role="status"
      aria-label="Cargando"
    />
  );
}
