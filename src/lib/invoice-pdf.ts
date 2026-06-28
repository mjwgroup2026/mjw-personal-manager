import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface InvoicePdfParams {
  entity: any;
  client: any;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  paymentTerms: string;
  notes: string;
  vatApplicable: boolean;
  vatPercentage: number;
  lines: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    discount: number;
    vat_percentage: number;
    line_total: number;
  }>;
  subtotal: number;
  vatTotal: number;
  grandTotal: number;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(v);

export function generateInvoicePdf(params: InvoicePdfParams) {
  const {
    entity, client, invoiceNumber, issueDate, dueDate, paymentTerms, notes,
    vatApplicable, vatPercentage, lines, subtotal, vatTotal, grandTotal,
  } = params;

  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 20;

  // Accent color from entity
  const accentHex = entity.invoice_accent_color || "#D4A853";
  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b] as [number, number, number];
  };
  const accent = hexToRgb(accentHex);

  // Header line
  doc.setDrawColor(...accent);
  doc.setLineWidth(1.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // Title
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(40, 40, 40);
  doc.text(vatApplicable ? "TAX INVOICE" : "INVOICE", margin, y);
  y += 8;

  if (!vatApplicable) {
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text("Not VAT Registered", margin, y);
    y += 6;
  }

  // Invoice details on right
  const rightX = pageWidth - margin;
  let detY = y - 14;
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.setFont("helvetica", "normal");

  const details = [
    ["Invoice #:", invoiceNumber],
    ["Date:", issueDate],
    ...(dueDate ? [["Due:", dueDate]] : []),
    ...(paymentTerms ? [["Terms:", paymentTerms]] : []),
  ];
  details.forEach(([label, val]) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, rightX - 60, detY);
    doc.setFont("helvetica", "normal");
    doc.text(val, rightX - 30, detY);
    detY += 5;
  });

  y += 4;

  // Supplier block
  doc.setFontSize(8);
  doc.setTextColor(...accent);
  doc.setFont("helvetica", "bold");
  doc.text("FROM", margin, y);
  y += 5;
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(10);
  doc.text(entity.legal_name, margin, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);

  if (entity.registration_number) { doc.text(`Reg: ${entity.registration_number}`, margin, y); y += 4; }
  if (vatApplicable && entity.vat_number) { doc.text(`VAT: ${entity.vat_number}`, margin, y); y += 4; }
  if (entity.physical_address) {
    const addrLines = doc.splitTextToSize(entity.physical_address, 70);
    doc.text(addrLines, margin, y);
    y += addrLines.length * 4;
  }
  if (entity.contact_email) { doc.text(entity.contact_email, margin, y); y += 4; }
  y += 4;

  // Client block
  const clientStartY = y;
  doc.setFontSize(8);
  doc.setTextColor(...accent);
  doc.setFont("helvetica", "bold");
  doc.text("TO", margin, y);
  y += 5;
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(10);
  doc.text(client?.name || "—", margin, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);

  if (client?.registration_number) { doc.text(`Reg: ${client.registration_number}`, margin, y); y += 4; }
  if (client?.vat_number) { doc.text(`VAT: ${client.vat_number}`, margin, y); y += 4; }
  if (client?.address) {
    const addrLines = doc.splitTextToSize(client.address, 70);
    doc.text(addrLines, margin, y);
    y += addrLines.length * 4;
  }
  if (client?.email) { doc.text(client.email, margin, y); y += 4; }
  y += 8;

  // Line items table
  const tableColumns = vatApplicable
    ? ["Description", "Qty", "Unit Price", "Disc %", "VAT %", "Total"]
    : ["Description", "Qty", "Unit Price", "Disc %", "Total"];

  const tableRows = lines
    .filter((l) => l.description)
    .map((l) =>
      vatApplicable
        ? [l.description, String(l.quantity), formatCurrency(l.unit_price), `${l.discount}%`, `${l.vat_percentage}%`, formatCurrency(l.line_total)]
        : [l.description, String(l.quantity), formatCurrency(l.unit_price), `${l.discount}%`, formatCurrency(l.line_total)]
    );

  autoTable(doc, {
    startY: y,
    head: [tableColumns],
    body: tableRows,
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: accent,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
    },
    bodyStyles: { fontSize: 8, textColor: [50, 50, 50] },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    columnStyles: vatApplicable
      ? { 0: { cellWidth: 60 }, 5: { halign: "right" } }
      : { 0: { cellWidth: 70 }, 4: { halign: "right" } },
    theme: "grid",
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // Totals
  const totalsX = pageWidth - margin - 60;
  doc.setFontSize(9);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text("Subtotal:", totalsX, y);
  doc.text(formatCurrency(subtotal), pageWidth - margin, y, { align: "right" });
  y += 6;

  if (vatApplicable) {
    doc.text(`VAT (${vatPercentage}%):`, totalsX, y);
    doc.text(formatCurrency(vatTotal), pageWidth - margin, y, { align: "right" });
    y += 6;
  }

  doc.setDrawColor(...accent);
  doc.setLineWidth(0.5);
  doc.line(totalsX, y, pageWidth - margin, y);
  y += 6;

  doc.setFont("helvetica", "bold");
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(11);
  doc.text("TOTAL DUE:", totalsX, y);
  doc.text(formatCurrency(grandTotal), pageWidth - margin, y, { align: "right" });
  y += 12;

  // Notes
  if (notes) {
    doc.setFontSize(8);
    doc.setTextColor(...accent);
    doc.setFont("helvetica", "bold");
    doc.text("NOTES", margin, y);
    y += 5;
    doc.setTextColor(80, 80, 80);
    doc.setFont("helvetica", "normal");
    const noteLines = doc.splitTextToSize(notes, pageWidth - margin * 2);
    doc.text(noteLines, margin, y);
    y += noteLines.length * 4 + 6;
  }

  // Bank details
  if (entity.bank_name) {
    doc.setFontSize(8);
    doc.setTextColor(...accent);
    doc.setFont("helvetica", "bold");
    doc.text("BANKING DETAILS", margin, y);
    y += 5;
    doc.setTextColor(80, 80, 80);
    doc.setFont("helvetica", "normal");
    doc.text(`Bank: ${entity.bank_name}`, margin, y); y += 4;
    if (entity.bank_account_number) { doc.text(`Account: ${entity.bank_account_number}`, margin, y); y += 4; }
    if (entity.bank_branch_code) { doc.text(`Branch Code: ${entity.bank_branch_code}`, margin, y); y += 4; }
    if (entity.bank_account_type) { doc.text(`Account Type: ${entity.bank_account_type}`, margin, y); y += 4; }
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setDrawColor(...accent);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text(`Generated by Ledgera · ${entity.legal_name}`, margin, footerY);
  doc.text(invoiceNumber, pageWidth - margin, footerY, { align: "right" });

  doc.save(`${invoiceNumber}.pdf`);
}
