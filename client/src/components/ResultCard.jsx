import "./ResultCard.css";

const ScoreRing = ({ score }) => {
  const color =
    score >= 75 ? "var(--green)" :
    score >= 50 ? "var(--yellow)" :
    "var(--red)";

  return (
    <div className="score-ring" style={{ "--score-color": color }}>
      <svg viewBox="0 0 36 36" className="score-ring__svg">
        <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--border)" strokeWidth="2.5" />
        <circle
          cx="18" cy="18" r="15.9"
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeDasharray={`${score} ${100 - score}`}
          strokeDashoffset="25"
          strokeLinecap="round"
        />
      </svg>
      <span className="score-ring__value" style={{ color }}>{score}</span>
    </div>
  );
};

const CategoryCard = ({ name, data }) => {
  const labels = {
    formato_presentacion: "Formato y Presentación",
    experiencia_laboral: "Experiencia Laboral",
    educacion: "Educación",
    habilidades: "Habilidades",
    impacto_logros: "Impacto y Logros",
  };

  const color =
    data.puntuacion >= 75 ? "var(--green)" :
    data.puntuacion >= 50 ? "var(--yellow)" :
    "var(--red)";

  return (
    <div className="category-card">
      <div className="category-card__header">
        <span className="category-card__name">{labels[name] || name}</span>
        <span className="category-card__score" style={{ color }}>
          {data.puntuacion}/100
        </span>
      </div>
      <div className="category-card__bar">
        <div
          className="category-card__bar-fill"
          style={{ width: `${data.puntuacion}%`, background: color }}
        />
      </div>
      <p className="category-card__feedback">{data.feedback}</p>
      {data.mejoras?.length > 0 && (
        <ul className="category-card__mejoras">
          {data.mejoras.map((m, i) => (
            <li key={i} className="category-card__mejora">
              <span className="category-card__mejora-icon">→</span>
              {m}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const ResultCard = ({ analysis }) => {
  if (!analysis) return null;

  return (
    <div className="result-card fade-up">
      {/* Header con puntuación general */}
      <div className="result-card__header">
        <div className="result-card__score-section">
          <ScoreRing score={analysis.puntuacion_general} />
          <div>
            <h3 className="result-card__title">Puntuación General</h3>
            <p className="result-card__resumen">{analysis.resumen}</p>
          </div>
        </div>
      </div>

      {/* Fortalezas y áreas críticas */}
      <div className="result-card__highlights">
        <div className="highlight-box highlight-box--green">
          <span className="highlight-box__label">✓ Fortalezas</span>
          <ul>
            {analysis.fortalezas?.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>
        <div className="highlight-box highlight-box--red">
          <span className="highlight-box__label">⚠ Áreas críticas</span>
          <ul>
            {analysis.areas_criticas?.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Categorías */}
      <div className="result-card__categories">
        <h4 className="result-card__section-title">Análisis por sección</h4>
        <div className="result-card__categories-grid">
          {Object.entries(analysis.categorias || {}).map(([key, val]) => (
            <CategoryCard key={key} name={key} data={val} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResultCard;
