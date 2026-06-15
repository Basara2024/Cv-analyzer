"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import styles from "./dashboard.module.css";

interface KPI {
  label: string;
  value: string | number;
  change?: string;
  positive?: boolean;
  icon: React.ReactNode;
}

interface TopPosition {
  title: string;
  candidates: number;
  status: string;
}

interface Alert {
  type: "warning" | "info" | "success";
  message: string;
}

const KPICard = ({ kpi }: { kpi: KPI }) => (
  <div className={styles.kpiCard}>
    <div className={styles.kpiHeader}>
      <span className={styles.kpiIcon}>{kpi.icon}</span>
      {kpi.change && (
        <span className={`${styles.kpiChange} ${kpi.positive ? styles.kpiChangeUp : styles.kpiChangeDown}`}>
          {kpi.positive ? "↑" : "↓"} {kpi.change}
        </span>
      )}
    </div>
    <p className={styles.kpiValue}>{kpi.value}</p>
    <p className={styles.kpiLabel}>{kpi.label}</p>
  </div>
);

export default function BusinessDashboard() {
  const [org, setOrg] = useState<any>(null);
  const [stats, setStats] = useState({
    totalCandidates: 0,
    activePositions: 0,
    avgHiringDays: 0,
    conversionRate: 0,
  });
  const [topPositions, setTopPositions] = useState<TopPosition[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const orgRes = await api.get("/organizations/my");
        const organization = orgRes.data.organization;
        setOrg(organization);

        const posRes = await api.get(`/organizations/${organization.id}/positions`);
        const positions = posRes.data.positions || [];

        const candRes = await api.get(`/organizations/${organization.id}/candidates`);
        const candidates = candRes.data.candidates || [];

        const activePos = positions.filter((p: any) => p.status === "active");
        const selected = candidates.filter((c: any) => c.status === "seleccionado");
        const convRate = candidates.length > 0
          ? Math.round((selected.length / candidates.length) * 100)
          : 0;

        setStats({
          totalCandidates: candidates.length,
          activePositions: activePos.length,
          avgHiringDays: 18,
          conversionRate: convRate,
        });

        setTopPositions(
          positions.slice(0, 5).map((p: any) => ({
            title: p.title,
            candidates: p._count?.candidates || 0,
            status: p.status,
          }))
        );

        const newAlerts: Alert[] = [];
        activePos.forEach((p: any) => {
          if ((p._count?.candidates || 0) === 0) {
            newAlerts.push({ type: "warning", message: `Puesto "${p.title}" sin candidatos` });
          }
        });
        setAlerts(newAlerts.slice(0, 3));

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const kpis: KPI[] = [
    {
      label: "Candidatos analizados",
      value: stats.totalCandidates.toLocaleString(),
      change: "12%",
      positive: true,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
    },
    {
      label: "Vacantes activas",
      value: stats.activePositions,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2"/>
          <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
        </svg>
      ),
    },
    {
      label: "Tiempo promedio de contratación",
      value: `${stats.avgHiringDays} días`,
      change: "3 días",
      positive: false,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      ),
    },
    {
      label: "Tasa de conversión",
      value: `${stats.conversionRate}%`,
      change: "2%",
      positive: true,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
          <polyline points="17 6 23 6 23 12"/>
        </svg>
      ),
    },
  ];

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner} />
        <p>Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Page header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Vista Ejecutiva</h1>
          <p className={styles.pageSubtitle}>
            {new Date().toLocaleDateString("es", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <button className={styles.primaryBtn} onClick={() => window.location.href = "/business/positions"}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nueva vacante
        </button>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className={styles.alertsSection}>
          {alerts.map((alert, i) => (
            <div key={i} className={`${styles.alert} ${styles[`alert${alert.type.charAt(0).toUpperCase() + alert.type.slice(1)}`]}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {alert.message}
            </div>
          ))}
        </div>
      )}

      {/* KPIs */}
      <div className={styles.kpiGrid}>
        {kpis.map((kpi) => (
          <KPICard key={kpi.label} kpi={kpi} />
        ))}
      </div>

      {/* Bottom grid */}
      <div className={styles.bottomGrid}>
        {/* Top positions */}
        <div className={styles.widget}>
          <div className={styles.widgetHeader}>
            <h3 className={styles.widgetTitle}>Top Vacantes</h3>
            <a href="/business/positions" className={styles.widgetLink}>Ver todas</a>
          </div>
          {topPositions.length > 0 ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Puesto</th>
                  <th>Candidatos</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {topPositions.map((pos, i) => (
                  <tr key={i}>
                    <td>{pos.title}</td>
                    <td>{pos.candidates}</td>
                    <td>
                      <span className={`${styles.badge} ${pos.status === "active" ? styles.badgeGreen : styles.badgeGray}`}>
                        {pos.status === "active" ? "Activo" : pos.status === "paused" ? "Pausado" : "Cerrado"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className={styles.emptyWidget}>
              <p>No hay vacantes activas</p>
              <a href="/business/positions" className={styles.emptyLink}>Crear primera vacante</a>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className={styles.widget}>
          <div className={styles.widgetHeader}>
            <h3 className={styles.widgetTitle}>Acciones rápidas</h3>
          </div>
          <div className={styles.quickActions}>
            {[
              { label: "Subir CVs masivo", href: "/business/candidates", icon: "↑" },
              { label: "Nueva vacante", href: "/business/positions", icon: "+" },
              { label: "Ver pool de talento", href: "/business/pool", icon: "◎" },
              { label: "Agendar entrevista", href: "/business/interviews", icon: "▷" },
              { label: "Nueva campaña", href: "/business/campaigns", icon: "✉" },
              { label: "Ver reportes", href: "/business/reports", icon: "▦" },
            ].map((action) => (
              <a key={action.label} href={action.href} className={styles.quickAction}>
                <span className={styles.quickActionIcon}>{action.icon}</span>
                <span>{action.label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
