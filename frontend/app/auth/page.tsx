"use client";
import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { RECAPTCHA_ENABLED, useRecaptchaToken } from "@/lib/recaptcha";
import styles from "./auth.module.css";
import { MatchiaLogo } from "@/app/components/MatchiaLogo";

function AuthPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Priorizamos el registro: solo abrimos en login si la URL lo pide explícitamente.
  const [mode, setMode] = useState<"login" | "register">(
    searchParams.get("mode") === "login" ? "login" : "register"
  );
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { ready: recaptchaReady, getToken: getRecaptchaToken } = useRecaptchaToken();

  const registerBlockedByRecaptcha =
    mode === "register" && RECAPTCHA_ENABLED && !recaptchaReady;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "register") {
        let recaptchaToken = "";

        if (RECAPTCHA_ENABLED) {
          recaptchaToken = await getRecaptchaToken("register");
        }

        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
          name: form.name,
          email: form.email,
          password: form.password,
          recaptchaToken,
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
    } catch (err: unknown) {
      let message = "Error. Intenta de nuevo.";
      if (axios.isAxiosError(err)) {
        message = err.response?.data?.message || message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const socialProviders = [
    {
      id: "linkedin",
      label: "Continuar con LinkedIn",
      recommended: true,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A66C2">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      ),
    },
    {
      id: "google",
      label: "Continuar con Google",
      recommended: false,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      ),
    },
    {
      id: "twitter",
      label: "Continuar con X",
      recommended: false,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
    },
  ];

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
              {mode === "login" ? "Inicia sesión" : "Crea tu cuenta"}
            </h2>
            <p className={styles.formSubtitle}>
              {mode === "login" ? "Analiza tu CV con IA" : "Empieza a mejorar tu CV hoy"}
            </p>
          </div>

          {/* Social buttons */}
          <div className={styles.socialButtons}>
            {socialProviders.map((provider) => (
              <button
                key={provider.id}
                className={`${styles.btnSocial} ${provider.recommended ? styles.btnSocialRecommended : ""}`}
                onClick={() => signIn(provider.id, { callbackUrl: "/dashboard" })}
              >
                {provider.icon}
                {provider.label}
                {provider.recommended && (
                  <span className={styles.recommendedBadge}>Recomendado</span>
                )}
              </button>
            ))}
          </div>

          <div className={styles.divider}>
            <span>o usa tu email</span>
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
              {mode === "login" && (
                <Link href="/auth/forgot-password" className={styles.forgotLink}>
                  ¿Olvidaste tu contraseña?
                </Link>
              )}
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <button
              className={styles.btnPrimary}
              type="submit"
              disabled={loading || registerBlockedByRecaptcha}
            >
              {loading ? (
                <span className={styles.spinner} />
              ) : registerBlockedByRecaptcha ? (
                "Preparando verificación..."
              ) : mode === "login" ? (
                "Entrar →"
              ) : (
                "Crear cuenta →"
              )}
            </button>
          </form>

          <p className={styles.switch}>
            {mode === "login" ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
            <button
              className={styles.switchBtn}
              onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
            >
              {mode === "login" ? "Regístrate" : "Inicia sesión"}
            </button>
          </p>

          <p className={styles.privacy}>
            Al continuar aceptas nuestras{" "}
            <a href="/privacy" target="_blank">Políticas de Privacidad</a>
            {mode === "register" && (
              <>
                . Este sitio está protegido por reCAPTCHA y aplican la{" "}
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
                  Política de Privacidad
                </a>{" "}
                y los{" "}
                <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer">
                  Términos de Servicio
                </a>{" "}
                de Google.
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthPageInner />
    </Suspense>
  );
}
