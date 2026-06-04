import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./AuthForms.css";

const RegisterForm = ({ onSwitch }) => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate("/home");
    } catch (err) {
      setError(err.response?.data?.message || "Error al registrarse");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form fade-up">
      <div className="auth-form__header">
        <span className="auth-form__tag">Nuevo por aquí</span>
        <h2 className="auth-form__title">Crea tu cuenta</h2>
        <p className="auth-form__subtitle">Empieza a mejorar tu CV hoy</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form__fields">
        <div className="field">
          <label className="field__label">Nombre</label>
          <input
            className="field__input"
            type="text"
            placeholder="Tu nombre"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>

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
            placeholder="Mínimo 6 caracteres"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </div>

        {error && <div className="auth-form__error">{error}</div>}

        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? <span className="spinner" /> : "Crear cuenta →"}
        </button>
      </form>

      <p className="auth-form__switch">
        ¿Ya tienes cuenta?{" "}
        <button className="auth-form__switch-btn" onClick={onSwitch}>
          Inicia sesión
        </button>
      </p>
    </div>
  );
};

export default RegisterForm;
