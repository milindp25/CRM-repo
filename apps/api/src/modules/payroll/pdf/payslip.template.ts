import PDFDocument from 'pdfkit';

export interface PayslipData {
  companyName: string;
  companyAddress?: string;
  companyPan?: string;
  companyTan?: string;
  companyEin?: string;

  employeeName: string;
  employeeCode: string;
  designation?: string;
  department?: string;
  pan?: string;
  uan?: string;
  ssn?: string;
  bankAccount?: string;
  bankName?: string;

  payPeriod: string; // "February 2026"
  payDate?: string;
  country: string; // IN or US

  earnings: Array<{ name: string; amount: number }>;
  deductions: Array<{ name: string; amount: number }>;
  employerContributions: Array<{ name: string; amount: number }>;

  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  totalEmployerContributions: number;

  daysWorked: number;
  daysInMonth: number;
  leaveDays: number;
  absentDays: number;

  currency: string; // ₹ or $
}

export function generatePayslipPdf(data: PayslipData): InstanceType<typeof PDFDocument> {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 40, bottom: 40, left: 50, right: 50 },
  });

  const pageWidth = 595.28 - 100; // A4 width minus margins
  const currencyFmt = (v: number) => `${data.currency}${v.toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;

  // ─── Header ──────────────────────────────────────────────────────────────
  doc.fontSize(18).font('Helvetica-Bold').text(data.companyName, { align: 'center' });
  if (data.companyAddress) {
    doc.fontSize(9).font('Helvetica').text(data.companyAddress, { align: 'center' });
  }

  // Registration numbers
  const regParts: string[] = [];
  if (data.companyPan) regParts.push(`PAN: ${data.companyPan}`);
  if (data.companyTan) regParts.push(`TAN: ${data.companyTan}`);
  if (data.companyEin) regParts.push(`EIN: ${data.companyEin}`);
  if (regParts.length > 0) {
    doc.fontSize(8).font('Helvetica').text(regParts.join(' | '), { align: 'center' });
  }

  doc.moveDown(0.5);
  doc.fontSize(13).font('Helvetica-Bold').text(`Payslip — ${data.payPeriod}`, { align: 'center' });
  doc.moveDown(0.5);

  // Horizontal line
  drawLine(doc, 50, doc.y, 545, doc.y);
  doc.moveDown(0.5);

  // ─── Employee Details ────────────────────────────────────────────────────
  const detailsY = doc.y;
  const col1X = 50;
  const col2X = 310;

  doc.fontSize(9).font('Helvetica-Bold');
  doc.text('Employee Name:', col1X, detailsY);
  doc.font('Helvetica').text(data.employeeName, col1X + 100, detailsY);

  doc.font('Helvetica-Bold').text('Employee Code:', col2X, detailsY);
  doc.font('Helvetica').text(data.employeeCode, col2X + 100, detailsY);

  let yOff = detailsY + 16;
  if (data.designation) {
    doc.font('Helvetica-Bold').text('Designation:', col1X, yOff);
    doc.font('Helvetica').text(data.designation, col1X + 100, yOff);
  }
  if (data.department) {
    doc.font('Helvetica-Bold').text('Department:', col2X, yOff);
    doc.font('Helvetica').text(data.department, col2X + 100, yOff);
  }
  yOff += 16;

  if (data.country === 'IN') {
    if (data.pan) {
      doc.font('Helvetica-Bold').text('PAN:', col1X, yOff);
      doc.font('Helvetica').text(data.pan, col1X + 100, yOff);
    }
    if (data.uan) {
      doc.font('Helvetica-Bold').text('UAN:', col2X, yOff);
      doc.font('Helvetica').text(data.uan, col2X + 100, yOff);
    }
  } else {
    if (data.ssn) {
      doc.font('Helvetica-Bold').text('SSN:', col1X, yOff);
      doc.font('Helvetica').text(`***-**-${data.ssn.slice(-4)}`, col1X + 100, yOff);
    }
  }
  yOff += 16;

  if (data.bankAccount) {
    doc.font('Helvetica-Bold').text('Bank Account:', col1X, yOff);
    doc.font('Helvetica').text(`****${data.bankAccount.slice(-4)}`, col1X + 100, yOff);
    if (data.bankName) {
      doc.font('Helvetica-Bold').text('Bank:', col2X, yOff);
      doc.font('Helvetica').text(data.bankName, col2X + 100, yOff);
    }
  }
  yOff += 16;

  doc.font('Helvetica-Bold').text('Pay Date:', col1X, yOff);
  doc.font('Helvetica').text(data.payDate || 'N/A', col1X + 100, yOff);

  doc.font('Helvetica-Bold').text('Days Worked:', col2X, yOff);
  doc.font('Helvetica').text(`${data.daysWorked} / ${data.daysInMonth}`, col2X + 100, yOff);

  doc.y = yOff + 24;
  drawLine(doc, 50, doc.y, 545, doc.y);
  doc.moveDown(0.5);

  // ─── Earnings & Deductions Side by Side ──────────────────────────────────
  const tableY = doc.y;
  const leftWidth = pageWidth / 2 - 10;
  const rightX = col1X + leftWidth + 20;

  // Earnings header
  doc.fontSize(10).font('Helvetica-Bold');
  doc.text('Earnings', col1X, tableY);
  doc.text('Amount', col1X + leftWidth - 60, tableY, { width: 60, align: 'right' });

  // Deductions header
  doc.text('Deductions', rightX, tableY);
  doc.text('Amount', rightX + leftWidth - 60, tableY, { width: 60, align: 'right' });

  drawLine(doc, col1X, tableY + 14, col1X + leftWidth, tableY + 14);
  drawLine(doc, rightX, tableY + 14, rightX + leftWidth, tableY + 14);

  let rowY = tableY + 20;
  doc.fontSize(9).font('Helvetica');

  // Earnings rows
  for (const earning of data.earnings) {
    doc.text(earning.name, col1X, rowY, { width: leftWidth - 70 });
    doc.text(currencyFmt(earning.amount), col1X + leftWidth - 60, rowY, { width: 60, align: 'right' });
    rowY += 14;
  }

  // Deductions rows
  let dedY = tableY + 20;
  for (const ded of data.deductions) {
    doc.text(ded.name, rightX, dedY, { width: leftWidth - 70 });
    doc.text(currencyFmt(ded.amount), rightX + leftWidth - 60, dedY, { width: 60, align: 'right' });
    dedY += 14;
  }

  const maxY = Math.max(rowY, dedY) + 4;

  // Totals
  drawLine(doc, col1X, maxY, col1X + leftWidth, maxY);
  drawLine(doc, rightX, maxY, rightX + leftWidth, maxY);

  doc.font('Helvetica-Bold');
  doc.text('Gross Salary', col1X, maxY + 4);
  doc.text(currencyFmt(data.grossSalary), col1X + leftWidth - 60, maxY + 4, { width: 60, align: 'right' });

  doc.text('Total Deductions', rightX, maxY + 4);
  doc.text(currencyFmt(data.totalDeductions), rightX + leftWidth - 60, maxY + 4, { width: 60, align: 'right' });

  doc.y = maxY + 28;
  drawLine(doc, 50, doc.y, 545, doc.y);
  doc.moveDown(0.5);

  // ─── Employer Contributions ──────────────────────────────────────────────
  if (data.employerContributions.length > 0) {
    doc.fontSize(10).font('Helvetica-Bold').text('Employer Contributions', col1X, doc.y, { width: pageWidth });
    doc.moveDown(0.3);
    doc.fontSize(9).font('Helvetica');
    for (const contrib of data.employerContributions) {
      doc.text(`${contrib.name}: ${currencyFmt(contrib.amount)}`, col1X, doc.y, { width: pageWidth });
    }
    doc.font('Helvetica-Bold').text(`Total Employer Contributions: ${currencyFmt(data.totalEmployerContributions)}`, col1X, doc.y, { width: pageWidth });
    doc.moveDown(0.5);
    drawLine(doc, 50, doc.y, 545, doc.y);
    doc.moveDown(0.5);
  }

  // ─── Net Pay ─────────────────────────────────────────────────────────────
  doc.fontSize(14).font('Helvetica-Bold');
  doc.text(`Net Pay: ${currencyFmt(data.netSalary)}`, col1X, doc.y, { width: pageWidth, align: 'center' });
  doc.moveDown(1);

  // ─── Footer ──────────────────────────────────────────────────────────────
  doc.fontSize(7).font('Helvetica')
    .text('This is a computer-generated payslip and does not require a signature.', col1X, doc.y, { width: pageWidth, align: 'center' });

  return doc;
}

function drawLine(doc: InstanceType<typeof PDFDocument>, x1: number, y1: number, x2: number, y2: number) {
  doc.save()
    .moveTo(x1, y1)
    .lineTo(x2, y2)
    .strokeColor('#cccccc')
    .lineWidth(0.5)
    .stroke()
    .restore();
}
