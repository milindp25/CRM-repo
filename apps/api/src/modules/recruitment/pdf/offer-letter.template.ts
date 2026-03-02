import PDFDocument from 'pdfkit';

export interface OfferLetterData {
  // Company
  companyName: string;
  companyAddress?: string;

  // Candidate
  candidateName: string;
  candidateEmail: string;

  // Job details
  jobTitle: string;
  jobType: string; // FULL_TIME, PART_TIME, etc.
  department?: string;
  location?: string;

  // Offer details
  offerDate: string; // formatted date
  joinDate?: string;
  salary?: string; // formatted salary
  currency: string;

  // Generated
  currentDate: string;
}

function drawLine(doc: InstanceType<typeof PDFDocument>, x1: number, y: number, x2: number, _y2: number) {
  doc.strokeColor('#CBD5E1').lineWidth(0.5).moveTo(x1, y).lineTo(x2, y).stroke();
}

export function generateOfferLetterPdf(data: OfferLetterData): InstanceType<typeof PDFDocument> {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 50, left: 60, right: 60 },
  });

  const pageWidth = 595.28 - 120; // A4 minus margins
  const leftX = 60;

  // ─── Letterhead ──────────────────────────────────────────────────────────

  doc.fontSize(22).font('Helvetica-Bold').fillColor('#1E293B').text(data.companyName, { align: 'center' });
  if (data.companyAddress) {
    doc.fontSize(9).font('Helvetica').fillColor('#64748B').text(data.companyAddress, { align: 'center' });
  }

  doc.moveDown(0.5);
  drawLine(doc, leftX, doc.y, leftX + pageWidth, doc.y);
  doc.moveDown(1);

  // ─── Date ────────────────────────────────────────────────────────────────

  doc.fontSize(10).font('Helvetica').fillColor('#475569').text(`Date: ${data.currentDate}`, leftX);
  doc.moveDown(1.5);

  // ─── Subject ─────────────────────────────────────────────────────────────

  doc.fontSize(14).font('Helvetica-Bold').fillColor('#1E293B').text('Offer of Employment', { align: 'center' });
  doc.moveDown(1.5);

  // ─── Salutation ──────────────────────────────────────────────────────────

  doc.fontSize(11).font('Helvetica').fillColor('#1E293B');
  doc.text(`Dear ${data.candidateName},`, leftX);
  doc.moveDown(0.8);

  // ─── Body ────────────────────────────────────────────────────────────────

  doc.text(
    `We are pleased to offer you the position of ${data.jobTitle} at ${data.companyName}. ` +
    `After careful evaluation, we believe your skills and experience will be a valuable addition to our team.`,
    leftX,
    undefined,
    { width: pageWidth, lineGap: 4 },
  );

  doc.moveDown(0.8);
  doc.text(
    'Please review the details of your offer below:',
    leftX,
    undefined,
    { width: pageWidth },
  );

  doc.moveDown(1);

  // ─── Offer Details Table ─────────────────────────────────────────────────

  const detailsX = leftX + 20;
  const valueX = leftX + 180;
  let y = doc.y;

  const addDetailRow = (label: string, value: string) => {
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#64748B').text(label, detailsX, y);
    doc.font('Helvetica').fillColor('#1E293B').text(value, valueX, y);
    y += 22;
  };

  // Background box
  doc.save();
  const boxHeight = (data.salary ? 6 : 5) * 22 + 20;
  doc.rect(leftX + 10, y - 10, pageWidth - 20, boxHeight).fillColor('#F8FAFC').fill();
  doc.restore();

  addDetailRow('Position:', data.jobTitle);
  addDetailRow('Employment Type:', formatJobType(data.jobType));
  if (data.department) addDetailRow('Department:', data.department);
  if (data.location) addDetailRow('Location:', data.location);
  if (data.joinDate) addDetailRow('Start Date:', data.joinDate);
  if (data.salary) addDetailRow('Annual Compensation:', `${data.currency} ${data.salary}`);

  doc.y = y + 10;
  doc.moveDown(1);

  // ─── Terms ───────────────────────────────────────────────────────────────

  doc.fontSize(11).font('Helvetica').fillColor('#1E293B');
  doc.text(
    'This offer is contingent upon successful completion of background verification and submission of required documents. ' +
    'The detailed terms and conditions of employment will be provided in your appointment letter upon joining.',
    leftX,
    undefined,
    { width: pageWidth, lineGap: 4 },
  );

  doc.moveDown(0.8);
  doc.text(
    'We kindly request you to confirm your acceptance of this offer within 7 business days from the date of this letter.',
    leftX,
    undefined,
    { width: pageWidth, lineGap: 4 },
  );

  doc.moveDown(0.8);
  doc.text(
    'We are excited about the prospect of you joining our team and look forward to your positive response.',
    leftX,
    undefined,
    { width: pageWidth, lineGap: 4 },
  );

  doc.moveDown(1.5);

  // ─── Closing ─────────────────────────────────────────────────────────────

  doc.text('Warm regards,', leftX);
  doc.moveDown(2);

  drawLine(doc, leftX, doc.y, leftX + 180, doc.y);
  doc.moveDown(0.3);

  doc.fontSize(10).font('Helvetica-Bold').text('Authorized Signatory', leftX);
  doc.font('Helvetica').fillColor('#64748B').text(data.companyName, leftX);

  // ─── Footer ──────────────────────────────────────────────────────────────

  doc.moveDown(3);
  drawLine(doc, leftX, doc.y, leftX + pageWidth, doc.y);
  doc.moveDown(0.5);
  doc.fontSize(8).font('Helvetica').fillColor('#94A3B8').text(
    'This is a system-generated offer letter from HR Platform.',
    leftX,
    undefined,
    { align: 'center', width: pageWidth },
  );

  return doc;
}

function formatJobType(type: string): string {
  switch (type) {
    case 'FULL_TIME': return 'Full-Time';
    case 'PART_TIME': return 'Part-Time';
    case 'CONTRACT': return 'Contract';
    case 'INTERN': return 'Internship';
    case 'REMOTE': return 'Remote';
    default: return type;
  }
}
