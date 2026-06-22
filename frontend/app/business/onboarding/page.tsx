"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import styles from "./onboarding.module.css";

interface TeamMemberDraft {
  name: string;
  email: string;
  role: "admin" | "recruiter";
}

function OnboardingInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [checking, setChecking] = useState(true);
  const [accessError, setAccessError] = useState("");
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 — company data
  const [companyForm, setCompanyForm] = useState({
    name: "", nit: "", economic_activity: "", country: "Colombia", city: "", size: "",
  });
  const [submittingCompany, setSubmittingCompany] = useState(false);
  const [companyError, setCompanyError] = useState("");
  const [orgId, setOrgId] = useState<number | null>(null);

  // Step 2 — optional team
  const [teamMembers, setTeamMembers] = useState<TeamMemberDraft[]>([]);
  const [memberDraft, setMemberDraft] = useState<TeamMemberDraft>({ name: "", email: "", role: "recruiter" });
  const [addingMembers, setAddingMembers] = useState(false);
  const [teamError, setTeamError] = useState("");

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await api.get("/organizations/can-onboard");
        if (!res.data.canOnboard) {
          if (res.data.reason === "already_has_org") {
            router.push("/business/dashboard");
          } else {
            setAccessError("No encontramos un pago aprobado del plan Business. Si ya pagaste, espera unos segundos y recarga esta página.");
          }
        }
      } catch (error) {
        console.error("Error verificando onboarding:", error);
        setAccessError("Error al verificar tu suscripción.");
      } finally {
        setChecking(false);
      }
    };
    verify();
  }, [router]);

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyForm.name) {
      setCompanyError("La razón social es obligatoria.");
      return;
    }
    setSubmittingCompany(true);
    setCompanyError("");
    try {
      const res = await api.post("/organizations", companyForm);
      setOrgId(res.data.organization.id);
      setStep(2);
    } catch (err: any) {
      setCompanyError(err.response?.data?.message || "Error al registrar la empresa.");
    } finally {
      setSubmittingCompany(false);
    }
  };

  const handleAddDraftMember = () => {
    if (!memberDraft.name || !memberDraft.email) {
      setTeamError("Nombre y email son obligatorios.");
      return;
    }
    setTeamMembers((prev) => [...prev, memberDraft]);
    setMemberDraft({ name: "", email: "", role: "recruiter" });
    setTeamError("");
  };

  const removeDraftMember = (index: number) => {
    setTeamMembers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFinishTeamStep = async () => {
    if (!orgId) return;
    setAddingMembers(true);
    setTeamError("");
    try {
      for (const member of teamMembers) {
        await api.post(`/organizations/${orgId}/members`, member);
      }
      setStep(3);
    } catch (err: any) {
      setTeamError(err.response?.data?.message || "Error al agregar algunos miembros. Puedes agregarlos después desde Equipo.");
      setStep(3);
    } finally {
      setAddingMembers(false);
    }
  };

  if (checking) {
    return (
      <div className={styles.page}>
        <div className={styles.spinner} />
      </div>
    );
  }

  if (accessError) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.title}>No podemos continuar</h1>
          <p className={styles.subtitle}>{accessError}</p>
          <button className={styles.primaryBtn} onClick={() => window.location.reload()}>
            Recargar página
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.progressSteps}>
          <span className={`${styles.stepDot} ${step >= 1 ? styles.stepDotActive : ""}`}>1</span>
          <span className={styles.stepLine} />
          <span className={`${styles.stepDot} ${step >= 2 ? styles.stepDotActive : ""}`}>2</span>
          <span className={styles.stepLine} />
          <span className={`${styles.stepDot} ${step >= 3 ? styles.stepDotActive : ""}`}>3</span>
        </div>

        {/* Step 1 — Company data */}
        {step === 1 && (
          <>
            <h1 className={styles.title}>¡Pago confirmado! 🎉</h1>
            <p className={styles.subtitle}>Ahora registremos los datos de tu empresa para activar tu Dashboard Business.</p>

            <form onSubmit={handleCompanySubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Razón social *</label>
                <input
                  className={styles.input}
                  type="text"
                  placeholder="Ej: Matchia S.A.S."
                  value={companyForm.name}
                  onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
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
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Actividad económica</label>
                  <input
                    className={styles.input}
                    type="text"
                    value={companyForm.economic_activity}
                    onChange={(e) => setCompanyForm({ ...companyForm, economic_activity: e.target.value })}
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
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Ciudad</label>
                  <input
                    className={styles.input}
                    type="text"
                    value={companyForm.city}
                    onChange={(e) => setCompanyForm({ ...companyForm, city: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Tamaño de la empresa</label>
                <select
                  className={styles.input}
                  value={companyForm.size}
                  onChange={(e) => setCompanyForm({ ...companyForm, size: e.target.value })}
                >
                  <option value="">Selecciona un tamaño</option>
                  <option value="micro">Micro (1-10 empleados)</option>
                  <option value="pequeña">Pequeña (11-50 empleados)</option>
                  <option value="mediana">Mediana (51-200 empleados)</option>
                  <option value="grande">Grande (200+ empleados)</option>
                </select>
              </div>

              {companyError && <div className={styles.errorBox}>{companyError}</div>}

              <button type="submit" className={styles.primaryBtn} disabled={submittingCompany}>
                {submittingCompany ? <span className={styles.btnSpinner} /> : "Continuar →"}
              </button>
            </form>
          </>
        )}

        {/* Step 2 — Optional team */}
        {step === 2 && (
          <>
            <h1 className={styles.title}>Agrega a tu equipo</h1>
            <p className={styles.subtitle}>Opcional — puedes agregar reclutadores ahora o más tarde desde Configuración → Equipo.</p>

            <div className={styles.teamAddRow}>
              <input
                className={styles.input}
                type="text"
                placeholder="Nombre"
                value={memberDraft.name}
                onChange={(e) => setMemberDraft({ ...memberDraft, name: e.target.value })}
              />
              <input
                className={styles.input}
                type="email"
                placeholder="Email"
                value={memberDraft.email}
                onChange={(e) => setMemberDraft({ ...memberDraft, email: e.target.value })}
              />
              <select
                className={styles.input}
                value={memberDraft.role}
                onChange={(e) => setMemberDraft({ ...memberDraft, role: e.target.value as "admin" | "recruiter" })}
              >
                <option value="recruiter">Reclutador</option>
                <option value="admin">Admin</option>
              </select>
              <button type="button" className={styles.addBtn} onClick={handleAddDraftMember}>+</button>
            </div>

            {teamError && <div className={styles.errorBox}>{teamError}</div>}

            {teamMembers.length > 0 && (
              <div className={styles.draftList}>
                {teamMembers.map((m, i) => (
                  <div key={i} className={styles.draftItem}>
                    <span>{m.name} · {m.email} · {m.role === "admin" ? "Admin" : "Reclutador"}</span>
                    <button onClick={() => removeDraftMember(i)}>✕</button>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.stepActions}>
              <button className={styles.skipBtn} onClick={() => setStep(3)}>Saltar este paso</button>
              <button className={styles.primaryBtn} onClick={handleFinishTeamStep} disabled={addingMembers}>
                {addingMembers ? <span className={styles.btnSpinner} /> : "Continuar →"}
              </button>
            </div>
          </>
        )}

        {/* Step 3 — Confirmation */}
        {step === 3 && (
          <>
            <div className={styles.successIcon}>✓</div>
            <h1 className={styles.title}>¡Todo listo!</h1>
            <p className={styles.subtitle}>
              Tu Dashboard Empresarial ya está activo. Puedes empezar a crear vacantes y analizar candidatos.
            </p>
            <button className={styles.primaryBtn} onClick={() => router.push("/business/dashboard")}>
              Ir al Dashboard Empresarial →
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingInner />
    </Suspense>
  );
}
