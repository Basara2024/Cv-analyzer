"use client";
import { useEffect, useState } from "react";
import styles from "./AnalysisLimitBanner.module.css";
import PlanModal from "./PlanModal";

interface LimitBannerProps {
  used: number;
  limit: number;
  plan: string;
  blockedUntil?: string;
  cooldownMinutes?: number;
}

export default function AnalysisLimitBanner({
  used,
  limit,
  plan,
  blockedUntil,
  cooldownMinutes,
}: LimitBannerProps) {
  const [timeLeft, setTimeLeft] = useState("");
  const [showPlanModal, setShowPlanModal] = useState(false);

  useEffect(() => {
    if (!blockedUntil) return;
    const interval = setInterval(() => {
      const diff = new Date(blockedUntil).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("");
        clearInterval(interval);
        return;
      }
      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(`${hours}h ${mins}m`);
    }, 1000);
    return () => clearInterval(interval);
  }, [blockedUntil]);

  if (plan === "pro") return null;

  const remaining = limit - used;
  const percentage = (used / limit) * 100;
  const isBlocked = blockedUntil && new Date(blockedUntil) > new Date();
  const isExhausted = remaining <= 0;
  const barColor =
    percentage >= 100 ? "var(--red)" :
    percentage >= 66 ? "var(--yellow)" :
    "var(--green)";

  if (isBlocked || isExhausted) {
    return (
      <>
        <div className={styles.blockedBanner}>
          <div className={styles.blockedIcon}>🔒</div>
          <div className={styles.blockedContent}>
            <p className={styles.blockedTitle}>Has agotado tus análisis gratuitos</p>
            <p className={styles.blockedDesc}>
              {timeLeft
                ? `Podrás volver a analizar en ${timeLeft}`
                : "Actualiza a Pro para acceso ilimitado"}
            </p>
          </div>
          <button className={styles.upgradeBtn} onClick={() => setShowPlanModal(true)}>
            ⚡ Actualizar a Pro
          </button>
        </div>
        {showPlanModal && <PlanModal onClose={() => setShowPlanModal(false)} />}
      </>
    );
  }

  if (cooldownMinutes && cooldownMinutes > 0) {
    return (
      <div className={styles.cooldownBanner}>
        <span className={styles.cooldownIcon}>⏱</span>
        <p>Debes esperar <strong>{cooldownMinutes} minutos</strong> entre análisis en el plan gratuito.</p>
      </div>
    );
  }

  return (
    <>
      <div className={styles.limitBanner}>
        <div className={styles.limitHeader}>
          <span className={styles.limitLabel}>Análisis gratuitos</span>
          <span className={styles.limitCount} style={{ color: barColor }}>
            {used} / {limit} usados
          </span>
        </div>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${Math.min(percentage, 100)}%`, background: barColor }}
          />
        </div>
        <p className={styles.limitHint}>
          {remaining === 1
            ? "⚠️ Te queda 1 análisis gratuito"
            : `Te quedan ${remaining} análisis gratuitos`}
          {" — "}
          <button className={styles.upgradeLink} onClick={() => setShowPlanModal(true)}>
            Actualiza a Pro
          </button>
          {" para acceso ilimitado"}
        </p>
      </div>
      {showPlanModal && <PlanModal onClose={() => setShowPlanModal(false)} />}
    </>
  );
}
