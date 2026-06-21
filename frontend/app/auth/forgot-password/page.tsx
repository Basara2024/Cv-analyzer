"use client";
import { useState } from "react";
import Link from "next/link";
import axios from "axios";
import styles from "../auth.module.css";
import { MatchiaLogo } from "@/app/components/MatchiaLogo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`, { email });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al procesar la solicitud.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.blob1} />
      <div className={styles.blob2} />

      <div className={styles.right}>
        <div className={styles.card}>
          <Link href="/" className={styles.cardLogo}>
            <MatchiaLogo className={styles.logoIcon} />
            <span className={styles.logoText}>Matchia</span>
          </Link>

          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>Recuperar contraseña</h2>
            <p className={styles.formSubtitle}>
              {submitted
                ? "Revisa tu bandeja de entrada"
                : "Ingresa tu correo y te enviaremos un enlace de recuperación"}
            </p>
          </div>

          {!submitted ? (
            <form onSubmit={handleSubmit} className={styles.fields}>
              <div className={styles.field}>
                <label className={styles.label}>Email</label>
                <input
                  className={styles.input}
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {error && <div className={styles.error}>{error}</div>}

              <button className={styles.btnPrimary} type="submit" disabled={loading}>
                {loading ? <span className={styles.spinner} /> : "Enviar enlace →"}
              </button>
            </form>
          ) : (
            <p className={styles.formSubtitle}>
              Si <strong>{email}</strong> está registrado, recibirás un correo en los próximos minutos.
            </p>
          )}

          <p className={styles.switch}>
            <Link href="/auth" className={styles.switchBtn}>← Volver al inicio de sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
