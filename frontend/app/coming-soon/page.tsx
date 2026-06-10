"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./coming-soon.module.css";

export default function ComingSoonPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);

    // Por ahora solo simulamos el envío
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSubmitted(true);
    setLoading(false);
  };

  return (
    <div className={styles.page}>
      <div className={styles.blob1} />
      <div className={styles.blob2} />

      {/* Navbar */}
      <nav className={styles.navbar}>
        <button className={styles.logo} onClick={() => router.back()}>
          <span className={styles.logoIcon}>⬡</span>
          <span className={styles.logoText}>CVMind</span>
        </button>
      </nav>

      <main className={styles.main}>
        <div className={`${styles.card} fade-up`}>
          {/* Badge */}
          <span className={styles.tag}>⚡ Plan Pro</span>

          {/* Icon */}
          <div className={styles.iconWrapper}>
            <span className={styles.icon}>🚀</span>
          </div>

          <h1 className={styles.title}>Próximamente</h1>
          <p className={styles.subtitle}>
            Estamos trabajando en el plan Pro para darte acceso ilimitado a análisis de CV, comparación de candidatos y muchas más funcionalidades pensadas para ti.
          </p>

          {/* Features preview */}
          <div className={styles.features}>
            {[
              { icon: "∞", label: "Análisis ilimitados" },
              { icon: "⚖", label: "Comparador de CVs" },
              { icon: "📊", label: "Reportes exportables" },
              { icon: "👥", label: "Dashboard de equipo" },
              { icon: "🎯", label: "Análisis por vacante" },
              { icon: "⚡", label: "Procesamiento en lote" },
            ].map((f) => (
              <div className={styles.feature} key={f.label}>
                <span className={styles.featureIcon}>{f.icon}</span>
                <span>{f.label}</span>
              </div>
            ))}
          </div>

          {/* Email form */}
          {!submitted ? (
            <div className={styles.formSection}>
              <p className={styles.formLabel}>
                Déjanos tu email y te avisamos cuando esté disponible
              </p>
              <form onSubmit={handleSubmit} className={styles.form}>
                <input
                  className={styles.input}
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button className={styles.btn} type="submit" disabled={loading}>
                  {loading ? <span className={styles.spinner} /> : "Notifícame →"}
                </button>
              </form>
            </div>
          ) : (
            <div className={styles.successBox}>
              <span className={styles.successIcon}>✓</span>
              <div>
                <p className={styles.successTitle}>¡Listo! Te tenemos en la lista</p>
                <p className={styles.successDesc}>Te notificaremos en {email} cuando el plan Pro esté disponible.</p>
              </div>
            </div>
          )}

          <button className={styles.backBtn} onClick={() => router.back()}>
            ← Volver al dashboard
          </button>
        </div>
      </main>
    </div>
  );
}
