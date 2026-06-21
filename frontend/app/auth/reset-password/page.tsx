"use client";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import styles from "../auth.module.css";
import { MatchiaLogo } from "@/app/components/MatchiaLogo";
import Spinner from "@/app/components/Spinner";

function ResetPasswordInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (newPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (!token) {
      setError("Enlace inválido. Solicita uno nuevo.");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password`, { token, newPassword });
      setSuccess(true);
      setTimeout(() => router.push("/auth?mode=login"), 2500);
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al restablecer la contraseña.");
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
            <h2 className={styles.formTitle}>
              {!token ? "Enlace inválido" : success ? "¡Listo!" : "Nueva contraseña"}
            </h2>
            <p className={styles.formSubtitle}>
              {!token
                ? "El enlace de recuperación no es válido o ya fue usado."
                : success
                ? "Tu contraseña fue actualizada. Te redirigiremos al inicio de sesión..."
                : "Ingresa tu nueva contraseña"}
            </p>
          </div>

          {!token ? (
            <p className={styles.switch}>
              <Link href="/auth/forgot-password" className={styles.switchBtn}>Solicitar un nuevo enlace</Link>
            </p>
          ) : !success ? (
            <form onSubmit={handleSubmit} className={styles.fields}>
              <div className={styles.field}>
                <label className={styles.label}>Nueva contraseña</label>
                <input
                  className={styles.input}
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Confirmar contraseña</label>
                <input
                  className={styles.input}
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              {error && <div className={styles.error}>{error}</div>}

              <button className={styles.btnPrimary} type="submit" disabled={loading}>
                {loading ? <Spinner variant="auth" /> : "Restablecer contraseña →"}
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordInner />
    </Suspense>
  );
}
