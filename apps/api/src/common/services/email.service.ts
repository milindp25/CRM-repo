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
    switch (template) {
      case 'invitation':
        return {
          subject: `You've been invited to join ${ctx.companyName || 'the team'} on HR Platform`,
          html: this.wrapHtml(`
            <h2>You're Invited!</h2>
            <p>Hi${ctx.recipientName ? ` ${ctx.recipientName}` : ''},</p>
            <p>${ctx.inviterName || 'A team administrator'} has invited you to join
              <strong>${ctx.companyName || 'their organization'}</strong> on HR Platform
              as <strong>${ctx.role || 'a team member'}</strong>.</p>
            ${ctx.invitationUrl ? `<p><a href="${ctx.invitationUrl}" style="display:inline-block;padding:12px 24px;background-color:#4F46E5;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;">Accept Invitation</a></p>` : ''}
            <p>This invitation will expire in 7 days.</p>
          `),
        };

      case 'leave-approved':
        return {
          subject: `Your ${ctx.leaveType || 'leave'} request has been approved`,
          html: this.wrapHtml(`
            <h2>Leave Request Approved</h2>
            <p>Hi${ctx.recipientName ? ` ${ctx.recipientName}` : ''},</p>
            <p>Your leave request has been <strong style="color:#16A34A;">approved</strong>${ctx.approverName ? ` by ${ctx.approverName}` : ''}.</p>
            <table style="border-collapse:collapse;margin:16px 0;">
              <tr><td style="padding:8px 16px 8px 0;font-weight:600;">Type:</td><td style="padding:8px 0;">${ctx.leaveType || 'N/A'}</td></tr>
              <tr><td style="padding:8px 16px 8px 0;font-weight:600;">From:</td><td style="padding:8px 0;">${ctx.startDate || 'N/A'}</td></tr>
              <tr><td style="padding:8px 16px 8px 0;font-weight:600;">To:</td><td style="padding:8px 0;">${ctx.endDate || 'N/A'}</td></tr>
              ${ctx.totalDays !== undefined ? `<tr><td style="padding:8px 16px 8px 0;font-weight:600;">Total Days:</td><td style="padding:8px 0;">${ctx.totalDays}</td></tr>` : ''}
            </table>
          `),
        };

      case 'leave-rejected':
        return {
          subject: `Your ${ctx.leaveType || 'leave'} request has been rejected`,
          html: this.wrapHtml(`
            <h2>Leave Request Rejected</h2>
            <p>Hi${ctx.recipientName ? ` ${ctx.recipientName}` : ''},</p>
            <p>Your leave request has been <strong style="color:#DC2626;">rejected</strong>${ctx.approverName ? ` by ${ctx.approverName}` : ''}.</p>
            <table style="border-collapse:collapse;margin:16px 0;">
              <tr><td style="padding:8px 16px 8px 0;font-weight:600;">Type:</td><td style="padding:8px 0;">${ctx.leaveType || 'N/A'}</td></tr>
              <tr><td style="padding:8px 16px 8px 0;font-weight:600;">From:</td><td style="padding:8px 0;">${ctx.startDate || 'N/A'}</td></tr>
              <tr><td style="padding:8px 16px 8px 0;font-weight:600;">To:</td><td style="padding:8px 0;">${ctx.endDate || 'N/A'}</td></tr>
            </table>
            ${ctx.rejectionReason ? `<p><strong>Reason:</strong> ${ctx.rejectionReason}</p>` : ''}
          `),
        };

      case 'welcome':
        return {
          subject: `Welcome to ${ctx.companyName || 'HR Platform'}!`,
          html: this.wrapHtml(`
            <h2>Welcome Aboard!</h2>
            <p>Hi${ctx.recipientName ? ` ${ctx.recipientName}` : ''},</p>
            <p>Welcome to <strong>${ctx.companyName || 'HR Platform'}</strong>! Your account has been set up successfully.</p>
            <p>You can now access all the features available to you, including:</p>
            <ul>
              <li>View and manage your profile</li>
              <li>Apply for leaves</li>
              <li>Track your attendance</li>
              <li>Access your payslips</li>
            </ul>
            ${ctx.loginUrl ? `<p><a href="${ctx.loginUrl}" style="display:inline-block;padding:12px 24px;background-color:#4F46E5;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;">Go to Dashboard</a></p>` : ''}
          `),
        };

      case 'password-reset':
        return {
          subject: 'Reset Your Password - HR Platform',
          html: this.wrapHtml(`
            <h2>Password Reset Request</h2>
            <p>Hi${ctx.recipientName ? ` ${ctx.recipientName}` : ''},</p>
            <p>We received a request to reset your password. Click the button below to set a new password:</p>
            ${ctx.resetUrl ? `<p><a href="${ctx.resetUrl}" style="display:inline-block;padding:12px 24px;background-color:#4F46E5;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;">Reset Password</a></p>` : ''}
            <p>This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
          `),
        };

      default: {
        const _exhaustiveCheck: never = template;
        throw new Error(`Unknown email template: ${_exhaustiveCheck}`);
      }
    }
  }

  private wrapHtml(body: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,sans-serif;background-color:#f4f4f5;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background-color:#ffffff;border-radius:8px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      ${body}
    </div>
    <div style="text-align:center;margin-top:24px;color:#71717A;font-size:12px;">
      <p>This is an automated message from HR Platform. Please do not reply directly to this email.</p>
    </div>
  </div>
</body>
</html>`.trim();
  }
}
