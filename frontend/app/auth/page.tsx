"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import styles from "./auth.module.css";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "register") {
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
          name: form.name,
          email: form.email,
          password: form.password,
        });
      }

      const res = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (res?.error) {
        setError("Credenciales incorrectas.");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Error. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.blob1} />
      <div className={styles.blob2} />

      {/* Left panel */}
      <div className={styles.left}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>⬡</span>
          <span className={styles.logoText}>CVMind</span>
        </div>
        <div className={styles.pitch}>
          <h1 className={styles.headline}>
            Tu CV,<br />
            <span className={styles.headlineAccent}>analizado</span><br />
            por IA.
          </h1>
          <p className={styles.desc}>
            Sube tu CV y recibe feedback detallado en segundos. Mejora tus chances de conseguir el trabajo que quieres.
          </p>
        </div>
        <div className={styles.features}>
          {[
            { icon: "◈", label: "Análisis en segundos" },
            { icon: "◎", label: "Feedback accionable" },
            { icon: "◆", label: "Puntuación por sección" },
          ].map((f) => (
            <div className={styles.feature} key={f.label}>
              <span className={styles.featureIcon}>{f.icon}</span>
              <span>{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className={styles.right}>
        <div className={styles.card}>
          <div className={styles.formHeader}>
            <span className={styles.tag}>
              {mode === "login" ? "Bienvenido de vuelta" : "Nuevo por aquí"}
            </span>
            <h2 className={styles.formTitle}>
              {mode === "login" ? "Inicia sesión" : "Crea tu cuenta"}
            </h2>
            <p className={styles.formSubtitle}>
              {mode === "login" ? "Analiza tu CV con IA" : "Empieza a mejorar tu CV hoy"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className={styles.fields}>
            {mode === "register" && (
              <div className={styles.field}>
                <label className={styles.label}>Nombre</label>
                <input
                  className={styles.input}
                  type="text"
                  placeholder="Tu nombre"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
            )}
            <div className={styles.field}>
              <label className={styles.label}>Email</label>
              <input
                className={styles.input}
                type="email"
                placeholder="tu@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Contraseña</label>
              <input
                className={styles.input}
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <button className={styles.btnPrimary} type="submit" disabled={loading}>
              {loading ? <span className={styles.spinner} /> : mode === "login" ? "Entrar →" : "Crear cuenta →"}
            </button>
          </form>

          {/* Divider */}
          <div className={styles.divider}>
            <span>o continúa con</span>
          </div>

          {/* Social login */}
          <button
            className={styles.btnGoogle}
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar con Google
          </button>

          <p className={styles.switch}>
            {mode === "login" ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
            <button
              className={styles.switchBtn}
              onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
            >
              {mode === "login" ? "Regístrate" : "Inicia sesión"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
