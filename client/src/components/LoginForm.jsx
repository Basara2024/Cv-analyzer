import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./AuthForms.css";

const LoginForm = ({ onSwitch }) => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/home");
    } catch (err) {
      setError(err.response?.data?.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form fade-up">
      <div className="auth-form__header">
        <span className="auth-form__tag">Bienvenido de vuelta</span>
        <h2 className="auth-form__title">Inicia sesión</h2>
        <p className="auth-form__subtitle">Analiza tu CV con inteligencia artificial</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form__fields">
        <div className="field">
          <label className="field__label">Email</label>
          <input
            className="field__input"
            type="email"
            placeholder="tu@email.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>

        <div className="field">
          <label className="field__label">Contraseña</label>
          <input
            className="field__input"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </div>

        {error && <div className="auth-form__error">{error}</div>}

        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? <span className="spinner" /> : "Entrar →"}
        </button>
      </form>

      <p className="auth-form__switch">
        ¿No tienes cuenta?{" "}
        <button className="auth-form__switch-btn" onClick={onSwitch}>
          Regístrate
        </button>
      </p>
    </div>
  );
};

export default LoginForm;
