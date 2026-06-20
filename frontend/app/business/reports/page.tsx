"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import styles from "./reports.module.css";

interface Report {
  funnel: { en_revision: number; entrevista: number; seleccionado: number; descartado: number };
  hiringTime: { overallAvgDays: number; byPosition: { title: string; avgDays: number }[] };
  poolReuseRate: number;
  recruiterPerformance: { name: string; totalAnalizados: number; seleccionados: number }[];
  interviews: {
    totalCompleted: number;
    totalScheduled: number;
    avgScore: number;
    byInterviewer: { name: string; totalEntrevistas: number; promedioEvaluacion: number }[];
  };
}

export default function ReportsPage() {
  const [orgId, setOrgId] = useState<number | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchReport = async (org: number, from = "", to = "") => {
    const params = new URLSearchParams();
    if (from) params.append("from", from);
    if (to) params.append("to", to);
    const res = await api.get(`/organizations/${org}/reports?${params.toString()}`);
    setReport(res.data.report);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const orgRes = await api.get("/organizations/my");
        const org = orgRes.data.organization;
        setOrgId(org.id);
        await fetchReport(org.id);
      } catch (error) {
        console.error("Error fetching reports:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const applyDateFilter = async () => {
    if (!orgId) return;
    setLoading(true);
    await fetchReport(orgId, dateFrom, dateTo);
    setLoading(false);
  };

  const clearDateFilter = async () => {
    setDateFrom(""); setDateTo("");
    if (!orgId) return;
    setLoading(true);
    await fetchReport(orgId);
    setLoading(false);
  };

  if (loading || !report) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Generando reporte...</p>
      </div>
    );
  }

  const funnelTotal = report.funnel.en_revision + report.funnel.entrevista + report.funnel.seleccionado + report.funnel.descartado;
  const maxFunnelValue = Math.max(report.funnel.en_revision, report.funnel.entrevista, report.funnel.seleccionado, report.funnel.descartado, 1);

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Reportes</h1>
          <p className={styles.pageSubtitle}>Métricas de reclutamiento — embudo, tiempos, equipo y entrevistas</p>
        </div>
        <div className={styles.dateFilters}>
          <input className={styles.dateInput} type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <span className={styles.dateDash}>—</span>
          <input className={styles.dateInput} type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          <button className={styles.applyBtn} onClick={applyDateFilter}>Aplicar</button>
          {(dateFrom || dateTo) && <button className={styles.clearBtn} onClick={clearDateFilter}>Limpiar</button>}
        </div>
      </div>

      {/* 1. Embudo de conversión */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Embudo de conversión</h3>
        <p className={styles.cardSubtitle}>De candidato analizado a contratado</p>
        <div className={styles.funnel}>
          {[
            { label: "En revisión", value: report.funnel.en_revision, color: "#fbbf24" },
            { label: "Entrevistados", value: report.funnel.entrevista, color: "#60a5fa" },
            { label: "Seleccionados", value: report.funnel.seleccionado, color: "#22c55e" },
            { label: "Descartados", value: report.funnel.descartado, color: "#ef4444" },
          ].map((stage) => (
            <div key={stage.label} className={styles.funnelRow}>
              <span className={styles.funnelLabel}>{stage.label}</span>
              <div className={styles.funnelBarTrack}>
                <div
                  className={styles.funnelBarFill}
                  style={{ width: `${(stage.value / maxFunnelValue) * 100}%`, background: stage.color }}
                />
              </div>
              <span className={styles.funnelValue}>{stage.value}</span>
            </div>
          ))}
        </div>
        {funnelTotal === 0 && <p className={styles.emptyNote}>Aún no hay candidatos analizados en este rango.</p>}
      </div>

      <div className={styles.grid2}>
        {/* 2. Tiempo de contratación */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Tiempo de contratación</h3>
          <p className={styles.cardSubtitle}>Desde apertura del puesto hasta selección</p>

          <div className={styles.bigMetric}>
            <span className={styles.bigMetricValue}>{report.hiringTime.overallAvgDays}</span>
            <span className={styles.bigMetricLabel}>días en promedio</span>
          </div>

          {report.hiringTime.byPosition.length > 0 ? (
            <div className={styles.miniList}>
              {report.hiringTime.byPosition.map((p, i) => (
                <div key={i} className={styles.miniListRow}>
                  <span className={styles.miniListLabel}>{p.title}</span>
                  <span className={styles.miniListValue}>{p.avgDays} días</span>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.emptyNote}>Aún no hay contrataciones cerradas.</p>
          )}
        </div>

        {/* 3. Reutilización del pool */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Reutilización del pool</h3>
          <p className={styles.cardSubtitle}>Contrataciones a partir de talento ya evaluado</p>

          <div className={styles.gaugeWrapper}>
            <svg viewBox="0 0 120 70" className={styles.gauge}>
              <path d="M10 60 A 50 50 0 0 1 110 60" fill="none" stroke="var(--border)" strokeWidth="10" strokeLinecap="round" />
              <path
                d="M10 60 A 50 50 0 0 1 110 60"
                fill="none"
                stroke="#2563eb"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${(report.poolReuseRate / 100) * 157} 157`}
              />
            </svg>
            <span className={styles.gaugeValue}>{report.poolReuseRate}%</span>
          </div>
          <p className={styles.gaugeHint}>
            {report.poolReuseRate === 0
              ? "Aún no se ha reutilizado talento del pool en una contratación."
              : `${report.poolReuseRate}% de las contrataciones provienen de candidatos reciclados.`}
          </p>
        </div>
      </div>

      {/* 4. Rendimiento por reclutador */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Rendimiento por reclutador</h3>
        <p className={styles.cardSubtitle}>Candidatos analizados y seleccionados por persona</p>

        {report.recruiterPerformance.length === 0 ? (
          <p className={styles.emptyNote}>Aún no hay datos suficientes.</p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr><th>Reclutador</th><th>Analizados</th><th>Seleccionados</th><th>Tasa</th></tr>
              </thead>
              <tbody>
                {report.recruiterPerformance.map((r, i) => (
                  <tr key={i}>
                    <td>{r.name}</td>
                    <td>{r.totalAnalizados}</td>
                    <td>{r.seleccionados}</td>
                    <td>{r.totalAnalizados > 0 ? Math.round((r.seleccionados / r.totalAnalizados) * 100) : 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Evaluación de entrevistas */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Calidad de entrevistas</h3>
        <p className={styles.cardSubtitle}>Evaluación promedio registrada por los entrevistadores</p>

        <div className={styles.interviewStats}>
          <div className={styles.statBox}>
            <span className={styles.statValue}>{report.interviews.totalScheduled}</span>
            <span className={styles.statLabel}>Agendadas</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statValue}>{report.interviews.totalCompleted}</span>
            <span className={styles.statLabel}>Completadas</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statValue}>{report.interviews.avgScore || "—"}</span>
            <span className={styles.statLabel}>Evaluación promedio</span>
          </div>
        </div>

        {report.interviews.byInterviewer.length > 0 && (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr><th>Entrevistador</th><th>Entrevistas</th><th>Evaluación promedio</th></tr>
              </thead>
              <tbody>
                {report.interviews.byInterviewer.map((i, idx) => (
                  <tr key={idx}>
                    <td>{i.name}</td>
                    <td>{i.totalEntrevistas}</td>
                    <td>{"★".repeat(Math.round(i.promedioEvaluacion))} ({i.promedioEvaluacion})</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
