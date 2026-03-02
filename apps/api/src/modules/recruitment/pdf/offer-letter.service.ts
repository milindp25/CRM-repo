import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { generateOfferLetterPdf, OfferLetterData } from './offer-letter.template';

@Injectable()
export class OfferLetterService {
  constructor(private readonly prisma: PrismaService) {}

  async generateOfferLetter(applicantId: string, companyId: string): Promise<Buffer> {
    const applicant = await this.prisma.applicant.findFirst({
      where: { id: applicantId, companyId },
      include: {
        jobPosting: {
          select: {
            title: true,
            jobType: true,
            location: true,
            salaryMin: true,
            salaryMax: true,
            currency: true,
            departmentId: true,
          },
        },
      },
    });

    if (!applicant) {
      throw new NotFoundException(`Applicant ${applicantId} not found`);
    }

    // Must be in OFFER or HIRED stage
    if (!['OFFER', 'HIRED'].includes(applicant.stage)) {
      throw new BadRequestException(
        `Cannot generate offer letter for applicant in ${applicant.stage} stage. Move to OFFER stage first.`,
      );
    }

    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: {
        companyName: true,
        addressLine1: true,
        city: true,
        state: true,
        country: true,
      },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Build company address
    const addressParts = [company.addressLine1, company.city, company.state, company.country].filter(Boolean);
    const companyAddress = addressParts.length > 0 ? addressParts.join(', ') : undefined;

    // Get department name if available
    let departmentName: string | undefined;
    if (applicant.jobPosting.departmentId) {
      const dept = await this.prisma.department.findUnique({
        where: { id: applicant.jobPosting.departmentId },
        select: { name: true },
      });
      departmentName = dept?.name;
    }

    // Format salary
    let salaryStr: string | undefined;
    const currency = applicant.jobPosting.currency || 'INR';
    if (applicant.offerSalary) {
      salaryStr = Number(applicant.offerSalary).toLocaleString('en-IN');
    } else if (applicant.jobPosting.salaryMax) {
      salaryStr = Number(applicant.jobPosting.salaryMax).toLocaleString('en-IN');
    }

    const currencySymbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency;

    const offerData: OfferLetterData = {
      companyName: company.companyName,
      companyAddress,
      candidateName: `${applicant.firstName} ${applicant.lastName}`,
      candidateEmail: applicant.email,
      jobTitle: applicant.jobPosting.title,
      jobType: applicant.jobPosting.jobType,
      department: departmentName,
      location: applicant.jobPosting.location ?? undefined,
      offerDate: applicant.offerDate
        ? this.formatDate(applicant.offerDate)
        : this.formatDate(new Date()),
      joinDate: applicant.joinDate ? this.formatDate(applicant.joinDate) : undefined,
      salary: salaryStr,
      currency: currencySymbol,
      currentDate: this.formatDate(new Date()),
    };

    const pdfDoc = generateOfferLetterPdf(offerData);
    return this.pdfToBuffer(pdfDoc);
  }

  private formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  private pdfToBuffer(doc: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      doc.end();
    });
  }
}
