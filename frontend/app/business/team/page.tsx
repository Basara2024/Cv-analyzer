"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Spinner from "@/app/components/Spinner";
import styles from "./team.module.css";

interface Member {
  id: number;
  role: "owner" | "admin" | "recruiter";
  is_active: boolean;
  created_at: string;
  users: { id: number; name: string; email: string; avatar_url?: string };
}

const ROLE_LABELS: Record<string, { label: string; className: string }> = {
  owner: { label: "Owner", className: "badgePurple" },
  admin: { label: "Admin", className: "badgeBlue" },
  recruiter: { label: "Reclutador", className: "badgeGreen" },
};

export default function TeamPage() {
  const router = useRouter();
  const [orgId, setOrgId] = useState<number | null>(null);
  const [myRole, setMyRole] = useState<string>("");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "recruiter" });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const orgRes = await api.get("/organizations/my");
        const org = orgRes.data.organization;
        const role = orgRes.data.role;
        setOrgId(org.id);
        setMyRole(role);

        if (role !== "owner" && role !== "admin") {
          setAccessDenied(true);
          setLoading(false);
          return;
        }

        const membRes = await api.get(`/organizations/${org.id}/members`);
        setMembers(membRes.data.members || []);
      } catch (error) {
        console.error("Error fetching team:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const resetForm = () => {
    setForm({ name: "", email: "", role: "recruiter" });
    setFormError("");
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId || !form.name || !form.email) {
      setFormError("Nombre y email son obligatorios.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      await api.post(`/organizations/${orgId}/members`, form);
      const membRes = await api.get(`/organizations/${orgId}/members`);
      setMembers(membRes.data.members || []);
      setShowAddModal(false);
      resetForm();
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Error al agregar el miembro.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleChange = async (member: Member, newRole: string) => {
    if (!orgId) return;
    try {
      await api.put(`/organizations/${orgId}/members/${member.users.id}/role`, { role: newRole });
      setMembers((prev) =>
        prev.map((m) => (m.id === member.id ? { ...m, role: newRole as Member["role"] } : m))
      );
    } catch (error) {
      console.error("Error updating role:", error);
    }
  };

  const handleRemove = async (member: Member) => {
    if (!orgId) return;
    if (!confirm(`¿Eliminar a ${member.users.name} del equipo?`)) return;
    try {
      await api.delete(`/organizations/${orgId}/members/${member.users.id}`);
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
    } catch (error) {
      console.error("Error removing member:", error);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spinner variant="page" />
        <p>Cargando equipo...</p>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className={styles.deniedState}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <h2 className={styles.deniedTitle}>Acceso restringido</h2>
        <p className={styles.deniedText}>Solo los administradores pueden gestionar el equipo.</p>
        <button className={styles.deniedBtn} onClick={() => router.push("/business/dashboard")}>
          Volver al dashboard
        </button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Equipo</h1>
          <p className={styles.pageSubtitle}>Reclutadores, analistas y administradores de tu organización</p>
        </div>
        <button className={styles.primaryBtn} onClick={() => { resetForm(); setShowAddModal(true); }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Agregar miembro
        </button>
      </div>

      <div className={styles.infoBox}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
        Los miembros se agregan directamente con sus credenciales — no se envía invitación por correo. Comparte el acceso manualmente.
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Miembro</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Desde</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id}>
                <td>
                  <div className={styles.memberCell}>
                    <div className={styles.avatar}>{member.users.name?.[0]?.toUpperCase()}</div>
                    <span className={styles.memberName}>{member.users.name}</span>
                  </div>
                </td>
                <td className={styles.mutedCell}>{member.users.email}</td>
                <td>
                  {member.role === "owner" ? (
                    <span className={`${styles.badge} ${styles[ROLE_LABELS.owner.className]}`}>Owner</span>
                  ) : (
                    <select
                      className={styles.roleSelect}
                      value={member.role}
                      onChange={(e) => handleRoleChange(member, e.target.value)}
                    >
                      <option value="admin">Admin</option>
                      <option value="recruiter">Reclutador</option>
                    </select>
                  )}
                </td>
                <td className={styles.mutedCell}>{new Date(member.created_at).toLocaleDateString("es")}</td>
                <td>
                  {member.role !== "owner" && (
                    <button className={styles.removeBtn} onClick={() => handleRemove(member)} title="Eliminar">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add member modal */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Agregar miembro</h2>
              <button className={styles.closeBtn} onClick={() => setShowAddModal(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleAddMember} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Nombre completo *</label>
                <input
                  className={styles.input}
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Email *</label>
                <input
                  className={styles.input}
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Rol</label>
                <select className={styles.input} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="recruiter">Reclutador — acceso completo a HR (puestos, candidatos, entrevistas)</option>
                  <option value="admin">Admin — Gestión de equipo</option>
                </select>
              </div>
              <p className={styles.hint}>
                Se crea una cuenta para esta persona con una contraseña temporal. Compártele el acceso manualmente.
              </p>
              {formError && <div className={styles.errorBox}>{formError}</div>}
              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowAddModal(false)}>Cancelar</button>
                <button type="submit" className={styles.submitBtn} disabled={submitting}>
                  {submitting ? <Spinner variant="button" /> : "Agregar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
