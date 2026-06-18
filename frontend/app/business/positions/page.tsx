"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import styles from "./positions.module.css";
import { exportPositionToPDF, exportPositionToText } from "./exportPosition";

interface Position {
  id: number;
  title: string;
  description: string;
  requirements?: string;
  salary_range?: string;
  location?: string;
  status: "active" | "paused" | "closed";
  created_at: string;
  _count?: { candidates: number };
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  active: { label: "Activo", className: "badgeGreen" },
  paused: { label: "Pausado", className: "badgeYellow" },
  closed: { label: "Cerrado", className: "badgeGray" },
};

export default function PositionsPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "paused" | "closed">("all");
  const [exportMenuOpen, setExportMenuOpen] = useState<number | null>(null);
  const [orgName, setOrgName] = useState<string>("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    requirements: "",
    salary_range: "",
    location: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const orgRes = await api.get("/organizations/my");
        const org = orgRes.data.organization;
        setOrgId(org.id);
        setOrgName(org.name || "");

        const posRes = await api.get(`/organizations/${org.id}/positions`);
        setPositions(posRes.data.positions || []);
      } catch (error) {
        console.error("Error fetching positions:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const resetForm = () => {
    setForm({ title: "", description: "", requirements: "", salary_range: "", location: "" });
    setEditingPosition(null);
    setError("");
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (position: Position) => {
    setForm({
      title: position.title,
      description: position.description,
      requirements: position.requirements || "",
      salary_range: position.salary_range || "",
      location: position.location || "",
    });
    setEditingPosition(position);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId || !form.title || !form.description) {
      setError("Título y descripción son obligatorios.");
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      if (editingPosition) {
        const res = await api.put(`/organizations/${orgId}/positions/${editingPosition.id}`, form);
        setPositions((prev) =>
          prev.map((p) => (p.id === editingPosition.id ? { ...p, ...res.data.position } : p))
        );
      } else {
        const res = await api.post(`/organizations/${orgId}/positions`, form);
        setPositions((prev) => [res.data.position, ...prev]);
      }
      setShowModal(false);
      resetForm();
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al guardar el puesto.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (position: Position, newStatus: string) => {
    if (!orgId) return;
    try {
      await api.put(`/organizations/${orgId}/positions/${position.id}`, { status: newStatus });
      setPositions((prev) =>
        prev.map((p) => (p.id === position.id ? { ...p, status: newStatus as Position["status"] } : p))
      );
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleDelete = async (position: Position) => {
    if (!orgId) return;
    if (!confirm(`¿Eliminar el puesto "${position.title}"? Esta acción no se puede deshacer.`)) return;
    try {
      await api.delete(`/organizations/${orgId}/positions/${position.id}`);
      setPositions((prev) => prev.filter((p) => p.id !== position.id));
    } catch (error) {
      console.error("Error deleting position:", error);
    }
  };

  const filteredPositions = positions.filter((p) => filter === "all" || p.status === filter);

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Cargando puestos...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Puestos de Trabajo</h1>
          <p className={styles.pageSubtitle}>Gestiona vacantes activas, pausadas y cerradas</p>
        </div>
        <button className={styles.primaryBtn} onClick={openCreateModal}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nueva vacante
        </button>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        {[
          { key: "all", label: "Todas" },
          { key: "active", label: "Activas" },
          { key: "paused", label: "Pausadas" },
          { key: "closed", label: "Cerradas" },
        ].map((f) => (
          <button
            key={f.key}
            className={`${styles.filterBtn} ${filter === f.key ? styles.filterBtnActive : ""}`}
            onClick={() => setFilter(f.key as any)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Positions grid */}
      {filteredPositions.length === 0 ? (
        <div className={styles.emptyState}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2"/>
            <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
          </svg>
          <p>No hay vacantes {filter !== "all" ? STATUS_LABELS[filter]?.label.toLowerCase() : ""}</p>
          <button className={styles.emptyLink} onClick={openCreateModal}>Crear primera vacante</button>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredPositions.map((position) => (
            <div key={position.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>{position.title}</h3>
                <span className={`${styles.badge} ${styles[STATUS_LABELS[position.status]?.className]}`}>
                  {STATUS_LABELS[position.status]?.label}
                </span>
              </div>

              {position.location && (
                <p className={styles.cardMeta}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  {position.location}
                </p>
              )}

              <p className={styles.cardDescription}>{position.description}</p>

              <div className={styles.cardFooter}>
                <div className={styles.candidateCount}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  </svg>
                  {position._count?.candidates || 0} candidatos
                </div>
                <div className={styles.cardActions}>
                  <select
                    className={styles.statusSelect}
                    value={position.status}
                    onChange={(e) => handleStatusChange(position, e.target.value)}
                  >
                    <option value="active">Activo</option>
                    <option value="paused">Pausado</option>
                    <option value="closed">Cerrado</option>
                  </select>
                  <button className={styles.iconBtn} onClick={() => openEditModal(position)} title="Editar">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button className={styles.iconBtnDanger} onClick={() => handleDelete(position)} title="Eliminar">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                  <div className={styles.exportWrapper}>
                    <button
                      className={styles.iconBtn}
                      title="Exportar"
                      onClick={() => setExportMenuOpen(exportMenuOpen === position.id ? null : position.id)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                    </button>
                    {exportMenuOpen === position.id && (
                      <div className={styles.exportMenu}>
                        <button
                          className={styles.exportOption}
                          onClick={() => { exportPositionToPDF(position, orgName); setExportMenuOpen(null); }}
                        >
                          Exportar como PDF
                        </button>
                        <button
                          className={styles.exportOption}
                          onClick={() => { exportPositionToText(position, orgName); setExportMenuOpen(null); }}
                        >
                          Exportar como texto
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <a href={`/business/candidates?position=${position.id}`} className={styles.viewCandidatesLink}>
                Ver candidatos →
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editingPosition ? "Editar vacante" : "Nueva vacante"}
              </h2>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Título del puesto *</label>
                <input
                  className={styles.input}
                  type="text"
                  placeholder="Ej: Backend Developer Senior"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Ubicación</label>
                  <input
                    className={styles.input}
                    type="text"
                    placeholder="Ej: Bogotá, remoto"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Rango salarial</label>
                  <input
                    className={styles.input}
                    type="text"
                    placeholder="Ej: $3M - $5M COP"
                    value={form.salary_range}
                    onChange={(e) => setForm({ ...form, salary_range: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Descripción del puesto *</label>
                <textarea
                  className={styles.textarea}
                  placeholder="Describe las responsabilidades, el equipo, el contexto del rol..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={4}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Competencias requeridas</label>
                <textarea
                  className={styles.textarea}
                  placeholder="Ej: Java, Spring Boot, SQL, liderazgo de equipos, comunicación..."
                  value={form.requirements}
                  onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                  rows={3}
                />
                <p className={styles.hint}>La IA usará esto para evaluar y rankear a los candidatos.</p>
              </div>

              {error && <div className={styles.errorBox}>{error}</div>}

              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.submitBtn} disabled={submitting}>
                  {submitting ? <span className={styles.btnSpinner} /> : editingPosition ? "Guardar cambios" : "Crear vacante"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
