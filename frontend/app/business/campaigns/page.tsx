"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import Spinner from "@/app/components/Spinner";
import styles from "./campaigns.module.css";

interface Position {
  id: number;
  title: string;
  status: string;
}

interface Candidate {
  id: number;
  name: string;
  email?: string;
  individual_score?: number;
  analysis_result?: any;
}

interface Campaign {
  id: number;
  subject: string;
  body: string;
  status: "draft" | "sent" | "failed";
  total_sent: number;
  sent_at?: string;
  created_at: string;
  job_positions?: { title: string };
  _count?: { campaign_recipients: number };
}

export default function CampaignsPage() {
  const [orgId, setOrgId] = useState<number | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [suggested, setSuggested] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [selectedPosition, setSelectedPosition] = useState("");
  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([]);
  const [subject, setSubject] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [creating, setCreating] = useState(false);
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const orgRes = await api.get("/organizations/my");
        const org = orgRes.data.organization;
        setOrgId(org.id);

        const [campRes, posRes] = await Promise.all([
          api.get(`/organizations/${org.id}/campaigns`),
          api.get(`/organizations/${org.id}/positions`),
        ]);
        setCampaigns(campRes.data.campaigns || []);
        setPositions((posRes.data.positions || []).filter((p: Position) => p.status === "active"));
      } catch (error) {
        console.error("Error fetching campaigns:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const openModal = async () => {
    setStep(1);
    setSelectedPosition("");
    setSelectedCandidates([]);
    setSubject("");
    setCustomMessage("");
    setFormError("");
    setShowModal(true);

    if (orgId) {
      try {
        const res = await api.get(`/organizations/${orgId}/campaigns/suggested-candidates`);
        setSuggested(res.data.candidates || []);
      } catch (error) {
        console.error("Error fetching suggested candidates:", error);
      }
    }
  };

  const toggleCandidate = (id: number) => {
    setSelectedCandidates((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : prev.length < 30 ? [...prev, id] : prev
    );
  };

  const goToStep2 = () => {
    if (!selectedPosition) {
      setFormError("Selecciona el puesto que estás promocionando.");
      return;
    }
    const position = positions.find((p) => p.id === parseInt(selectedPosition));
    setSubject(`Nueva oportunidad: ${position?.title || ""}`);
    setFormError("");
    setStep(2);
  };

  const goToStep3 = () => {
    if (selectedCandidates.length === 0) {
      setFormError("Selecciona al menos un candidato.");
      return;
    }
    setFormError("");
    setStep(3);
  };

  const handleCreateAndSend = async () => {
    if (!orgId || !subject) {
      setFormError("El asunto es obligatorio.");
      return;
    }
    setCreating(true);
    setFormError("");
    try {
      const res = await api.post(`/organizations/${orgId}/campaigns`, {
        job_position_id: selectedPosition,
        subject,
        custom_message: customMessage,
        candidate_ids: selectedCandidates,
      });

      const campaignId = res.data.campaign.id;
      await api.post(`/organizations/${orgId}/campaigns/${campaignId}/send`);

      const campRes = await api.get(`/organizations/${orgId}/campaigns`);
      setCampaigns(campRes.data.campaigns || []);
      setShowModal(false);
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Error al enviar la campaña.");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spinner variant="page" />
        <p>Cargando campañas...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Campañas</h1>
          <p className={styles.pageSubtitle}>Reconecta con candidatos de procesos anteriores para nuevas vacantes</p>
        </div>
        <button className={styles.primaryBtn} onClick={openModal} disabled={positions.length === 0}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.8a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
          Nueva campaña
        </button>
      </div>

      {positions.length === 0 && (
        <div className={styles.warningBox}>
          Necesitas al menos una vacante activa para crear una campaña.
        </div>
      )}

      {campaigns.length === 0 ? (
        <div className={styles.emptyState}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.8a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
          <p>No hay campañas todavía</p>
          <p className={styles.emptyHint}>Envía la oferta de una nueva vacante a candidatos descartados de procesos similares</p>
        </div>
      ) : (
        <div className={styles.list}>
          {campaigns.map((campaign) => (
            <div key={campaign.id} className={styles.card}>
              <div className={styles.cardLeft}>
                <h3 className={styles.cardSubject}>{campaign.subject}</h3>
                <p className={styles.cardMeta}>
                  {campaign.job_positions?.title || "Sin puesto"} · {campaign._count?.campaign_recipients || 0} destinatarios
                </p>
              </div>
              <div className={styles.cardRight}>
                <span className={`${styles.badge} ${campaign.status === "sent" ? styles.badgeGreen : styles.badgeGray}`}>
                  {campaign.status === "sent" ? `Enviada (${campaign.total_sent})` : "Borrador"}
                </span>
                {campaign.sent_at && (
                  <span className={styles.dateLabel}>{new Date(campaign.sent_at).toLocaleDateString("es")}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create campaign modal — 3 steps */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => !creating && setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle}>Nueva campaña</h2>
                <div className={styles.steps}>
                  <span className={`${styles.stepDot} ${step >= 1 ? styles.stepDotActive : ""}`}>1. Puesto</span>
                  <span className={`${styles.stepDot} ${step >= 2 ? styles.stepDotActive : ""}`}>2. Candidatos</span>
                  <span className={`${styles.stepDot} ${step >= 3 ? styles.stepDotActive : ""}`}>3. Mensaje</span>
                </div>
              </div>
              {!creating && (
                <button className={styles.closeBtn} onClick={() => setShowModal(false)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>

            <div className={styles.modalBody}>
              {/* Step 1: Select position */}
              {step === 1 && (
                <>
                  <p className={styles.stepHint}>¿Qué vacante quieres promocionar entre los candidatos descartados?</p>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Puesto de trabajo *</label>
                    <select className={styles.input} value={selectedPosition} onChange={(e) => setSelectedPosition(e.target.value)}>
                      <option value="">Selecciona una vacante activa</option>
                      {positions.map((p) => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                      ))}
                    </select>
                  </div>
                  {formError && <div className={styles.errorBox}>{formError}</div>}
                  <div className={styles.modalFooter}>
                    <button className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancelar</button>
                    <button className={styles.nextBtn} onClick={goToStep2}>Siguiente</button>
                  </div>
                </>
              )}

              {/* Step 2: Select candidates */}
              {step === 2 && (
                <>
                  <p className={styles.stepHint}>Mejores candidatos descartados (máx. 30) — selecciona a quién enviarle la oferta</p>
                  <div className={styles.candidateList}>
                    {suggested.length === 0 ? (
                      <p className={styles.noSuggested}>No hay candidatos descartados con email registrado todavía.</p>
                    ) : (
                      suggested.map((c) => (
                        <label key={c.id} className={styles.candidateRow}>
                          <input
                            type="checkbox"
                            checked={selectedCandidates.includes(c.id)}
                            onChange={() => toggleCandidate(c.id)}
                          />
                          <div className={styles.candidateRowInfo}>
                            <span className={styles.candidateRowName}>{c.name}</span>
                            <span className={styles.candidateRowEmail}>{c.email}</span>
                          </div>
                          {c.individual_score && <span className={styles.candidateRowScore}>{c.individual_score}/100</span>}
                        </label>
                      ))
                    )}
                  </div>
                  <p className={styles.selectedCount}>{selectedCandidates.length} de 30 seleccionados</p>
                  {formError && <div className={styles.errorBox}>{formError}</div>}
                  <div className={styles.modalFooter}>
                    <button className={styles.cancelBtn} onClick={() => setStep(1)}>Atrás</button>
                    <button className={styles.nextBtn} onClick={goToStep3}>Siguiente</button>
                  </div>
                </>
              )}

              {/* Step 3: Message */}
              {step === 3 && (
                <>
                  <p className={styles.stepHint}>Plantilla predefinida — personaliza el asunto y agrega un mensaje opcional</p>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Asunto del correo</label>
                    <input className={styles.input} type="text" value={subject} onChange={(e) => setSubject(e.target.value)} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Mensaje adicional (opcional)</label>
                    <textarea
                      className={styles.textarea}
                      placeholder="Agrega contexto adicional sobre la posición..."
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <div className={styles.previewBox}>
                    <p className={styles.previewLabel}>Vista previa de la plantilla</p>
                    <div className={styles.previewContent}>
                      <p>Hola <strong>[Nombre del candidato]</strong>,</p>
                      <p>En <strong>tu empresa</strong> recordamos tu perfil de procesos anteriores y queremos contarte que tenemos una nueva oportunidad que podría interesarte:</p>
                      <p className={styles.previewPosition}>{positions.find((p) => p.id === parseInt(selectedPosition))?.title}</p>
                      {customMessage && <p>{customMessage}</p>}
                      <p>Si te interesa retomar el proceso, simplemente responde a este correo.</p>
                    </div>
                  </div>
                  {formError && <div className={styles.errorBox}>{formError}</div>}
                  <div className={styles.modalFooter}>
                    <button className={styles.cancelBtn} onClick={() => setStep(2)}>Atrás</button>
                    <button className={styles.submitBtn} onClick={handleCreateAndSend} disabled={creating}>
                      {creating ? <Spinner variant="button" /> : `Enviar a ${selectedCandidates.length} candidatos`}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
