"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import styles from "./PlanModal.module.css";

interface PlanModalProps {
  onClose: () => void;
}

export default function PlanModal({ onClose }: PlanModalProps) {
  const router = useRouter();
  const [businessBilling, setBusinessBilling] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleIndividualClick = () => {
    router.push("/coming-soon");
  };

  const handleBusinessClick = async () => {
    setLoading(true);
    setError("");
    try {
      const plan = businessBilling === "monthly" ? "business_monthly" : "business_yearly";
      const res = await api.post("/payments/create-preference", { plan });
      window.location.href = res.data.initPoint;
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al iniciar el pago. Intenta de nuevo.");
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <div className={styles.header}>
          <h2 className={styles.title}>Elige tu plan</h2>
          <p className={styles.subtitle}>Desbloquea todo el potencial de Matchia</p>
        </div>

        <div className={styles.plansGrid}>
          {/* Individual — Coming Soon */}
          <div className={styles.planCard}>
            <span className={styles.comingSoonBadge}>Próximamente</span>
            <h3 className={styles.planName}>Individual Pro</h3>
            <p className={styles.planPrice}>
              <span className={styles.priceValue}>$10</span>
              <span className={styles.priceUnit}>/mes</span>
            </p>
            <ul className={styles.featureList}>
              <li>Análisis ilimitados</li>
              <li>Reportes en PDF</li>
              <li>Reescritura inteligente</li>
              <li>Enfoque personalizado por área</li>
            </ul>
            <button className={styles.disabledBtn} onClick={handleIndividualClick}>
              Notifícame cuando esté listo
            </button>
          </div>

          {/* Business — Active */}
          <div className={styles.planCardActive}>
            <span className={styles.activeBadge}>Disponible ahora</span>
            <h3 className={styles.planName}>Business</h3>

            <div className={styles.billingToggle}>
              <button
                className={`${styles.toggleOption} ${businessBilling === "monthly" ? styles.toggleOptionActive : ""}`}
                onClick={() => setBusinessBilling("monthly")}
              >
                Mensual
              </button>
              <button
                className={`${styles.toggleOption} ${businessBilling === "yearly" ? styles.toggleOptionActive : ""}`}
                onClick={() => setBusinessBilling("yearly")}
              >
                Anual
                <span className={styles.saveTag}>Ahorra $60</span>
              </button>
            </div>

            <p className={styles.planPrice}>
              <span className={styles.priceValue}>${businessBilling === "monthly" ? "30" : "300"}</span>
              <span className={styles.priceUnit}>/{businessBilling === "monthly" ? "mes" : "año"}</span>
            </p>

            <ul className={styles.featureList}>
              <li>Subida masiva de hasta 20 CVs</li>
              <li>Rankeo automático con IA</li>
              <li>Entrevistas y feedback de equipo</li>
              <li>Pool de talento reutilizable</li>
              <li>Campañas de mailing masivo</li>
              <li>Reportes y métricas avanzadas</li>
            </ul>

            {error && <div className={styles.errorBox}>{error}</div>}

            <button className={styles.primaryBtn} onClick={handleBusinessClick} disabled={loading}>
              {loading ? <span className={styles.spinner} /> : "Continuar al pago →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
