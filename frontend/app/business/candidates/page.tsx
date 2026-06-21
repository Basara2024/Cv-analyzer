"use client";
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import Spinner from "@/app/components/Spinner";
import styles from "./candidates.module.css";

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
  status: "en_revision" | "seleccionado" | "descartado" | "pool";
  job_position_id?: number;
  analysis_result?: any;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  en_revision: { label: "En revisión", className: "badgeYellow" },
  seleccionado: { label: "Seleccionado", className: "badgeGreen" },
  descartado: { label: "Descartado", className: "badgeRed" },
  pool: { label: "En pool", className: "badgeBlue" },
};

const RANK_COLORS = ["", "#ef4444", "#f59e0b", "#eab308", "#84cc16", "#22c55e"];

export default function CandidatesPage() {
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [orgId, setOrgId] = useState<number | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedPosition, setSelectedPosition] = useState<string>(
    searchParams.get("position") || ""
  );
  const [filterPosition, setFilterPosition] = useState<string>(
    searchParams.get("position") || "all"
  );
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState("");
  const [uploadError, setUploadError] = useState("");

  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [noteContent, setNoteContent] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const orgRes = await api.get("/organizations/my");
        const org = orgRes.data.organization;
        setOrgId(org.id);

        const [posRes, candRes] = await Promise.all([
          api.get(`/organizations/${org.id}/positions`),
          api.get(`/organizations/${org.id}/candidates`),
        ]);
        setPositions(posRes.data.positions || []);
        setCandidates(candRes.data.candidates || []);
      } catch (error) {
        console.error("Error fetching candidates data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleFileSelect = (selected: FileList | null) => {
    if (!selected) return;
    const pdfFiles = Array.from(selected).filter((f) => f.type === "application/pdf");
    const combined = [...files, ...pdfFiles].slice(0, 20);
    setFiles(combined);
    setUploadError("");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleBulkAnalyze = async () => {
    if (!orgId || files.length === 0) return;
    setAnalyzing(true);
    setUploadError("");
    setAnalyzeProgress(`Analizando ${files.length} CV${files.length > 1 ? "s" : ""}...`);

    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("cvs", f));
      if (selectedPosition) formData.append("job_position_id", selectedPosition);

      const res = await api.post(`/organizations/${orgId}/candidates/bulk`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setCandidates((prev) => [...res.data.candidates, ...prev]);
      setShowUploadModal(false);
      setFiles([]);
      setAnalyzeProgress("");
    } catch (err: any) {
      setUploadError(err.response?.data?.message || "Error al analizar los CVs.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleStatusChange = async (candidate: Candidate, newStatus: string) => {
    if (!orgId) return;
    try {
      await api.put(`/organizations/${orgId}/candidates/${candidate.id}`, { status: newStatus });
      setCandidates((prev) =>
        prev.map((c) => (c.id === candidate.id ? { ...c, status: newStatus as Candidate["status"] } : c))
      );
      if (selectedCandidate?.id === candidate.id) {
        setSelectedCandidate({ ...selectedCandidate, status: newStatus as Candidate["status"] });
      }
    } catch (error) {
      console.error("Error updating candidate status:", error);
    }
  };

  const handleAddNote = async () => {
    if (!orgId || !selectedCandidate || !noteContent.trim()) return;
    setSavingNote(true);
    try {
      await api.post(`/organizations/${orgId}/candidates/${selectedCandidate.id}/notes`, {
        content: noteContent,
      });
      setNoteContent("");
      // Refresh candidates to get updated notes
      const candRes = await api.get(`/organizations/${orgId}/candidates`);
      setCandidates(candRes.data.candidates || []);
      const updated = candRes.data.candidates.find((c: Candidate) => c.id === selectedCandidate.id);
      if (updated) setSelectedCandidate(updated);
    } catch (error) {
      console.error("Error adding note:", error);
    } finally {
      setSavingNote(false);
    }
  };

  const filteredCandidates = candidates.filter((c) => {
    if (filterPosition !== "all" && String(c.job_position_id) !== filterPosition) return false;
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    return true;
  });

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spinner variant="page" />
        <p>Cargando candidatos...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Candidatos</h1>
          <p className={styles.pageSubtitle}>Todos los candidatos cargados en el sistema</p>
        </div>
        <button className={styles.primaryBtn} onClick={() => setShowUploadModal(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          Subir CVs
        </button>
      </div>

      {/* Filters */}
      <div className={styles.filtersRow}>
        <select
          className={styles.filterSelect}
          value={filterPosition}
          onChange={(e) => setFilterPosition(e.target.value)}
        >
          <option value="all">Todos los puestos</option>
          {positions.map((p) => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </select>

        <select
          className={styles.filterSelect}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">Todos los estados</option>
          <option value="en_revision">En revisión</option>
          <option value="seleccionado">Seleccionado</option>
          <option value="descartado">Descartado</option>
          <option value="pool">En pool</option>
        </select>

        <span className={styles.resultCount}>{filteredCandidates.length} candidatos</span>
      </div>

      {/* Candidates table */}
      {filteredCandidates.length === 0 ? (
        <div className={styles.emptyState}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
          </svg>
          <p>No hay candidatos {filterStatus !== "all" || filterPosition !== "all" ? "con estos filtros" : "todavía"}</p>
          <button className={styles.emptyLink} onClick={() => setShowUploadModal(true)}>Subir el primer CV</button>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Puesto</th>
                <th>Score IA</th>
                <th>Ranking</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredCandidates.map((candidate) => {
                const position = positions.find((p) => p.id === candidate.job_position_id);
                return (
                  <tr key={candidate.id} onClick={() => setSelectedCandidate(candidate)} className={styles.row}>
                    <td>
                      <div className={styles.nameCell}>
                        <div className={styles.avatar}>{candidate.name?.[0]?.toUpperCase() || "?"}</div>
                        <div>
                          <p className={styles.candidateName}>{candidate.name || candidate.file_name}</p>
                          {candidate.email && <p className={styles.candidateEmail}>{candidate.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className={styles.mutedCell}>{position?.title || "—"}</td>
                    <td>
                      {candidate.individual_score !== undefined && candidate.individual_score !== null ? (
                        <span className={styles.scoreValue}>{candidate.individual_score}/100</span>
                      ) : "—"}
                    </td>
                    <td>
                      {candidate.ranking_score ? (
                        <span
                          className={styles.rankBadge}
                          style={{ background: `${RANK_COLORS[candidate.ranking_score]}22`, color: RANK_COLORS[candidate.ranking_score] }}
                        >
                          {"★".repeat(candidate.ranking_score)}
                        </span>
                      ) : "—"}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${styles[STATUS_CONFIG[candidate.status]?.className]}`}>
                        {STATUS_CONFIG[candidate.status]?.label}
                      </span>
                    </td>
                    <td>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-muted)" }}>
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className={styles.modalOverlay} onClick={() => !analyzing && setShowUploadModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Subir CVs para análisis</h2>
              {!analyzing && (
                <button className={styles.closeBtn} onClick={() => setShowUploadModal(false)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>

            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Puesto de trabajo (opcional)</label>
                <select
                  className={styles.input}
                  value={selectedPosition}
                  onChange={(e) => setSelectedPosition(e.target.value)}
                  disabled={analyzing}
                >
                  <option value="">Sin asignar a un puesto específico</option>
                  {positions.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
                <p className={styles.hint}>
                  Si seleccionas un puesto, la IA comparará a los candidatos contra su descripción y asignará un ranking del 1 al 5.
                </p>
              </div>

              {!analyzing ? (
                <>
                  <div
                    className={`${styles.dropzone} ${dragging ? styles.dropzoneDragging : ""}`}
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <p className={styles.dropzoneText}>Arrastra hasta 20 CVs aquí, o haz clic para seleccionar</p>
                    <p className={styles.dropzoneHint}>Solo PDF · Máx. 10MB por archivo</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      multiple
                      style={{ display: "none" }}
                      onChange={(e) => handleFileSelect(e.target.files)}
                    />
                  </div>

                  {files.length > 0 && (
                    <div className={styles.fileList}>
                      <p className={styles.fileListHeader}>{files.length} de 20 archivos seleccionados</p>
                      {files.map((file, i) => (
                        <div key={i} className={styles.fileItem}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                          </svg>
                          <span className={styles.fileName}>{file.name}</span>
                          <button className={styles.removeFileBtn} onClick={() => removeFile(i)}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}

                  {uploadError && <div className={styles.errorBox}>{uploadError}</div>}

                  <div className={styles.modalFooter}>
                    <button className={styles.cancelBtn} onClick={() => setShowUploadModal(false)}>Cancelar</button>
                    <button
                      className={styles.submitBtn}
                      disabled={files.length === 0}
                      onClick={handleBulkAnalyze}
                    >
                      Analizar {files.length > 0 ? `${files.length} CV${files.length > 1 ? "s" : ""}` : "CVs"}
                    </button>
                  </div>
                </>
              ) : (
                <div className={styles.analyzingState}>
                  <Spinner variant="large" />
                  <p className={styles.analyzingText}>{analyzeProgress}</p>
                  <p className={styles.analyzingHint}>Esto puede tardar uno o dos minutos según la cantidad de CVs.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Candidate Detail Modal */}
      {selectedCandidate && (
        <div className={styles.modalOverlay} onClick={() => setSelectedCandidate(null)}>
          <div className={styles.detailModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle}>{selectedCandidate.name || selectedCandidate.file_name}</h2>
                {selectedCandidate.email && <p className={styles.detailEmail}>{selectedCandidate.email}</p>}
              </div>
              <button className={styles.closeBtn} onClick={() => setSelectedCandidate(null)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className={styles.detailBody}>
              {/* Status selector */}
              <div className={styles.statusRow}>
                <span className={styles.label}>Estado:</span>
                <select
                  className={styles.statusSelectDetail}
                  value={selectedCandidate.status}
                  onChange={(e) => handleStatusChange(selectedCandidate, e.target.value)}
                >
                  <option value="en_revision">En revisión</option>
                  <option value="seleccionado">Seleccionado</option>
                  <option value="descartado">Descartado</option>
                  <option value="pool">En pool</option>
                </select>
              </div>

              {/* Scores */}
              <div className={styles.scoresGrid}>
                <div className={styles.scoreBox}>
                  <span className={styles.scoreBoxLabel}>Score IA</span>
                  <span className={styles.scoreBoxValue}>{selectedCandidate.individual_score || "—"}/100</span>
                </div>
                <div className={styles.scoreBox}>
                  <span className={styles.scoreBoxLabel}>Ranking</span>
                  <span className={styles.scoreBoxValue}>
                    {selectedCandidate.ranking_score ? "★".repeat(selectedCandidate.ranking_score) : "—"}
                  </span>
                </div>
              </div>

              {/* AI Analysis */}
              {selectedCandidate.analysis_result && (
                <>
                  {selectedCandidate.analysis_result.resumen && (
                    <div className={styles.detailSection}>
                      <h4 className={styles.detailSectionTitle}>Resumen IA</h4>
                      <p className={styles.detailText}>{selectedCandidate.analysis_result.resumen}</p>
                    </div>
                  )}

                  {selectedCandidate.analysis_result.fortalezas?.length > 0 && (
                    <div className={styles.detailSection}>
                      <h4 className={styles.detailSectionTitle}>Fortalezas</h4>
                      <ul className={styles.detailList}>
                        {selectedCandidate.analysis_result.fortalezas.map((f: string, i: number) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedCandidate.analysis_result.areas_mejora?.length > 0 && (
                    <div className={styles.detailSection}>
                      <h4 className={styles.detailSectionTitle}>Áreas de mejora / riesgos</h4>
                      <ul className={styles.detailList}>
                        {selectedCandidate.analysis_result.areas_mejora.map((a: string, i: number) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedCandidate.analysis_result.habilidades_clave?.length > 0 && (
                    <div className={styles.detailSection}>
                      <h4 className={styles.detailSectionTitle}>Habilidades clave</h4>
                      <div className={styles.skillTags}>
                        {selectedCandidate.analysis_result.habilidades_clave.map((s: string, i: number) => (
                          <span key={i} className={styles.skillTag}>{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Notes */}
              <div className={styles.detailSection}>
                <h4 className={styles.detailSectionTitle}>Notas del reclutador</h4>
                {(selectedCandidate as any).candidate_notes?.length > 0 && (
                  <div className={styles.notesList}>
                    {(selectedCandidate as any).candidate_notes.map((note: any) => (
                      <div key={note.id} className={styles.noteItem}>
                        <p className={styles.noteContent}>{note.content}</p>
                        <p className={styles.noteMeta}>
                          {note.users?.name || "Reclutador"} · {new Date(note.created_at).toLocaleDateString("es")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                <div className={styles.addNoteRow}>
                  <textarea
                    className={styles.noteTextarea}
                    placeholder="Agrega una nota sobre por qué fue aceptado/descartado, para referencia futura..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    rows={2}
                  />
                  <button
                    className={styles.addNoteBtn}
                    onClick={handleAddNote}
                    disabled={!noteContent.trim() || savingNote}
                  >
                    {savingNote ? <Spinner variant="button" /> : "Agregar"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
