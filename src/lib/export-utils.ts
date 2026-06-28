import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(v);

export function exportCSV(data: Record<string, any>[], filename: string) {
  if (!data.length) { alert("No data to export."); return; }
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(","),
    ...data.map(row => headers.map(h => {
      const v = row[h] ?? "";
      return typeof v === "string" && (v.includes(",") || v.includes('"') || v.includes("\n"))
        ? `"${v.replace(/"/g, '""')}"` : String(v);
    }).join(","))
  ].join("\n");
  downloadBlob(new Blob([csv], { type: "text/csv" }), `${filename}.csv`);
}

export function exportXLSX(data: Record<string, any>[], filename: string) {
  if (!data.length) { alert("No data to export."); return; }
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportPDF(title: string, headers: string[], rows: string[][], filename: string, entityName?: string) {
  const doc = new jsPDF("l", "mm", "a4");
  doc.setFontSize(14);
  doc.text(title, 14, 16);
  if (entityName) {
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(entityName, 14, 22);
    doc.setTextColor(0);
  }
  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-ZA")}`, 14, entityName ? 28 : 22);

  autoTable(doc, {
    startY: entityName ? 32 : 26,
    head: [headers],
    body: rows,
    styles: { fontSize: 7 },
    headStyles: { fillColor: [40, 60, 80], fontSize: 7 },
    margin: { left: 14, right: 14 },
  });
  doc.save(`${filename}.pdf`);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function generateDateFilename(prefix: string, entityName?: string, dateFrom?: string, dateTo?: string) {
  const parts = [prefix];
  if (entityName) parts.push(entityName.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 20));
  if (dateFrom && dateTo) parts.push(`${dateFrom}_to_${dateTo}`);
  else parts.push(new Date().toISOString().split("T")[0]);
  return parts.join("_");
}
