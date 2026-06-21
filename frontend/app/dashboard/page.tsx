"use client";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import CVHistory from "./components/CVHistory";
import AnalysisLimitBanner from "./components/AnalysisLimitBanner";
import styles from "./dashboard.module.css";
import { MatchiaLogo } from "@/app/components/MatchiaLogo";
import Spinner from "@/app/components/Spinner";

interface Category {
  puntuacion: number;
  feedback: string;
  mejoras: string[];
}

interface Analysis {
  puntuacion_general: number;
  resumen: string;
  categorias: Record<string, Category>;
  fortalezas: string[];
  areas_criticas: string[];
}

interface UserLimits {
  plan: string;
  analysesUsed: number;
  analysesLimit: number;
  blockedUntil?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  formato_presentacion: "Formato y Presentación",
  experiencia_laboral: "Experiencia Laboral",
  educacion: "Educación",
  habilidades: "Habilidades",
  impacto_logros: "Impacto y Logros",
};

const scoreColor = (score: number) =>
  score >= 75 ? "var(--green)" : score >= 50 ? "var(--yellow)" : "var(--red)";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState<"upload" | "history">("upload");
  const [userLimits, setUserLimits] = useState<UserLimits | null>(null);
  const [cooldownMinutes, setCooldownMinutes] = useState(0);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth");
  }, [status, router]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await api.get("/auth/me");
        const user = res.data.user;
        setUserLimits({
          plan: user.plan,
          analysesUsed: user.analysesUsed,
          analysesLimit: user.analysesLimit,
          blockedUntil: user.freeBlockedUntil,
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    if (status === "authenticated") fetchUserData();
  }, [status, refreshTrigger]);

  if (status === "loading") {
    return <div className={styles.loading}><MatchiaLogo /></div>;
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type === "application/pdf") { setFile(dropped); setAnalysis(null); setError(""); }
    else setError("Solo se aceptan archivos PDF.");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected?.type === "application/pdf") { setFile(selected); setAnalysis(null); setError(""); }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    setAnalysis(null);
    setCooldownMinutes(0);

    try {
      const formData = new FormData();
      formData.append("cv", file);
      const res = await api.post("/analyze", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAnalysis(res.data.analysis);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      const data = err.response?.data;
      if (data?.code === "COOLDOWN") {
        setCooldownMinutes(data.waitMinutes);
      } else if (data?.code === "LIMIT_REACHED" || data?.code === "BLOCKED") {
        setRefreshTrigger((prev) => prev + 1);
      }
      setError(data?.message || "Error al analizar el CV.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHistory = async (id: number) => {
    try {
      const res = await api.get(`/analyze/${id}`);
      setAnalysis(res.data.analysis);
      setActiveTab("upload");
    } catch (error) {
      console.error("Error loading analysis:", error);
    }
  };

  const isBlocked = userLimits?.blockedUntil && new Date(userLimits.blockedUntil) > new Date();
  const isExhausted = userLimits && userLimits.analysesUsed >= userLimits.analysesLimit;
  const canAnalyze = !isBlocked && !isExhausted && userLimits?.plan === "pro" || (!isBlocked && !isExhausted);

  return (
    <div className={styles.page}>
      <nav className={styles.navbar}>
        <div className={styles.logo}>
          <MatchiaLogo className={styles.logoIcon} />
          <span className={styles.logoText}>Matchia</span>
        </div>
        <div className={styles.navRight}>
          <div className={styles.user}>
            <div className={styles.avatar}>{session?.user?.name?.[0]?.toUpperCase()}</div>
            <span className={styles.username}>{session?.user?.name}</span>
          </div>
          {userLimits?.plan === "pro" && (
            <span className={styles.proBadge}>⚡ Pro</span>
          )}

          <a href="/business/dashboard" className={styles.businessButton}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            Dashboard Empresarial
          </a>
          <button className={styles.logoutBtn} onClick={() => signOut({ callbackUrl: "/auth" })}>Salir</button>
        </div>
      </nav>

      <main className={styles.main}>
        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === "upload" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("upload")}
          >
            ⬆ Analizar CV
          </button>
          <button
            className={`${styles.tab} ${activeTab === "history" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("history")}
          >
            📋 Historial
          </button>
        </div>

        {activeTab === "upload" && (
          <>
            <div className={`${styles.header} fade-up`}>
              <span className={styles.tag}>Análisis con IA</span>
              <h1 className={styles.title}>
                ¿Listo para mejorar<br />tu <span className={styles.titleAccent}>CV</span>?
              </h1>
              <p className={styles.subtitle}>
                Sube tu CV en PDF y recibirás un análisis detallado con puntuaciones y recomendaciones personalizadas.
              </p>
            </div>

            {/* Banner de límites */}
            {userLimits && (
              <AnalysisLimitBanner
                used={userLimits.analysesUsed}
                limit={userLimits.analysesLimit}
                plan={userLimits.plan}
                blockedUntil={userLimits.blockedUntil}
                cooldownMinutes={cooldownMinutes}
              />
            )}

            <div
              className={`${styles.uploadZone} ${dragging ? styles.dragging : ""} ${file ? styles.filled : ""} ${!canAnalyze ? styles.uploadZoneDisabled : ""} fade-up`}
              onDragOver={(e) => { if (canAnalyze) { e.preventDefault(); setDragging(true); } }}
              onDragLeave={() => setDragging(false)}
              onDrop={canAnalyze ? handleDrop : undefined}
            >
              {file ? (
                <div className={styles.fileInfo}>
                  <span className={styles.fileIcon}>📄</span>
                  <div>
                    <p className={styles.fileName}>{file.name}</p>
                    <p className={styles.fileSize}>{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button className={styles.removeBtn} onClick={() => { setFile(null); setAnalysis(null); }}>✕</button>
                </div>
              ) : (
                <>
                  <div className={styles.uploadIcon}>{canAnalyze ? "⬆" : "🔒"}</div>
                  <p className={styles.uploadText}>
                    {canAnalyze ? "Arrastra tu CV aquí" : "Análisis no disponible"}
                  </p>
                  {canAnalyze && (
                    <>
                      <p className={styles.uploadOr}>o</p>
                      <label className={styles.browseBtn}>
                        Selecciona un archivo
                        <input type="file" accept=".pdf" style={{ display: "none" }} onChange={handleFileChange} />
                      </label>
                      <p className={styles.uploadHint}>Solo PDF · Máx. 10MB</p>
                    </>
                  )}
                </>
              )}
            </div>

            {error && !cooldownMinutes && <div className={styles.errorBox}>{error}</div>}

            <button
              className={`${styles.analyzeBtn} ${(!file || loading || !canAnalyze) ? styles.analyzeBtnDisabled : ""} fade-up`}
              disabled={!file || loading || !canAnalyze}
              onClick={handleAnalyze}
            >
              {loading ? (
                <span className={styles.loadingRow}>
                  <Spinner variant="auth" /> Analizando tu CV...
                </span>
              ) : !canAnalyze ? "Análisis agotados — Actualiza a Pro"
                : file ? "Analizar CV →" : "Sube un PDF para continuar"}
            </button>

            {analysis && (
              <div className={`${styles.results} fade-up`}>
                <div className={styles.resultHeader}>
                  <div className={styles.scoreSection}>
                    <div className={styles.scoreRing}>
                      <svg viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--border)" strokeWidth="2.5" />
                        <circle
                          cx="18" cy="18" r="15.9" fill="none"
                          stroke={scoreColor(analysis.puntuacion_general)}
                          strokeWidth="2.5"
                          strokeDasharray={`${analysis.puntuacion_general} ${100 - analysis.puntuacion_general}`}
                          strokeDashoffset="25"
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className={styles.scoreValue} style={{ color: scoreColor(analysis.puntuacion_general) }}>
                        {analysis.puntuacion_general}
                      </span>
                    </div>
                    <div>
                      <h3 className={styles.scoreTitle}>Puntuación General</h3>
                      <p className={styles.scoreResumen}>{analysis.resumen}</p>
                    </div>
                  </div>
                </div>

                <div className={styles.highlights}>
                  <div className={styles.highlightGreen}>
                    <span className={styles.highlightLabel}>✓ Fortalezas</span>
                    <ul>{analysis.fortalezas?.map((f, i) => <li key={i}>{f}</li>)}</ul>
                  </div>
                  <div className={styles.highlightRed}>
                    <span className={styles.highlightLabel}>⚠ Áreas críticas</span>
                    <ul>{analysis.areas_criticas?.map((a, i) => <li key={i}>{a}</li>)}</ul>
                  </div>
                </div>

                <div className={styles.categories}>
                  <h4 className={styles.categoriesTitle}>Análisis por sección</h4>
                  {Object.entries(analysis.categorias || {}).map(([key, val]) => (
                    <div key={key} className={styles.categoryCard}>
                      <div className={styles.categoryHeader}>
                        <span className={styles.categoryName}>{CATEGORY_LABELS[key] || key}</span>
                        <span className={styles.categoryScore} style={{ color: scoreColor(val.puntuacion) }}>
                          {val.puntuacion}/100
                        </span>
                      </div>
                      <div className={styles.categoryBar}>
                        <div className={styles.categoryBarFill} style={{ width: `${val.puntuacion}%`, background: scoreColor(val.puntuacion) }} />
                      </div>
                      <p className={styles.categoryFeedback}>{val.feedback}</p>
                      <ul className={styles.mejoras}>
                        {val.mejoras?.map((m, i) => (
                          <li key={i}><span className={styles.mejoraIcon}>→</span>{m}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "history" && (
          <CVHistory onSelect={handleSelectHistory} refreshTrigger={refreshTrigger} />
        )}
      </main>
    </div>
  );
}
