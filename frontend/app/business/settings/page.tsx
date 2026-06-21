"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import styles from "./settings.module.css";

interface Organization {
  id: number;
  name: string;
  nit?: string;
  economic_activity?: string;
  country?: string;
  city?: string;
  size?: string;
  created_at: string;
}

export default function SettingsPage() {
  const [orgId, setOrgId] = useState<number | null>(null);
  const [myRole, setMyRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"company" | "security" | "billing">("company");

  // Company form
  const [companyForm, setCompanyForm] = useState({
    name: "", nit: "", economic_activity: "", country: "", city: "", size: "",
  });
  const [orgCreatedAt, setOrgCreatedAt] = useState("");
  const [savingCompany, setSavingCompany] = useState(false);
  const [companyMessage, setCompanyMessage] = useState({ type: "", text: "" });

  // Password form
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const orgRes = await api.get("/organizations/my");
        const org: Organization = orgRes.data.organization;
        setOrgId(org.id);
        setMyRole(orgRes.data.role);
        setOrgCreatedAt(org.created_at);
        setCompanyForm({
          name: org.name || "",
          nit: org.nit || "",
          economic_activity: org.economic_activity || "",
          country: org.country || "",
          city: org.city || "",
          size: org.size || "",
        });
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const canEditCompany = myRole === "owner" || myRole === "admin";

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return;
    setSavingCompany(true);
    setCompanyMessage({ type: "", text: "" });
    try {
      await api.put(`/organizations/${orgId}/settings`, companyForm);
      setCompanyMessage({ type: "success", text: "Datos de la empresa actualizados correctamente." });
    } catch (err: any) {
      setCompanyMessage({ type: "error", text: err.response?.data?.message || "Error al guardar los cambios." });
    } finally {
      setSavingCompany(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage({ type: "", text: "" });

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({ type: "error", text: "Las contraseñas nuevas no coinciden." });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordMessage({ type: "error", text: "La nueva contraseña debe tener al menos 6 caracteres." });
      return;
    }

    setSavingPassword(true);
    try {
      await api.put("/auth/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordMessage({ type: "success", text: "Contraseña actualizada correctamente." });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      setPasswordMessage({ type: "error", text: err.response?.data?.message || "Error al cambiar la contraseña." });
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Cargando configuración...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Configuración</h1>
        <p className={styles.pageSubtitle}>Datos de la empresa, seguridad y plan de suscripción</p>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${activeTab === "company" ? styles.tabActive : ""}`} onClick={() => setActiveTab("company")}>
          Empresa
        </button>
        <button className={`${styles.tab} ${activeTab === "security" ? styles.tabActive : ""}`} onClick={() => setActiveTab("security")}>
          Seguridad
        </button>
        <button className={`${styles.tab} ${activeTab === "billing" ? styles.tabActive : ""}`} onClick={() => setActiveTab("billing")}>
          Plan y facturación
        </button>
      </div>

      {/* Company tab */}
      {activeTab === "company" && (
        <div className={styles.card}>
          {!canEditCompany && (
            <div className={styles.infoBanner}>
              Solo los administradores pueden editar los datos de la empresa. Puedes verlos en modo lectura.
            </div>
          )}
          <form onSubmit={handleCompanySubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Razón social *</label>
              <input
                className={styles.input}
                type="text"
                value={companyForm.name}
                onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                disabled={!canEditCompany}
                required
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>NIT</label>
                <input
                  className={styles.input}
                  type="text"
                  value={companyForm.nit}
                  onChange={(e) => setCompanyForm({ ...companyForm, nit: e.target.value })}
                  disabled={!canEditCompany}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Actividad económica</label>
                <input
                  className={styles.input}
                  type="text"
                  value={companyForm.economic_activity}
                  onChange={(e) => setCompanyForm({ ...companyForm, economic_activity: e.target.value })}
                  disabled={!canEditCompany}
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>País</label>
                <input
                  className={styles.input}
                  type="text"
                  value={companyForm.country}
                  onChange={(e) => setCompanyForm({ ...companyForm, country: e.target.value })}
                  disabled={!canEditCompany}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Ciudad</label>
                <input
                  className={styles.input}
                  type="text"
                  value={companyForm.city}
                  onChange={(e) => setCompanyForm({ ...companyForm, city: e.target.value })}
                  disabled={!canEditCompany}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Tamaño de la empresa</label>
              <select
                className={styles.input}
                value={companyForm.size}
                onChange={(e) => setCompanyForm({ ...companyForm, size: e.target.value })}
                disabled={!canEditCompany}
              >
                <option value="">Selecciona un tamaño</option>
                <option value="micro">Micro (1-10 empleados)</option>
                <option value="pequeña">Pequeña (11-50 empleados)</option>
                <option value="mediana">Mediana (51-200 empleados)</option>
                <option value="grande">Grande (200+ empleados)</option>
              </select>
            </div>

            {companyMessage.text && (
              <div className={companyMessage.type === "success" ? styles.successBox : styles.errorBox}>
                {companyMessage.text}
              </div>
            )}

            {canEditCompany && (
              <button type="submit" className={styles.submitBtn} disabled={savingCompany}>
                {savingCompany ? <span className={styles.btnSpinner} /> : "Guardar cambios"}
              </button>
            )}
          </form>
        </div>
      )}

      {/* Security tab */}
      {activeTab === "security" && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Cambiar contraseña</h3>
          <p className={styles.cardSubtitle}>Si iniciaste sesión con Google, Twitter o LinkedIn, esta sección no aplica para ti.</p>

          <form onSubmit={handlePasswordSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Contraseña actual</label>
              <input
                className={styles.input}
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Nueva contraseña</label>
              <input
                className={styles.input}
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                required
                minLength={6}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Confirmar nueva contraseña</label>
              <input
                className={styles.input}
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                required
                minLength={6}
              />
            </div>

            {passwordMessage.text && (
              <div className={passwordMessage.type === "success" ? styles.successBox : styles.errorBox}>
                {passwordMessage.text}
              </div>
            )}

            <button type="submit" className={styles.submitBtn} disabled={savingPassword}>
              {savingPassword ? <span className={styles.btnSpinner} /> : "Actualizar contraseña"}
            </button>
          </form>
        </div>
      )}

      {/* Billing tab */}
      {activeTab === "billing" && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Plan actual</h3>
          <div className={styles.planBox}>
            <div className={styles.planInfo}>
              <span className={styles.planBadge}>Business</span>
              <span className={styles.planPrice}>$30 USD / mes</span>
            </div>
            <div className={styles.planDetails}>
              <div className={styles.planDetailRow}>
                <span className={styles.planDetailLabel}>Empresa desde</span>
                <span className={styles.planDetailValue}>
                  {orgCreatedAt ? new Date(orgCreatedAt).toLocaleDateString("es", { year: "numeric", month: "long", day: "numeric" }) : "—"}
                </span>
              </div>
              <div className={styles.planDetailRow}>
                <span className={styles.planDetailLabel}>Estado</span>
                <span className={styles.planDetailValue}>
                  <span className={styles.activeDot} /> Activo
                </span>
              </div>
            </div>
          </div>
          <p className={styles.billingNote}>
            La gestión de pagos en línea estará disponible próximamente. Por ahora, el plan se administra manualmente.
          </p>
        </div>
      )}
    </div>
  );
}
