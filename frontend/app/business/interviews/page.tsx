"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import styles from "./interviews.module.css";

interface Candidate {
  id: number;
  name: string;
  email?: string;
  file_name: string;
  individual_score?: number;
  ranking_score?: number;
  analysis_result?: any;
}

interface Member {
  id: number;
  role: string;
  users: { id: number; name: string; email: string };
}

interface Position {
  id: number;
  title: string;
}

interface Interview {
  id: number;
  candidate_id: number;
  job_position_id?: number;
  interviewer_id: number;
  interview_type: "rh" | "manager" | "tecnica";
  scheduled_at: string;
  duration_minutes: number;
  notes_before?: string;
  feedback?: string;
  evaluation_score?: number;
  status: "pendiente" | "realizada" | "cancelada";
  candidates: Candidate;
  job_positions?: Position;
  users_interviews_interviewer_idTousers: { id: number; name: string; email: string };
}

const TYPE_LABELS: Record<string, string> = {
  rh: "Recursos Humanos",
  manager: "Manager / Jefe",
  tecnica: "Entrevista Técnica",
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pendiente: { label: "Pendiente", className: "badgeYellow" },
  realizada: { label: "Realizada", className: "badgeGreen" },
  cancelada: { label: "Cancelada", className: "badgeRed" },
};

export default function InterviewsPage() {
  const [orgId, setOrgId] = useState<number | null>(null);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState<"list" | "mine">("list");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const [form, setForm] = useState({
    candidate_id: "",
    job_position_id: "",
    interviewer_id: "",
    interview_type: "rh",
    scheduled_at: "",
    duration_minutes: "30",
    notes_before: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [feedbackForm, setFeedbackForm] = useState({
    feedback: "",
    evaluation_score: "",
    status: "realizada",
  });
  const [savingFeedback, setSavingFeedback] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const orgRes = await api.get("/organizations/my");
        const org = orgRes.data.organization;
        setOrgId(org.id);

        const [intRes, candRes, membRes, posRes] = await Promise.all([
          api.get(`/organizations/${org.id}/interviews`),
          api.get(`/organizations/${org.id}/candidates`),
          api.get(`/organizations/${org.id}/members`),
          api.get(`/organizations/${org.id}/positions`),
        ]);

        setInterviews(intRes.data.interviews || []);
        setCandidates(candRes.data.candidates || []);
        setMembers(membRes.data.members || []);
        setPositions(posRes.data.positions || []);
      } catch (error) {
        console.error("Error fetching interviews:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const resetForm = () => {
    setForm({ candidate_id: "", job_position_id: "", interviewer_id: "", interview_type: "rh", scheduled_at: "", duration_minutes: "30", notes_before: "" });
    setFormError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId || !form.candidate_id || !form.interviewer_id || !form.scheduled_at) {
      setFormError("Candidato, entrevistador y fecha son obligatorios.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      const res = await api.post(`/organizations/${orgId}/interviews`, {
        ...form,
        candidate_id: parseInt(form.candidate_id),
        interviewer_id: parseInt(form.interviewer_id),
        job_position_id: form.job_position_id ? parseInt(form.job_position_id) : null,
        duration_minutes: parseInt(form.duration_minutes),
      });
      setInterviews((prev) => [res.data.interview, ...prev]);
      setShowModal(false);
      resetForm();
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Error al agendar la entrevista.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (interview: Interview, newStatus: string) => {
    if (!orgId) return;
    try {
      await api.put(`/organizations/${orgId}/interviews/${interview.id}`, { status: newStatus });
      setInterviews((prev) => prev.map((i) => i.id === interview.id ? { ...i, status: newStatus as Interview["status"] } : i));
      if (selectedInterview?.id === interview.id) setSelectedInterview({ ...selectedInterview, status: newStatus as Interview["status"] });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId || !selectedInterview) return;
    setSavingFeedback(true);
    try {
      await api.put(`/organizations/${orgId}/interviews/${selectedInterview.id}`, {
        feedback: feedbackForm.feedback,
        evaluation_score: feedbackForm.evaluation_score ? parseInt(feedbackForm.evaluation_score) : null,
        status: feedbackForm.status,
      });
      setInterviews((prev) => prev.map((i) => i.id === selectedInterview.id ? { ...i, feedback: feedbackForm.feedback, evaluation_score: feedbackForm.evaluation_score ? parseInt(feedbackForm.evaluation_score) : undefined, status: feedbackForm.status as Interview["status"] } : i));
      setShowFeedbackModal(false);
      setSelectedInterview(null);
    } catch (error) {
      console.error("Error saving feedback:", error);
    } finally {
      setSavingFeedback(false);
    }
  };

  const handleDelete = async (interview: Interview) => {
    if (!orgId) return;
    if (!confirm(`¿Cancelar la entrevista con ${interview.candidates?.name}?`)) return;
    try {
      await api.delete(`/organizations/${orgId}/interviews/${interview.id}`);
      setInterviews((prev) => prev.filter((i) => i.id !== interview.id));
    } catch (error) {
      console.error("Error deleting interview:", error);
    }
  };

  const filteredInterviews = interviews.filter((i) => {
    if (filterStatus !== "all" && i.status !== filterStatus) return false;
    return true;
  });

  const pendingCount = interviews.filter((i) => i.status === "pendiente").length;

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Cargando entrevistas...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>
            Entrevistas
            {pendingCount > 0 && <span className={styles.pendingBadge}>{pendingCount} pendientes</span>}
          </h1>
          <p className={styles.pageSubtitle}>Agenda, asigna entrevistadores y registra feedback</p>
        </div>
        <button className={styles.primaryBtn} onClick={() => { resetForm(); setShowModal(true); }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Agendar entrevista
        </button>
      </div>

      {/* Filters */}
      <div className={styles.filtersRow}>
        {["all", "pendiente", "realizada", "cancelada"].map((s) => (
          <button
            key={s}
            className={`${styles.filterBtn} ${filterStatus === s ? styles.filterBtnActive : ""}`}
            onClick={() => setFilterStatus(s)}
          >
            {s === "all" ? "Todas" : STATUS_CONFIG[s]?.label}
          </button>
        ))}
      </div>

      {/* Interviews list */}
      {filteredInterviews.length === 0 ? (
        <div className={styles.emptyState}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <p>No hay entrevistas {filterStatus !== "all" ? STATUS_CONFIG[filterStatus]?.label.toLowerCase() + "s" : "agendadas"}</p>
          <button className={styles.emptyLink} onClick={() => { resetForm(); setShowModal(true); }}>Agendar primera entrevista</button>
        </div>
      ) : (
        <div className={styles.interviewsList}>
          {filteredInterviews.map((interview) => {
            const date = new Date(interview.scheduled_at);
            return (
              <div key={interview.id} className={styles.interviewCard}>
                {/* Date column */}
                <div className={styles.dateColumn}>
                  <span className={styles.dateDay}>{date.getDate()}</span>
                  <span className={styles.dateMonth}>{date.toLocaleString("es", { month: "short" }).toUpperCase()}</span>
                  <span className={styles.dateTime}>{date.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>

                {/* Info column */}
                <div className={styles.infoColumn}>
                  <div className={styles.interviewTopRow}>
                    <h3 className={styles.candidateName}>{interview.candidates?.name || "Candidato"}</h3>
                    <span className={`${styles.badge} ${styles[STATUS_CONFIG[interview.status]?.className]}`}>
                      {STATUS_CONFIG[interview.status]?.label}
                    </span>
                  </div>

                  <div className={styles.interviewMeta}>
                    <span className={styles.metaItem}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                      </svg>
                      {interview.users_interviews_interviewer_idTousers?.name || "Sin asignar"}
                    </span>
                    <span className={styles.metaItem}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                      </svg>
                      {interview.duration_minutes} min
                    </span>
                    <span className={styles.typeTag}>{TYPE_LABELS[interview.interview_type]}</span>
                    {interview.job_positions && (
                      <span className={styles.metaItem}>{interview.job_positions.title}</span>
                    )}
                  </div>

                  {interview.candidates?.email && (
                    <p className={styles.candidateEmail}>{interview.candidates.email}</p>
                  )}

                  {interview.notes_before && (
                    <p className={styles.notesPreview}>📋 {interview.notes_before}</p>
                  )}

                  {interview.feedback && (
                    <p className={styles.feedbackPreview}>💬 {interview.feedback}</p>
                  )}
                </div>

                {/* Actions column */}
                <div className={styles.actionsColumn}>
                  <select
                    className={styles.statusSelect}
                    value={interview.status}
                    onChange={(e) => handleStatusChange(interview, e.target.value)}
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="realizada">Realizada</option>
                    <option value="cancelada">Cancelada</option>
                  </select>

                  <button
                    className={styles.actionBtn}
                    title="Ver detalle / Agregar feedback"
                    onClick={() => { setSelectedInterview(interview); setFeedbackForm({ feedback: interview.feedback || "", evaluation_score: String(interview.evaluation_score || ""), status: interview.status }); setShowFeedbackModal(true); }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>

                  <button
                    className={styles.actionBtnDanger}
                    title="Eliminar"
                    onClick={() => handleDelete(interview)}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Agendar entrevista</h2>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Candidato *</label>
                <select className={styles.input} value={form.candidate_id} onChange={(e) => setForm({ ...form, candidate_id: e.target.value })} required>
                  <option value="">Selecciona un candidato</option>
                  {candidates.map((c) => (
                    <option key={c.id} value={c.id}>{c.name || c.file_name}</option>
                  ))}
                </select>
              </div>

              {/* Candidate info preview */}
              {form.candidate_id && (() => {
                const cand = candidates.find((c) => c.id === parseInt(form.candidate_id));
                if (!cand) return null;
                return (
                  <div className={styles.candidatePreview}>
                    <div className={styles.previewRow}>
                      <span className={styles.previewLabel}>Email:</span>
                      <span className={styles.previewValue}>{cand.email || "No registrado"}</span>
                    </div>
                    <div className={styles.previewRow}>
                      <span className={styles.previewLabel}>Score IA:</span>
                      <span className={styles.previewValue}>{cand.individual_score || "—"}/100</span>
                    </div>
                    {cand.analysis_result?.habilidades_clave?.length > 0 && (
                      <div className={styles.previewRow}>
                        <span className={styles.previewLabel}>Skills:</span>
                        <span className={styles.previewValue}>{cand.analysis_result.habilidades_clave.slice(0, 3).join(", ")}</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Tipo de entrevista *</label>
                  <select className={styles.input} value={form.interview_type} onChange={(e) => setForm({ ...form, interview_type: e.target.value })}>
                    <option value="rh">Recursos Humanos</option>
                    <option value="manager">Manager / Jefe</option>
                    <option value="tecnica">Técnica</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Duración (min)</label>
                  <select className={styles.input} value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}>
                    <option value="30">30 minutos</option>
                    <option value="45">45 minutos</option>
                    <option value="60">1 hora</option>
                    <option value="90">1.5 horas</option>
                    <option value="120">2 horas</option>
                  </select>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Entrevistador *</label>
                  <select className={styles.input} value={form.interviewer_id} onChange={(e) => setForm({ ...form, interviewer_id: e.target.value })} required>
                    <option value="">Selecciona un entrevistador</option>
                    {members.map((m) => (
                      <option key={m.users.id} value={m.users.id}>{m.users.name} ({m.role})</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Puesto relacionado</label>
                  <select className={styles.input} value={form.job_position_id} onChange={(e) => setForm({ ...form, job_position_id: e.target.value })}>
                    <option value="">Sin puesto específico</option>
                    {positions.map((p) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Fecha y hora *</label>
                <input
                  className={styles.input}
                  type="datetime-local"
                  value={form.scheduled_at}
                  onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Notas previas para el entrevistador</label>
                <textarea
                  className={styles.textarea}
                  placeholder="Qué evaluar, puntos clave, contexto del candidato..."
                  value={form.notes_before}
                  onChange={(e) => setForm({ ...form, notes_before: e.target.value })}
                  rows={3}
                />
              </div>

              {formError && <div className={styles.errorBox}>{formError}</div>}

              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className={styles.submitBtn} disabled={submitting}>
                  {submitting ? <span className={styles.btnSpinner} /> : "Agendar entrevista"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && selectedInterview && (
        <div className={styles.modalOverlay} onClick={() => setShowFeedbackModal(false)}>
          <div className={styles.detailModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle}>Detalle de entrevista</h2>
                <p className={styles.modalSubtitle}>{selectedInterview.candidates?.name} · {TYPE_LABELS[selectedInterview.interview_type]}</p>
              </div>
              <button className={styles.closeBtn} onClick={() => setShowFeedbackModal(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className={styles.detailBody}>
              {/* Candidate info */}
              <div className={styles.candidateInfoBox}>
                <h4 className={styles.sectionTitle}>Información del candidato</h4>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Nombre</span>
                    <span className={styles.infoValue}>{selectedInterview.candidates?.name}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Email</span>
                    <span className={styles.infoValue}>{selectedInterview.candidates?.email || "No registrado"}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Score IA</span>
                    <span className={styles.infoValue}>{selectedInterview.candidates?.individual_score || "—"}/100</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Ranking</span>
                    <span className={styles.infoValue}>
                      {selectedInterview.candidates?.ranking_score ? "★".repeat(selectedInterview.candidates.ranking_score) : "—"}
                    </span>
                  </div>
                </div>

                {selectedInterview.candidates?.analysis_result?.resumen && (
                  <p className={styles.candidateSummary}>{selectedInterview.candidates.analysis_result.resumen}</p>
                )}

                {selectedInterview.candidates?.analysis_result?.habilidades_clave?.length > 0 && (
                  <div className={styles.skillTags}>
                    {selectedInterview.candidates.analysis_result.habilidades_clave.map((s: string, i: number) => (
                      <span key={i} className={styles.skillTag}>{s}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes before */}
              {selectedInterview.notes_before && (
                <div className={styles.detailSection}>
                  <h4 className={styles.sectionTitle}>Notas del reclutador</h4>
                  <p className={styles.detailText}>{selectedInterview.notes_before}</p>
                </div>
              )}

              {/* Feedback form */}
              <form onSubmit={handleFeedbackSubmit} className={styles.feedbackForm}>
                <h4 className={styles.sectionTitle}>Feedback post-entrevista</h4>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Estado</label>
                  <select className={styles.input} value={feedbackForm.status} onChange={(e) => setFeedbackForm({ ...feedbackForm, status: e.target.value })}>
                    <option value="pendiente">Pendiente</option>
                    <option value="realizada">Realizada</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Evaluación general</label>
                  <div className={styles.starRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={`${styles.starBtn} ${parseInt(feedbackForm.evaluation_score) >= star ? styles.starActive : ""}`}
                        onClick={() => setFeedbackForm({ ...feedbackForm, evaluation_score: String(star) })}
                      >★</button>
                    ))}
                    {feedbackForm.evaluation_score && (
                      <button type="button" className={styles.clearStar} onClick={() => setFeedbackForm({ ...feedbackForm, evaluation_score: "" })}>✕</button>
                    )}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Notas del entrevistador</label>
                  <textarea
                    className={styles.textarea}
                    placeholder="¿Cómo fue la entrevista? Puntos fuertes, debilidades observadas, recomendación..."
                    value={feedbackForm.feedback}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, feedback: e.target.value })}
                    rows={4}
                  />
                </div>

                <div className={styles.modalFooter}>
                  <button type="button" className={styles.cancelBtn} onClick={() => setShowFeedbackModal(false)}>Cerrar</button>
                  <button type="submit" className={styles.submitBtn} disabled={savingFeedback}>
                    {savingFeedback ? <span className={styles.btnSpinner} /> : "Guardar feedback"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
