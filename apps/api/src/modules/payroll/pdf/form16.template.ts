import PDFDocument from 'pdfkit';

export interface Form16Data {
  companyName: string;
  companyPan: string;
  companyTan: string;
  companyAddress?: string;

  employeeName: string;
  employeeCode: string;
  pan: string;
  uan?: string;

  fiscalYear: string; // "2025-26"
  assessmentYear: string; // "2026-27"

  quarterlyTds: Array<{
    quarter: string; // Q1, Q2, Q3, Q4
    tdsDeducted: number;
    tdsDeposited: number;
  }>;

  annualIncome: number;
  standardDeduction: number;
  taxableIncome: number;
  taxOnIncome: number;
  rebate87A: number;
  cess: number;
  totalTaxLiability: number;
  totalTdsDeducted: number;
  taxRegime: string; // NEW or OLD
}

export function generateForm16Pdf(data: Form16Data): InstanceType<typeof PDFDocument> {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 40, bottom: 40, left: 50, right: 50 },
  });

  const currencyFmt = (v: number) => `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;

  // ─── Part A: Certificate ─────────────────────────────────────────────────
  doc.fontSize(14).font('Helvetica-Bold').text('FORM No. 16', { align: 'center' });
  doc.fontSize(9).font('Helvetica').text('[See rule 31(1)(a)]', { align: 'center' });
  doc.moveDown(0.3);
  doc.fontSize(10).font('Helvetica-Bold').text('Certificate under section 203 of the Income-tax Act, 1961', { align: 'center' });
  doc.fontSize(9).font('Helvetica').text('for tax deducted at source from income chargeable under the head "Salaries"', { align: 'center' });
  doc.moveDown(0.5);

  doc.fontSize(12).font('Helvetica-Bold').text('PART A', { align: 'center' });
  doc.moveDown(0.5);

  // Employer details
  doc.fontSize(9).font('Helvetica-Bold').text('Name of the Deductor (Employer):');
  doc.font('Helvetica').text(data.companyName);
  doc.moveDown(0.2);
  doc.font('Helvetica-Bold').text(`TAN of the Deductor: ${data.companyTan}`);
  doc.font('Helvetica-Bold').text(`PAN of the Deductor: ${data.companyPan}`);
  if (data.companyAddress) {
    doc.font('Helvetica').text(`Address: ${data.companyAddress}`);
  }
  doc.moveDown(0.3);

  // Employee details
  doc.font('Helvetica-Bold').text('Name of the Employee:');
  doc.font('Helvetica').text(data.employeeName);
  doc.font('Helvetica-Bold').text(`PAN of the Employee: ${data.pan}`);
  doc.font('Helvetica-Bold').text(`Employee Code: ${data.employeeCode}`);
  doc.moveDown(0.3);

  doc.font('Helvetica-Bold').text(`Assessment Year: ${data.assessmentYear}`);
  doc.font('Helvetica-Bold').text(`Financial Year: ${data.fiscalYear}`);
  doc.moveDown(0.5);

  // Quarterly TDS table
  doc.fontSize(10).font('Helvetica-Bold').text('Summary of TDS Deducted and Deposited');
  doc.moveDown(0.3);

  // Table header
  const tableX = 50;
  let tY = doc.y;
  doc.fontSize(9).font('Helvetica-Bold');
  doc.text('Quarter', tableX, tY, { width: 100 });
  doc.text('TDS Deducted', tableX + 150, tY, { width: 120, align: 'right' });
  doc.text('TDS Deposited', tableX + 300, tY, { width: 120, align: 'right' });
  tY += 16;

  doc.font('Helvetica');
  let totalDeducted = 0;
  let totalDeposited = 0;
  for (const q of data.quarterlyTds) {
    doc.text(q.quarter, tableX, tY, { width: 100 });
    doc.text(currencyFmt(q.tdsDeducted), tableX + 150, tY, { width: 120, align: 'right' });
    doc.text(currencyFmt(q.tdsDeposited), tableX + 300, tY, { width: 120, align: 'right' });
    totalDeducted += q.tdsDeducted;
    totalDeposited += q.tdsDeposited;
    tY += 14;
  }

  doc.font('Helvetica-Bold');
  doc.text('Total', tableX, tY, { width: 100 });
  doc.text(currencyFmt(totalDeducted), tableX + 150, tY, { width: 120, align: 'right' });
  doc.text(currencyFmt(totalDeposited), tableX + 300, tY, { width: 120, align: 'right' });

  doc.y = tY + 30;

  // ─── Part B: Computation ─────────────────────────────────────────────────
  doc.fontSize(12).font('Helvetica-Bold').text('PART B', { align: 'center' });
  doc.fontSize(9).font('Helvetica').text(`(Annexure to Form 16) — Tax Regime: ${data.taxRegime === 'NEW' ? 'New Regime (Section 115BAC)' : 'Old Regime'}`, { align: 'center' });
  doc.moveDown(0.5);

  const rows: Array<[string, string]> = [
    ['1. Gross Salary', currencyFmt(data.annualIncome)],
    ['2. Less: Standard Deduction (u/s 16(ia))', currencyFmt(data.standardDeduction)],
    ['3. Total Taxable Income (1 - 2)', currencyFmt(data.taxableIncome)],
    ['4. Tax on Total Income', currencyFmt(data.taxOnIncome)],
    ['5. Less: Rebate u/s 87A', currencyFmt(data.rebate87A)],
    ['6. Tax after Rebate', currencyFmt(Math.max(0, data.taxOnIncome - data.rebate87A))],
    ['7. Add: Health & Education Cess @ 4%', currencyFmt(data.cess)],
    ['8. Total Tax Liability', currencyFmt(data.totalTaxLiability)],
    ['9. Total TDS Deducted', currencyFmt(data.totalTdsDeducted)],
  ];

  let rY = doc.y;
  doc.fontSize(9);
  for (const [label, value] of rows) {
    doc.font('Helvetica').text(label, 50, rY, { width: 350 });
    doc.font('Helvetica-Bold').text(value, 400, rY, { width: 100, align: 'right' });
    rY += 16;
  }

  doc.y = rY + 20;

  // Footer
  doc.fontSize(7).font('Helvetica')
    .text('This is a computer-generated Form 16 and does not require a signature.', { align: 'center' });

  return doc;
}
