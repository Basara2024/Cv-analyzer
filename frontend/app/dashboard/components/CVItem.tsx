"use client";
import { useState } from "react";
import styles from "./CVItem.module.css";

interface CVItemProps {
  item: {
    id: number;
    file_name: string;
    puntuacion_general: number;
    resumen: string;
    created_at: string;
  };
  onSelect: () => void;
  onDelete: () => void;
}

const scoreColor = (score: number) =>
  score >= 75 ? "var(--green)" : score >= 50 ? "var(--yellow)" : "var(--red)";

export default function CVItem({ item, onSelect, onDelete }: CVItemProps) {
  const [confirming, setConfirming] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirming) {
      onDelete();
    } else {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3000);
    }
  };

  return (
    <div className={styles.item} onClick={onSelect}>
      <div className={styles.score} style={{ color: scoreColor(item.puntuacion_general) }}>
        {item.puntuacion_general}
      </div>
      <div className={styles.info}>
        <p className={styles.fileName}>{item.file_name}</p>
        <p className={styles.resumen}>{item.resumen}</p>
        <span className={styles.date}>
          {new Date(item.created_at).toLocaleDateString("es", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      </div>
      <button
        className={`${styles.deleteBtn} ${confirming ? styles.deleteBtnConfirm : ""}`}
        onClick={handleDelete}
        title={confirming ? "Clic para confirmar" : "Eliminar"}
      >
        {confirming ? "¿Seguro?" : "✕"}
      </button>
    </div>
  );
}
