import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { LoggerService } from './logger.service';

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

export type EmailTemplate =
  | 'invitation'
  | 'leave-approved'
  | 'leave-rejected'
  | 'welcome'
  | 'password-reset';

export interface EmailTemplateContext {
  // Common
  recipientName?: string;
  companyName?: string;

  // Invitation
  inviterName?: string;
  invitationUrl?: string;
  role?: string;

  // Leave
  leaveType?: string;
  startDate?: string;
  endDate?: string;
  totalDays?: number;
  reason?: string;
  approverName?: string;
  rejectionReason?: string;

  // Password reset
  resetUrl?: string;

  // Welcome
  loginUrl?: string;
}

@Injectable()
export class EmailService {
  private transporter: Transporter | null = null;
  private readonly fromAddress: string;
  private readonly isConfigured: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');
    this.fromAddress =
      this.configService.get<string>('SMTP_FROM') ||
      'noreply@hrplatform.com';

    if (!host) {
      this.logger.warn(
        'SMTP_HOST is not configured. Email sending will be skipped.',
        'EmailService',
      );
      this.isConfigured = false;
      return;
    }

    this.isConfigured = true;
    this.transporter = nodemailer.createTransport({
      host,
      port: port || 587,
      secure: port === 465,
      auth:
        user && pass
          ? {
              user,
              pass,
            }
          : undefined,
    });

    this.logger.log('Email service initialized', 'EmailService');
  }

  async sendMail(to: string, subject: string, html: string): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      this.logger.warn(
        `Email not sent to ${to} (SMTP not configured): ${subject}`,
        'EmailService',
      );
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent to ${to}: ${subject}`, 'EmailService');
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${to}: ${(error as Error).message}`,
        (error as Error).stack,
        'EmailService',
      );
      return false;
    }
  }

  async sendTemplatedMail(
    to: string,
    template: EmailTemplate,
    context: EmailTemplateContext,
  ): Promise<boolean> {
    const { subject, html } = this.renderTemplate(template, context);
    return this.sendMail(to, subject, html);
  }

  private renderTemplate(
    template: EmailTemplate,
    ctx: EmailTemplateContext,
  ): { subject: string; html: string } {
    const greeting = `Hi${ctx.recipientName ? ` ${ctx.recipientName}` : ''}`;

    switch (template) {
      case 'invitation':
        return {
          subject: `You've been invited to join ${ctx.companyName || 'the team'} on HR Platform`,
          html: this.wrapHtml(`
            <div style="text-align:center;margin-bottom:24px;">
              <div style="display:inline-block;width:56px;height:56px;border-radius:50%;background-color:#EEF2FF;line-height:56px;font-size:28px;">&#9993;</div>
            </div>
            <h2 style="color:#1E293B;font-size:22px;font-weight:700;margin:0 0 16px;text-align:center;">You're Invited!</h2>
            <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 12px;">${greeting},</p>
            <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 20px;">
              ${ctx.inviterName || 'A team administrator'} has invited you to join
              <strong style="color:#1E293B;">${ctx.companyName || 'their organization'}</strong> on HR Platform
              as <strong style="color:#1E293B;">${ctx.role || 'a team member'}</strong>.
            </p>
            ${ctx.invitationUrl ? this.renderButton('Accept Invitation', ctx.invitationUrl) : ''}
            <p style="color:#94A3B8;font-size:13px;line-height:1.5;margin:20px 0 0;text-align:center;">This invitation will expire in 7 days.</p>
          `),
        };

      case 'leave-approved':
        return {
          subject: `Your ${ctx.leaveType || 'leave'} request has been approved`,
          html: this.wrapHtml(`
            <div style="text-align:center;margin-bottom:24px;">
              <div style="display:inline-block;width:56px;height:56px;border-radius:50%;background-color:#DCFCE7;line-height:56px;font-size:28px;">&#10003;</div>
            </div>
            <h2 style="color:#1E293B;font-size:22px;font-weight:700;margin:0 0 16px;text-align:center;">Leave Request Approved</h2>
            <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 12px;">${greeting},</p>
            <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 20px;">
              Your leave request has been <strong style="color:#16A34A;">approved</strong>${ctx.approverName ? ` by <strong style="color:#1E293B;">${ctx.approverName}</strong>` : ''}.
            </p>
            ${this.renderDetailTable([
              ['Leave Type', ctx.leaveType || 'N/A'],
              ['From', ctx.startDate || 'N/A'],
              ['To', ctx.endDate || 'N/A'],
              ...(ctx.totalDays !== undefined ? [['Total Days', String(ctx.totalDays)] as [string, string]] : []),
            ])}
          `),
        };

      case 'leave-rejected':
        return {
          subject: `Your ${ctx.leaveType || 'leave'} request has been rejected`,
          html: this.wrapHtml(`
            <div style="text-align:center;margin-bottom:24px;">
              <div style="display:inline-block;width:56px;height:56px;border-radius:50%;background-color:#FEE2E2;line-height:56px;font-size:28px;">&#10007;</div>
            </div>
            <h2 style="color:#1E293B;font-size:22px;font-weight:700;margin:0 0 16px;text-align:center;">Leave Request Rejected</h2>
            <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 12px;">${greeting},</p>
            <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 20px;">
              Your leave request has been <strong style="color:#DC2626;">rejected</strong>${ctx.approverName ? ` by <strong style="color:#1E293B;">${ctx.approverName}</strong>` : ''}.
            </p>
            ${this.renderDetailTable([
              ['Leave Type', ctx.leaveType || 'N/A'],
              ['From', ctx.startDate || 'N/A'],
              ['To', ctx.endDate || 'N/A'],
            ])}
            ${ctx.rejectionReason ? `<div style="margin-top:16px;padding:12px 16px;background-color:#FEF2F2;border-left:4px solid #DC2626;border-radius:0 6px 6px 0;"><p style="margin:0;color:#991B1B;font-size:14px;"><strong>Reason:</strong> ${ctx.rejectionReason}</p></div>` : ''}
          `),
        };

      case 'welcome':
        return {
          subject: `Welcome to ${ctx.companyName || 'HR Platform'}!`,
          html: this.wrapHtml(`
            <div style="text-align:center;margin-bottom:24px;">
              <div style="display:inline-block;width:56px;height:56px;border-radius:50%;background-color:#EEF2FF;line-height:56px;font-size:28px;">&#127881;</div>
            </div>
            <h2 style="color:#1E293B;font-size:22px;font-weight:700;margin:0 0 16px;text-align:center;">Welcome Aboard!</h2>
            <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 12px;">${greeting},</p>
            <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 20px;">
              Welcome to <strong style="color:#1E293B;">${ctx.companyName || 'HR Platform'}</strong>! Your account has been set up successfully.
            </p>
            <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 8px;">You can now access all the features available to you:</p>
            <ul style="color:#475569;font-size:14px;line-height:1.8;margin:0 0 24px;padding-left:20px;">
              <li>View and manage your profile</li>
              <li>Apply for leaves</li>
              <li>Track your attendance</li>
              <li>Access your payslips</li>
            </ul>
            ${ctx.loginUrl ? this.renderButton('Go to Dashboard', ctx.loginUrl) : ''}
          `),
        };

      case 'password-reset':
        return {
          subject: 'Reset Your Password - HR Platform',
          html: this.wrapHtml(`
            <div style="text-align:center;margin-bottom:24px;">
              <div style="display:inline-block;width:56px;height:56px;border-radius:50%;background-color:#FEF3C7;line-height:56px;font-size:28px;">&#128274;</div>
            </div>
            <h2 style="color:#1E293B;font-size:22px;font-weight:700;margin:0 0 16px;text-align:center;">Password Reset Request</h2>
            <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 12px;">${greeting},</p>
            <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 24px;">
              We received a request to reset your password. Click the button below to set a new password:
            </p>
            ${ctx.resetUrl ? this.renderButton('Reset Password', ctx.resetUrl, '#DC2626') : ''}
            <p style="color:#94A3B8;font-size:13px;line-height:1.5;margin:20px 0 0;text-align:center;">
              This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
            </p>
          `),
        };

      default: {
        const _exhaustiveCheck: never = template;
        throw new Error(`Unknown email template: ${_exhaustiveCheck}`);
      }
    }
  }

  private renderButton(text: string, url: string, bgColor = '#4F46E5'): string {
    return `
      <div style="text-align:center;margin:24px 0;">
        <a href="${url}" style="display:inline-block;padding:14px 32px;background-color:${bgColor};color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;letter-spacing:0.3px;">
          ${text}
        </a>
      </div>`;
  }

  private renderDetailTable(rows: [string, string][]): string {
    const rowsHtml = rows.map(([label, value]) => `
      <tr>
        <td style="padding:10px 16px;font-weight:600;color:#64748B;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;white-space:nowrap;">${label}</td>
        <td style="padding:10px 16px;color:#1E293B;font-size:14px;font-weight:500;">${value}</td>
      </tr>`).join('');

    return `
      <table style="width:100%;border-collapse:collapse;margin:16px 0;background-color:#F8FAFC;border-radius:8px;overflow:hidden;">
        ${rowsHtml}
      </table>`;
  }

  private wrapHtml(body: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>HR Platform</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#F1F5F9;-webkit-font-smoothing:antialiased;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <!-- Header -->
    <div style="text-align:center;margin-bottom:24px;">
      <h1 style="margin:0;font-size:20px;font-weight:700;color:#4F46E5;letter-spacing:-0.5px;">HR Platform</h1>
    </div>
    <!-- Content Card -->
    <div style="background-color:#ffffff;border-radius:12px;padding:36px 32px;box-shadow:0 1px 3px rgba(0,0,0,0.08),0 1px 2px rgba(0,0,0,0.06);">
      ${body}
    </div>
    <!-- Footer -->
    <div style="text-align:center;margin-top:32px;padding:0 20px;">
      <p style="margin:0 0 8px;color:#94A3B8;font-size:12px;line-height:1.5;">
        This is an automated message from HR Platform. Please do not reply directly to this email.
      </p>
      <div style="margin-top:16px;padding-top:16px;border-top:1px solid #E2E8F0;">
        <p style="margin:0;color:#CBD5E1;font-size:11px;">
          Powered by HR Platform &middot; Secure &middot; Reliable
        </p>
      </div>
    </div>
  </div>
</body>
</html>`.trim();
  }
}
