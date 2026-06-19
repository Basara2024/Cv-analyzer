"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import styles from "./pool.module.css";

interface Position {
  id: number;
  title: string;
  status: string;
}

interface Candidate {
  id: number;
  name: string;
  email?: string;
  file_name: string;
  individual_score?: number;
  ranking_score?: number;
  status: string;
  analysis_result?: any;
  job_positions?: { id: number; title: string };
  candidate_notes?: { content: string; users?: { name: string }; created_at: string }[];
}

export default function PoolPage() {
  const [orgId, setOrgId] = useState<number | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [nivelFilter, setNivelFilter] = useState("");
  const [minExperience, setMinExperience] = useState("");

  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [targetPosition, setTargetPosition] = useState("");
  const [moving, setMoving] = useState(false);

  const fetchPool = async (org: number, filters: Record<string, string> = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
    const res = await api.get(`/organizations/${org}/pool?${params.toString()}`);
    setCandidates(res.data.candidates || []);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const orgRes = await api.get("/organizations/my");
        const org = orgRes.data.organization;
        setOrgId(org.id);

        const posRes = await api.get(`/organizations/${org.id}/positions`);
        setPositions((posRes.data.positions || []).filter((p: Position) => p.status === "active"));

        await fetchPool(org.id);
      } catch (error) {
        console.error("Error fetching pool:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const applyFilters = async () => {
    if (!orgId) return;
    setLoading(true);
    await fetchPool(orgId, { search, skill: skillFilter, nivel: nivelFilter, min_experience: minExperience });
    setLoading(false);
  };

  const clearFilters = async () => {
    setSearch(""); setSkillFilter(""); setNivelFilter(""); setMinExperience("");
    if (!orgId) return;
    setLoading(true);
    await fetchPool(orgId);
    setLoading(false);
  };

  const handleAddToPosition = async () => {
    if (!orgId || !selectedCandidate || !targetPosition) return;
    setMoving(true);
    try {
      await api.put(`/organizations/${orgId}/candidates/${selectedCandidate.id}/add-to-position`, {
        job_position_id: targetPosition,
      });
      setCandidates((prev) => prev.filter((c) => c.id !== selectedCandidate.id));
      setShowAddModal(false);
      setSelectedCandidate(null);
      setTargetPosition("");
    } catch (error) {
      console.error("Error adding to position:", error);
    } finally {
      setMoving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Cargando pool de talento...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Pool de Talento</h1>
          <p className={styles.pageSubtitle}>Base de talento reutilizable — candidatos analizados disponibles para futuras vacantes</p>
        </div>
        <span className={styles.totalBadge}>{candidates.length} candidatos</span>
      </div>

      {/* Filters */}
      <div className={styles.filtersBox}>
        <div className={styles.filtersGrid}>
          <input
            className={styles.filterInput}
            type="text"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <input
            className={styles.filterInput}
            type="text"
            placeholder="Skill (ej: Python, Excel...)"
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
          />
          <select className={styles.filterInput} value={nivelFilter} onChange={(e) => setNivelFilter(e.target.value)}>
            <option value="">Cualquier nivel</option>
            <option value="junior">Junior</option>
            <option value="mid">Mid</option>
            <option value="senior">Senior</option>
          </select>
          <input
            className={styles.filterInput}
            type="number"
            placeholder="Años exp. mínima"
            value={minExperience}
            onChange={(e) => setMinExperience(e.target.value)}
          />
        </div>
        <div className={styles.filterActions}>
          <button className={styles.applyBtn} onClick={applyFilters}>Aplicar filtros</button>
          <button className={styles.clearBtn} onClick={clearFilters}>Limpiar</button>
        </div>
      </div>

      {/* Candidates grid */}
      {candidates.length === 0 ? (
        <div className={styles.emptyState}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx="12" cy="5" rx="9" ry="3"/>
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
          </svg>
          <p>No hay candidatos en el pool con estos filtros</p>
          <p className={styles.emptyHint}>Los candidatos descartados de análisis anteriores aparecerán aquí automáticamente</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {candidates.map((candidate) => (
            <div key={candidate.id} className={styles.card} onClick={() => setSelectedCandidate(candidate)}>
              <div className={styles.cardHeader}>
                <div className={styles.avatar}>{candidate.name?.[0]?.toUpperCase() || "?"}</div>
                <div className={styles.cardHeaderInfo}>
                  <h3 className={styles.cardName}>{candidate.name || candidate.file_name}</h3>
                  {candidate.email && <p className={styles.cardEmail}>{candidate.email}</p>}
                </div>
              </div>

              {candidate.analysis_result?.resumen && (
                <p className={styles.cardSummary}>{candidate.analysis_result.resumen}</p>
              )}

              <div className={styles.cardMetaRow}>
                {candidate.individual_score && (
                  <span className={styles.metaTag}>Score: {candidate.individual_score}/100</span>
                )}
                {candidate.analysis_result?.nivel && (
                  <span className={styles.metaTag}>{candidate.analysis_result.nivel}</span>
                )}
                {candidate.analysis_result?.experiencia_anos !== undefined && (
                  <span className={styles.metaTag}>{candidate.analysis_result.experiencia_anos} años exp.</span>
                )}
              </div>

              {candidate.analysis_result?.habilidades_clave?.length > 0 && (
                <div className={styles.skillTags}>
                  {candidate.analysis_result.habilidades_clave.slice(0, 4).map((s: string, i: number) => (
                    <span key={i} className={styles.skillTag}>{s}</span>
                  ))}
                </div>
              )}

              <div className={styles.cardFooter}>
                {candidate.job_positions && (
                  <span className={styles.originTag}>De: {candidate.job_positions.title}</span>
                )}
                <button
                  className={styles.reuseBtn}
                  onClick={(e) => { e.stopPropagation(); setSelectedCandidate(candidate); setShowAddModal(true); }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Agregar a vacante
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedCandidate && !showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setSelectedCandidate(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{selectedCandidate.name || selectedCandidate.file_name}</h2>
              <button className={styles.closeBtn} onClick={() => setSelectedCandidate(null)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className={styles.modalBody}>
              {selectedCandidate.analysis_result?.resumen && (
                <p className={styles.detailSummary}>{selectedCandidate.analysis_result.resumen}</p>
              )}

              {selectedCandidate.analysis_result?.fortalezas?.length > 0 && (
                <div className={styles.detailSection}>
                  <h4 className={styles.sectionTitle}>Fortalezas</h4>
                  <ul className={styles.detailList}>
                    {selectedCandidate.analysis_result.fortalezas.map((f: string, i: number) => <li key={i}>{f}</li>)}
                  </ul>
                </div>
              )}

              {selectedCandidate.candidate_notes && selectedCandidate.candidate_notes.length > 0 && (
                <div className={styles.detailSection}>
                  <h4 className={styles.sectionTitle}>Notas anteriores</h4>
                  {selectedCandidate.candidate_notes.map((note, i) => (
                    <div key={i} className={styles.noteItem}>
                      <p className={styles.noteContent}>{note.content}</p>
                      <p className={styles.noteMeta}>{note.users?.name || "Reclutador"}</p>
                    </div>
                  ))}
                </div>
              )}

              <button className={styles.fullReuseBtn} onClick={() => setShowAddModal(true)}>
                Agregar a una vacante activa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add to position modal */}
      {showAddModal && selectedCandidate && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.smallModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Agregar a vacante</h2>
              <button className={styles.closeBtn} onClick={() => setShowAddModal(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.confirmText}>
                Mover a <strong>{selectedCandidate.name}</strong> a una vacante activa lo regresará a estado "en revisión".
              </p>
              <select className={styles.input} value={targetPosition} onChange={(e) => setTargetPosition(e.target.value)}>
                <option value="">Selecciona una vacante</option>
                {positions.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
              <div className={styles.modalFooter}>
                <button className={styles.cancelBtn} onClick={() => setShowAddModal(false)}>Cancelar</button>
                <button className={styles.submitBtn} disabled={!targetPosition || moving} onClick={handleAddToPosition}>
                  {moving ? <span className={styles.btnSpinner} /> : "Confirmar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
