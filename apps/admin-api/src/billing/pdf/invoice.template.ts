import PDFDocument from 'pdfkit';

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface InvoiceData {
  // Company info
  companyName: string;
  companyCode: string;

  // Invoice details
  invoiceNumber: string;
  issuedAt: string; // formatted date
  dueDate: string;
  periodStart: string;
  periodEnd: string;
  status: string; // PENDING, PAID, OVERDUE, CANCELLED

  // Plan info
  planName: string;
  billingCycle: string; // MONTHLY, YEARLY

  // Counts
  employeeCount: number;
  userCount: number;

  // Amounts
  baseAmount: number;
  employeeAmount: number;
  userAmount: number;
  addonAmount: number;
  totalAmount: number;

  // Line items
  lineItems: InvoiceLineItem[];

  // Payment info
  paidAt?: string;
}

function drawLine(doc: InstanceType<typeof PDFDocument>, x1: number, y: number, x2: number, _y2: number) {
  doc.strokeColor('#CBD5E1').lineWidth(0.5).moveTo(x1, y).lineTo(x2, y).stroke();
}

function fmtCurrency(v: number): string {
  return `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function generateInvoicePdf(data: InvoiceData): InstanceType<typeof PDFDocument> {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 40, bottom: 40, left: 50, right: 50 },
  });

  const pageWidth = 595.28 - 100; // A4 width minus margins
  const rightX = 50 + pageWidth;

  // ─── Header ──────────────────────────────────────────────────────────────

  doc.fontSize(20).font('Helvetica-Bold').fillColor('#1E293B').text('INVOICE', 50, 40);
  doc.fontSize(10).font('Helvetica').fillColor('#64748B').text('HR Platform', 50, 65);

  // Invoice meta (right side)
  doc.fontSize(9).font('Helvetica-Bold').fillColor('#64748B').text('Invoice No:', 380, 40);
  doc.font('Helvetica').fillColor('#1E293B').text(data.invoiceNumber, 450, 40);

  doc.font('Helvetica-Bold').fillColor('#64748B').text('Issue Date:', 380, 55);
  doc.font('Helvetica').fillColor('#1E293B').text(data.issuedAt, 450, 55);

  doc.font('Helvetica-Bold').fillColor('#64748B').text('Due Date:', 380, 70);
  doc.font('Helvetica').fillColor('#1E293B').text(data.dueDate, 450, 70);

  doc.font('Helvetica-Bold').fillColor('#64748B').text('Status:', 380, 85);
  const statusColor = data.status === 'PAID' ? '#16A34A' : data.status === 'OVERDUE' ? '#DC2626' : '#F59E0B';
  doc.font('Helvetica-Bold').fillColor(statusColor).text(data.status, 450, 85);

  doc.moveDown(2);
  const headerEndY = 110;
  drawLine(doc, 50, headerEndY, rightX, headerEndY);

  // ─── Bill To ─────────────────────────────────────────────────────────────

  let y = headerEndY + 15;
  doc.fontSize(9).font('Helvetica-Bold').fillColor('#64748B').text('BILL TO', 50, y);
  y += 16;
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#1E293B').text(data.companyName, 50, y);
  y += 16;
  doc.fontSize(9).font('Helvetica').fillColor('#64748B').text(`Company Code: ${data.companyCode}`, 50, y);

  // Billing period (right side)
  doc.fontSize(9).font('Helvetica-Bold').fillColor('#64748B').text('BILLING PERIOD', 380, headerEndY + 15);
  doc.fontSize(10).font('Helvetica').fillColor('#1E293B').text(
    `${data.periodStart} — ${data.periodEnd}`,
    380,
    headerEndY + 31,
  );
  doc.fontSize(9).font('Helvetica').fillColor('#64748B').text(
    `Plan: ${data.planName} (${data.billingCycle})`,
    380,
    headerEndY + 47,
  );

  y += 30;
  drawLine(doc, 50, y, rightX, y);

  // ─── Line Items Table ────────────────────────────────────────────────────

  y += 15;
  const colDesc = 50;
  const colQty = 320;
  const colUnit = 390;
  const colAmt = 470;

  // Table header
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#64748B');
  doc.text('DESCRIPTION', colDesc, y);
  doc.text('QTY', colQty, y, { width: 60, align: 'right' });
  doc.text('UNIT PRICE', colUnit, y, { width: 70, align: 'right' });
  doc.text('AMOUNT', colAmt, y, { width: 75, align: 'right' });

  y += 16;
  drawLine(doc, 50, y, rightX, y);
  y += 10;

  // Table rows
  doc.font('Helvetica').fillColor('#1E293B').fontSize(9);
  for (const item of data.lineItems) {
    doc.text(item.description, colDesc, y, { width: 260 });
    doc.text(String(item.quantity), colQty, y, { width: 60, align: 'right' });
    doc.text(fmtCurrency(item.unitPrice), colUnit, y, { width: 70, align: 'right' });
    doc.text(fmtCurrency(item.amount), colAmt, y, { width: 75, align: 'right' });
    y += 20;
  }

  y += 5;
  drawLine(doc, 50, y, rightX, y);

  // ─── Totals ──────────────────────────────────────────────────────────────

  y += 12;
  const labelX = 380;
  const valueX = 470;

  const addTotalRow = (label: string, value: number, bold = false) => {
    doc.fontSize(9).font(bold ? 'Helvetica-Bold' : 'Helvetica').fillColor('#64748B').text(label, labelX, y);
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fillColor('#1E293B').text(fmtCurrency(value), valueX, y, {
      width: 75,
      align: 'right',
    });
    y += 18;
  };

  if (data.baseAmount > 0) addTotalRow('Base Plan', data.baseAmount);
  if (data.employeeAmount > 0) addTotalRow('Employee Usage', data.employeeAmount);
  if (data.userAmount > 0) addTotalRow('User Usage', data.userAmount);
  if (data.addonAmount > 0) addTotalRow('Add-ons', data.addonAmount);

  drawLine(doc, labelX, y, rightX, y);
  y += 8;

  doc.fontSize(12).font('Helvetica-Bold').fillColor('#1E293B').text('TOTAL', labelX, y);
  doc.text(fmtCurrency(data.totalAmount), valueX, y, { width: 75, align: 'right' });

  // ─── Usage Summary ───────────────────────────────────────────────────────

  y += 40;
  drawLine(doc, 50, y, rightX, y);
  y += 12;

  doc.fontSize(8).font('Helvetica-Bold').fillColor('#64748B').text('USAGE SUMMARY', 50, y);
  y += 16;
  doc.fontSize(9).font('Helvetica').fillColor('#1E293B');
  doc.text(`Active Employees: ${data.employeeCount}`, 50, y);
  doc.text(`Active Users: ${data.userCount}`, 250, y);

  // ─── Footer ──────────────────────────────────────────────────────────────

  if (data.paidAt) {
    y += 30;
    doc.fontSize(9).font('Helvetica').fillColor('#16A34A').text(`Paid on ${data.paidAt}`, 50, y);
  }

  y += 30;
  doc.fontSize(8).font('Helvetica').fillColor('#94A3B8').text(
    'This is a computer-generated invoice. No signature is required.',
    50,
    y,
    { align: 'center', width: pageWidth },
  );

  return doc;
}
