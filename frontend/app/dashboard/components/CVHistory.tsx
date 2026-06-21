"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import CVItem from "./CVItem";
import Spinner from "@/app/components/Spinner";
import styles from "./CVHistory.module.css";

interface HistoryItem {
  id: number;
  file_name: string;
  puntuacion_general: number;
  resumen: string;
  created_at: string;
}

interface CVHistoryProps {
  onSelect: (id: number) => void;
  refreshTrigger: number;
}

export default function CVHistory({ onSelect, refreshTrigger }: CVHistoryProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get("/analyze/history");
      setHistory(res.data.analyses);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [refreshTrigger]);

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/analyze/${id}`);
      setHistory(history.filter((h) => h.id !== id));
    } catch (error) {
      console.error("Error deleting analysis:", error);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spinner variant="inline" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>📂</span>
        <p>No tienes análisis anteriores</p>
        <span>Sube tu primer CV para empezar</span>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Historial de análisis</h3>
        <span className={styles.count}>{history.length} análisis</span>
      </div>
      <div className={styles.list}>
        {history.map((item) => (
          <CVItem
            key={item.id}
            item={item}
            onSelect={() => onSelect(item.id)}
            onDelete={() => handleDelete(item.id)}
          />
        ))}
      </div>
    </div>
  );
}
