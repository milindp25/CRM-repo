import PDFDocument from 'pdfkit';

export interface W2Data {
  // Employer info
  employerName: string;
  employerEin: string;
  employerAddress?: string;
  employerStateId?: string;

  // Employee info
  employeeName: string;
  employeeSsn: string; // Masked: ***-**-1234
  employeeAddress?: string;

  taxYear: number;

  // W-2 Boxes
  box1WagesTips: number; // Wages, tips, other compensation
  box2FederalTaxWithheld: number;
  box3SsWages: number;
  box4SsTaxWithheld: number;
  box5MedicareWages: number;
  box6MedicareTaxWithheld: number;
  box7SsTips: number;
  box12Codes: Array<{ code: string; amount: number }>; // e.g., DD for health insurance
  box15State: string;
  box16StateWages: number;
  box17StateTaxWithheld: number;

  currency: string;
}

export function generateW2Pdf(data: W2Data): InstanceType<typeof PDFDocument> {
  const doc = new PDFDocument({
    size: 'LETTER',
    margins: { top: 40, bottom: 40, left: 50, right: 50 },
  });

  const currencyFmt = (v: number) => `$${v.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  // ─── Header ──────────────────────────────────────────────────────────────
  doc.fontSize(16).font('Helvetica-Bold').text(`Form W-2 — Wage and Tax Statement`, { align: 'center' });
  doc.fontSize(10).font('Helvetica').text(`Tax Year ${data.taxYear}`, { align: 'center' });
  doc.fontSize(8).font('Helvetica').text('Department of the Treasury — Internal Revenue Service', { align: 'center' });
  doc.moveDown(0.5);

  const boxWidth = 230;
  const leftX = 50;
  const rightX = 310;
  let y = doc.y;

  // ─── Employer / Employee Info ────────────────────────────────────────────
  drawBox(doc, leftX, y, boxWidth * 2 + 30, 60);
  doc.fontSize(7).font('Helvetica').text('a  Employee\'s social security number', leftX + 5, y + 3);
  doc.fontSize(11).font('Helvetica-Bold').text(data.employeeSsn, leftX + 5, y + 14);

  doc.fontSize(7).font('Helvetica').text('b  Employer identification number (EIN)', rightX + 5, y + 3);
  doc.fontSize(11).font('Helvetica-Bold').text(data.employerEin, rightX + 5, y + 14);

  y += 65;
  drawBox(doc, leftX, y, boxWidth * 2 + 30, 48);
  doc.fontSize(7).font('Helvetica').text('c  Employer\'s name, address, and ZIP code', leftX + 5, y + 3);
  doc.fontSize(9).font('Helvetica').text(data.employerName, leftX + 5, y + 14);
  if (data.employerAddress) {
    doc.fontSize(8).text(data.employerAddress, leftX + 5, y + 26);
  }

  y += 53;
  drawBox(doc, leftX, y, boxWidth * 2 + 30, 48);
  doc.fontSize(7).font('Helvetica').text('e  Employee\'s name, address, and ZIP code', leftX + 5, y + 3);
  doc.fontSize(9).font('Helvetica').text(data.employeeName, leftX + 5, y + 14);
  if (data.employeeAddress) {
    doc.fontSize(8).text(data.employeeAddress, leftX + 5, y + 26);
  }

  y += 58;

  // ─── W-2 Boxes (Numbered) ───────────────────────────────────────────────
  const boxH = 40;

  // Box 1 & 2
  drawLabeledBox(doc, leftX, y, boxWidth, boxH, '1  Wages, tips, other compensation', currencyFmt(data.box1WagesTips));
  drawLabeledBox(doc, rightX, y, boxWidth, boxH, '2  Federal income tax withheld', currencyFmt(data.box2FederalTaxWithheld));
  y += boxH + 5;

  // Box 3 & 4
  drawLabeledBox(doc, leftX, y, boxWidth, boxH, '3  Social security wages', currencyFmt(data.box3SsWages));
  drawLabeledBox(doc, rightX, y, boxWidth, boxH, '4  Social security tax withheld', currencyFmt(data.box4SsTaxWithheld));
  y += boxH + 5;

  // Box 5 & 6
  drawLabeledBox(doc, leftX, y, boxWidth, boxH, '5  Medicare wages and tips', currencyFmt(data.box5MedicareWages));
  drawLabeledBox(doc, rightX, y, boxWidth, boxH, '6  Medicare tax withheld', currencyFmt(data.box6MedicareTaxWithheld));
  y += boxH + 5;

  // Box 7
  drawLabeledBox(doc, leftX, y, boxWidth, boxH, '7  Social security tips', currencyFmt(data.box7SsTips));
  y += boxH + 5;

  // Box 12 codes
  if (data.box12Codes.length > 0) {
    drawBox(doc, leftX, y, boxWidth * 2 + 30, 14 + data.box12Codes.length * 14);
    doc.fontSize(7).font('Helvetica').text('12a-d', leftX + 5, y + 3);
    let cY = y + 14;
    doc.fontSize(9).font('Helvetica');
    for (const code of data.box12Codes) {
      doc.text(`Code ${code.code}: ${currencyFmt(code.amount)}`, leftX + 15, cY);
      cY += 14;
    }
    y = cY + 8;
  }

  // Box 15-17 (State)
  if (data.box15State) {
    drawBox(doc, leftX, y, boxWidth * 2 + 30, boxH);
    doc.fontSize(7).font('Helvetica').text('15 State', leftX + 5, y + 3);
    doc.fontSize(9).font('Helvetica-Bold').text(data.box15State, leftX + 5, y + 14);

    doc.fontSize(7).font('Helvetica').text('16 State wages, tips, etc.', leftX + 80, y + 3);
    doc.fontSize(9).font('Helvetica-Bold').text(currencyFmt(data.box16StateWages), leftX + 80, y + 14);

    doc.fontSize(7).font('Helvetica').text('17 State income tax', rightX + 5, y + 3);
    doc.fontSize(9).font('Helvetica-Bold').text(currencyFmt(data.box17StateTaxWithheld), rightX + 5, y + 14);
  }

  // Footer
  doc.y = 700;
  doc.fontSize(7).font('Helvetica')
    .text('This is a computer-generated Form W-2 for informational purposes.', { align: 'center' });

  return doc;
}

function drawBox(doc: InstanceType<typeof PDFDocument>, x: number, y: number, w: number, h: number) {
  doc.save()
    .rect(x, y, w, h)
    .strokeColor('#999999')
    .lineWidth(0.5)
    .stroke()
    .restore();
}

function drawLabeledBox(doc: InstanceType<typeof PDFDocument>, x: number, y: number, w: number, h: number, label: string, value: string) {
  drawBox(doc, x, y, w, h);
  doc.fontSize(7).font('Helvetica').text(label, x + 5, y + 3, { width: w - 10 });
  doc.fontSize(11).font('Helvetica-Bold').text(value, x + 5, y + 16, { width: w - 10 });
}
