"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import styles from "./coming-soon.module.css";

const features = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20M2 12h20"/>
      </svg>
    ),
    label: "Análisis ilimitados",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="9" height="18" rx="2"/><rect x="13" y="3" width="9" height="18" rx="2"/>
      </svg>
    ),
    label: "Comparador de CVs",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
    label: "Reportes exportables",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    label: "Dashboard de equipo",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    label: "Análisis por vacante",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
        <polyline points="17 6 23 6 23 12"/>
      </svg>
    ),
    label: "Procesamiento en lote",
  },
];

export default function ComingSoonPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", interest: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.interest) return;
    setLoading(true);
    setError("");

    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/waitlist`, {
        email: form.email,
        name: form.name,
        interest: form.interest,
      });
      setSubmitted(true);
    } catch (err: any) {
      if (err.response?.data?.alreadyRegistered) {
        setSubmitted(true);
      } else {
        setError(err.response?.data?.message || "Error al registrarte. Intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.blob1} />
      <div className={styles.blob2} />

      <nav className={styles.navbar}>
        <button className={styles.logo} onClick={() => router.back()}>
          <span className={styles.logoIcon}>⬡</span>
          <span className={styles.logoText}>Matchia</span>
        </button>
      </nav>

      <main className={styles.main}>
        <div className={`${styles.card} fade-up`}>
          <span className={styles.tag}>Plan Pro</span>

          <div className={styles.iconWrapper}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent-bright)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
          </div>

          <h1 className={styles.title}>Próximamente</h1>
          <p className={styles.subtitle}>
            Estamos trabajando en el plan Pro para darte acceso ilimitado a análisis de CV, comparación de candidatos y funcionalidades pensadas para reclutadores y empresas.
          </p>

          <div className={styles.features}>
            {features.map((f) => (
              <div className={styles.feature} key={f.label}>
                <span className={styles.featureIcon}>{f.icon}</span>
                <span>{f.label}</span>
              </div>
            ))}
          </div>

          {!submitted ? (
            <div className={styles.formSection}>
              <p className={styles.formLabel}>
                Déjanos tus datos y te avisamos cuando esté disponible
              </p>
              <form onSubmit={handleSubmit} className={styles.form}>
                <input
                  className={styles.input}
                  type="text"
                  placeholder="Tu nombre"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
                <input
                  className={styles.input}
                  type="email"
                  placeholder="tu@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
                <select
                  className={styles.select}
                  value={form.interest}
                  onChange={(e) => setForm({ ...form, interest: e.target.value })}
                  required
                >
                  <option value="">¿Cuál es tu interés?</option>
                  <option value="personal">Personal — quiero mejorar mi CV</option>
                  <option value="empresarial">Empresarial — quiero analizar candidatos</option>
                </select>
                <button className={styles.btn} type="submit" disabled={loading}>
                  {loading ? <span className={styles.spinner} /> : "Notifícame"}
                </button>
              </form>
              {error && <p className={styles.error}>{error}</p>}
            </div>
          ) : (
            <div className={styles.successBox}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <div>
                <p className={styles.successTitle}>¡Listo! Te tenemos en la lista</p>
                <p className={styles.successDesc}>Te notificaremos en {form.email} cuando el plan Pro esté disponible.</p>
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
