import { useState } from "react";
import LoginForm from "../components/LoginForm";
import RegisterForm from "../components/RegisterForm";
import "./Auth.css";

const Auth = () => {
  const [mode, setMode] = useState("login");

  return (
    <div className="auth-page">
      {/* Background blobs */}
      <div className="auth-page__blob auth-page__blob--1" />
      <div className="auth-page__blob auth-page__blob--2" />

      {/* Left panel - branding */}
      <div className="auth-page__left">
        <div className="auth-page__logo">
          <span className="auth-page__logo-icon">⬡</span>
          <span className="auth-page__logo-text">CVMind</span>
        </div>

        <div className="auth-page__pitch">
          <h1 className="auth-page__headline">
            Tu CV,<br />
            <span className="auth-page__headline--accent">analizado</span><br />
            por IA.
          </h1>
          <p className="auth-page__desc">
            Sube tu CV y recibe feedback detallado en segundos. Mejora tus chances de conseguir el trabajo que quieres.
          </p>
        </div>

        <div className="auth-page__features">
          {[
            { icon: "◈", label: "Análisis en segundos" },
            { icon: "◎", label: "Feedback accionable" },
            { icon: "◆", label: "Puntuación por sección" },
          ].map((f) => (
            <div className="auth-page__feature" key={f.label}>
              <span className="auth-page__feature-icon">{f.icon}</span>
              <span>{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel - form */}
      <div className="auth-page__right">
        <div className="auth-page__card">
          {mode === "login" ? (
            <LoginForm onSwitch={() => setMode("register")} />
          ) : (
            <RegisterForm onSwitch={() => setMode("login")} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
