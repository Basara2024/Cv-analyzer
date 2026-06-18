// Utilidad para exportar una vacante a PDF o texto plano,
// lista para copiar/pegar o subir a portales de empleo (LinkedIn, Indeed, Computrabajo, etc.)

interface Position {
  id: number;
  title: string;
  description: string;
  requirements?: string;
  salary_range?: string;
  location?: string;
  status: string;
  created_at: string;
}

const buildPlainText = (position: Position, orgName: string): string => {
  const lines: string[] = [];

  lines.push(position.title.toUpperCase());
  lines.push(orgName ? `Empresa: ${orgName}` : "");
  if (position.location) lines.push(`Ubicación: ${position.location}`);
  if (position.salary_range) lines.push(`Salario: ${position.salary_range}`);
  lines.push("");
  lines.push("DESCRIPCIÓN DEL PUESTO");
  lines.push(position.description);
  lines.push("");

  if (position.requirements) {
    lines.push("REQUISITOS Y COMPETENCIAS");
    lines.push(position.requirements);
    lines.push("");
  }

  lines.push("---");
  lines.push(`Publicado por ${orgName || "la empresa"} vía Matchia`);

  return lines.filter((l) => l !== undefined).join("\n");
};

export const exportPositionToText = (position: Position, orgName: string) => {
  const text = buildPlainText(position, orgName);
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `vacante-${position.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const exportPositionToPDF = async (position: Position, orgName: string) => {
  // Carga dinámica para no aumentar el bundle inicial
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 56;
  const contentWidth = pageWidth - margin * 2;
  let y = 70;

  // Header bar
  doc.setFillColor(37, 99, 235); // #2563eb
  doc.rect(0, 0, pageWidth, 8, "F");

  // Empresa
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text(orgName || "Vacante publicada vía Matchia", margin, y);
  y += 28;

  // Título
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(20, 20, 20);
  const titleLines = doc.splitTextToSize(position.title, contentWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 24 + 6;

  // Meta info (ubicación / salario)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(90, 90, 90);
  const metaParts: string[] = [];
  if (position.location) metaParts.push(`📍 ${position.location}`);
  if (position.salary_range) metaParts.push(`💰 ${position.salary_range}`);
  if (metaParts.length) {
    doc.text(metaParts.join("      "), margin, y);
    y += 24;
  }

  // Línea divisoria
  doc.setDrawColor(225, 225, 225);
  doc.line(margin, y, pageWidth - margin, y);
  y += 26;

  // Sección: Descripción
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12.5);
  doc.setTextColor(37, 99, 235);
  doc.text("DESCRIPCIÓN DEL PUESTO", margin, y);
  y += 18;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);
  const descLines = doc.splitTextToSize(position.description, contentWidth);
  doc.text(descLines, margin, y);
  y += descLines.length * 15 + 24;

  // Salto de página si es necesario
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y > pageHeight - 150 && position.requirements) {
    doc.addPage();
    y = 70;
  }

  // Sección: Requisitos
  if (position.requirements) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12.5);
    doc.setTextColor(37, 99, 235);
    doc.text("REQUISITOS Y COMPETENCIAS", margin, y);
    y += 18;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    const reqLines = doc.splitTextToSize(position.requirements, contentWidth);
    doc.text(reqLines, margin, y);
    y += reqLines.length * 15 + 20;
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 40;
  doc.setDrawColor(225, 225, 225);
  doc.line(margin, footerY - 14, pageWidth - margin, footerY - 14);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(140, 140, 140);
  doc.text(`Generado con Matchia · ${new Date().toLocaleDateString("es")}`, margin, footerY);

  doc.save(`vacante-${position.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}.pdf`);
};
