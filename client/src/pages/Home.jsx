import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import ResultCard from "../components/ResultCard";
import "./Home.css";

const Home = () => {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState("");

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type === "application/pdf") {
      setFile(dropped);
      setAnalysis(null);
      setError("");
    } else {
      setError("Solo se aceptan archivos PDF.");
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected?.type === "application/pdf") {
      setFile(selected);
      setAnalysis(null);
      setError("");
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    setAnalysis(null);

    try {
      const formData = new FormData();
      formData.append("cv", file);

      const res = await api.post("/analyze", formData);

      setAnalysis(res.data.analysis);
      if (res.data.user) setUser(res.data.user);
    } catch (err) {
      setError(err.response?.data?.message || "Error al analizar el CV. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar__logo">
          <span className="navbar__logo-icon">⬡</span>
          <span className="navbar__logo-text">CVMind</span>
        </div>
        <div className="navbar__right">
          <div className="navbar__user">
            <div className="navbar__avatar">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <span className="navbar__username">{user?.name}</span>
          </div>
          <button className="navbar__logout" onClick={handleLogout}>Salir</button>
        </div>
      </nav>

      <main className="home__main">
        <div className="home__header fade-up">
          <span className="home__tag">Análisis con IA</span>
          <h1 className="home__title">
            ¿Listo para mejorar<br />tu <span className="home__title--accent">CV</span>?
          </h1>
          <p className="home__subtitle">
            Sube tu CV en PDF y recibirás un análisis detallado con puntuaciones y recomendaciones personalizadas.
          </p>
        </div>

        {/* Upload zone */}
        <div
          className={`upload-zone fade-up ${dragging ? "upload-zone--dragging" : ""} ${file ? "upload-zone--filled" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          style={{ animationDelay: "0.1s" }}
        >
          {file ? (
            <div className="upload-zone__file">
              <span className="upload-zone__file-icon">📄</span>
              <div>
                <p className="upload-zone__file-name">{file.name}</p>
                <p className="upload-zone__file-size">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button className="upload-zone__remove" onClick={() => { setFile(null); setAnalysis(null); }}>✕</button>
            </div>
          ) : (
            <>
              <div className="upload-zone__icon">⬆</div>
              <p className="upload-zone__text">Arrastra tu CV aquí</p>
              <p className="upload-zone__subtext">o</p>
              <label className="upload-zone__browse">
                Selecciona un archivo
                <input type="file" accept=".pdf" style={{ display: "none" }} onChange={handleFileChange} />
              </label>
              <p className="upload-zone__hint">Solo PDF · Máx. 10MB</p>
            </>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="home__error fade-in">{error}</div>
        )}

        {/* Analyze button */}
        <button
          className={`btn-analyze fade-up ${!file || loading ? "btn-analyze--disabled" : ""}`}
          disabled={!file || loading}
          onClick={handleAnalyze}
          style={{ animationDelay: "0.2s" }}
        >
          {loading ? (
            <span className="home__loading">
              <span className="spinner" />
              Analizando tu CV...
            </span>
          ) : file ? "Analizar CV →" : "Sube un PDF para continuar"}
        </button>

        {/* Resultado */}
        {analysis && <ResultCard analysis={analysis} />}

        {/* Stats */}
        <div className="home__stats fade-up" style={{ animationDelay: "0.3s" }}>
          <div className="stat-card">
            <span className="stat-card__value">{user?.analysisCount ?? 0}</span>
            <span className="stat-card__label">Análisis realizados</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__value">
              {user?.lastAnalysis ? new Date(user.lastAnalysis).toLocaleDateString() : "—"}
            </span>
            <span className="stat-card__label">Último análisis</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__value">∞</span>
            <span className="stat-card__label">Análisis disponibles</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
