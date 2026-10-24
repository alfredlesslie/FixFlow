import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { IMailService, SendVerificationEmailOptions, SentEmailRecord } from './mail.interface';
import { isDevTokenInspectionEnabled } from '../common/config/environment.helper';

@Injectable()
export class MailService implements IMailService {
  private readonly logger = new Logger(MailService.name);
  private readonly sentHistory: SentEmailRecord[] = [];
  private transporter: nodemailer.Transporter | null = null;
  private readonly smtpHost: string | null;
  private readonly smtpPort: number;
  private readonly smtpSecure: boolean;
  private readonly smtpUser?: string;
  private readonly smtpPass?: string;
  private readonly smtpFrom: string;
  private readonly frontendUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.smtpHost = this.configService.get<string>('SMTP_HOST') || null;
    this.smtpPort = parseInt(this.configService.get<string>('SMTP_PORT') || '1025', 10);
    this.smtpSecure = this.configService.get<string>('SMTP_SECURE') === 'true';
    this.smtpUser = this.configService.get<string>('SMTP_USER') || undefined;
    this.smtpPass = this.configService.get<string>('SMTP_PASS') || undefined;
    this.smtpFrom = this.configService.get<string>('SMTP_FROM') || 'FixFlow Support <no-reply@fixflow.edu>';
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

    if (this.smtpHost) {
      this.initTransporter();
    }
  }

  private initTransporter(): void {
    try {
      const transportOptions: any = {
        host: this.smtpHost,
        port: this.smtpPort,
        secure: this.smtpSecure,
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 10000,
      };

      if (this.smtpUser && this.smtpPass) {
        transportOptions.auth = {
          user: this.smtpUser,
          pass: this.smtpPass,
        };
      }

      this.transporter = nodemailer.createTransport(transportOptions);
      this.logger.log(`[MailService] Initialized SMTP transport for ${this.smtpHost}:${this.smtpPort}`);
    } catch (err: any) {
      this.logger.error(`[MailService] Failed to initialize SMTP transport: ${err.message}`);
      this.transporter = null;
    }
  }

  /**
   * Masks an email address for safe log output (e.g. j***e@fixflow.edu)
   */
  static maskEmail(email: string): string {
    if (!email || !email.includes('@')) return '***';
    const [local, domain] = email.split('@');
    if (local.length <= 2) {
      return `${local[0]}***@${domain}`;
    }
    return `${local[0]}***${local[local.length - 1]}@${domain}`;
  }

  private buildTextBody(name: string, url: string | undefined, expiryHours: number): string {
    return [
      `FixFlow — Campus Operations & Facilities Management`,
      `----------------------------------------------------`,
      `Dear ${name || 'Campus Member'},`,
      ``,
      `An institutional account registration was submitted using this email address.`,
      `To confirm your affiliation and activate your FixFlow access, please verify your email:`,
      ``,
      url || `[Verification token issued: check portal]`,
      ``,
      `For your security, this verification link will expire in ${expiryHours} hours.`,
      `If you did not request this account, you can safely disregard this message.`,
    ].join('\n');
  }

  private buildHtmlBody(name: string, url: string | undefined, expiryHours: number): string {
    const safeUrl = url || '#';
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your FixFlow Account</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .card { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .logo { font-size: 22px; font-weight: 800; color: #0284c7; margin-bottom: 24px; }
    .logo span { color: #0f172a; }
    h1 { font-size: 20px; font-weight: 700; margin: 0 0 16px; color: #0f172a; }
    p { font-size: 14px; line-height: 1.6; margin: 0 0 16px; color: #475569; }
    .btn-container { text-align: center; margin: 28px 0; }
    .btn { display: inline-block; background-color: #0284c7; color: #ffffff !important; padding: 12px 28px; border-radius: 10px; font-size: 14px; font-weight: 600; text-decoration: none; box-shadow: 0 2px 4px rgba(2, 132, 199, 0.2); }
    .fallback { font-size: 12px; color: #64748b; word-break: break-all; background: #f1f5f9; padding: 12px; border-radius: 8px; margin-top: 24px; }
    .footer { font-size: 11px; color: #94a3b8; text-align: center; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">Fix<span>Flow</span> <span style="font-size: 13px; font-weight: 500; color: #64748b;">• Campus Facilities</span></div>
    <h1>Verify Your Institutional Email Address</h1>
    <p>Dear <strong>${name || 'Campus Member'}</strong>,</p>
    <p>Thank you for enrolling in FixFlow. To confirm your campus affiliation and complete your account setup, please click the verification button below:</p>
    <div class="btn-container">
      <a href="${safeUrl}" class="btn" target="_blank" rel="noopener noreferrer">Verify Institutional Email</a>
    </div>
    <p>For your security, this verification link will expire in <strong>${expiryHours} hours</strong>.</p>
    <div class="fallback">
      <strong>If the button above does not work, copy and paste this link into your browser:</strong><br/>
      <a href="${safeUrl}" style="color: #0284c7;">${safeUrl}</a>
    </div>
    <div class="footer">
      Automated notification from FixFlow Campus Facilities Management.<br/>
      If you did not request this account, you can safely ignore this email.
    </div>
  </div>
</body>
</html>`;
  }

  async sendVerificationEmail(options: SendVerificationEmailOptions): Promise<boolean> {
    const canInspect = isDevTokenInspectionEnabled(this.configService);
    const maskedEmail = MailService.maskEmail(options.recipientEmail);

    const verificationUrl =
      options.verificationUrl ||
      (options.rawToken ? `${this.frontendUrl}/verify-email?token=${options.rawToken}` : undefined);

    const record: SentEmailRecord = {
      recipientEmail: options.recipientEmail,
      recipientName: options.recipientName,
      tokenMasked: options.tokenMasked,
      sentAt: new Date(),
      deliveryStatus: 'LOGGED_MOCK',
    };

    // Fail closed: Never retain raw verification tokens in memory in unapproved environments
    if (canInspect && options.rawToken) {
      record.rawToken = options.rawToken;
      record.verificationUrl = verificationUrl;
    }

    // 1. Attempt genuine SMTP delivery if SMTP transport is configured
    if (this.transporter && this.smtpHost) {
      try {
        const textContent = this.buildTextBody(options.recipientName, verificationUrl, options.expiresInHours);
        const htmlContent = this.buildHtmlBody(options.recipientName, verificationUrl, options.expiresInHours);

        const info = await this.transporter.sendMail({
          from: this.smtpFrom,
          to: options.recipientEmail,
          subject: 'FixFlow — Verify Your Institutional Email Address',
          text: textContent,
          html: htmlContent,
        });

        record.deliveryStatus = 'ACCEPTED';
        this.sentHistory.push(record);

        this.logger.log(
          `[Email Dispatch] Verification email delivered to ${maskedEmail} via SMTP [${this.smtpHost}:${this.smtpPort}] | Message ID: ${info.messageId} | Token ID: [${options.tokenMasked}]`,
        );

        return true;
      } catch (err: any) {
        record.deliveryStatus = 'FAILED';
        record.errorMessage = err.message;
        this.sentHistory.push(record);

        this.logger.error(
          `[Email Dispatch Failed] Failed to deliver verification email to ${maskedEmail} via SMTP [${this.smtpHost}:${this.smtpPort}]: ${err.message}`,
        );

        return false;
      }
    }

    // 2. Safe in-memory mock fallback when SMTP is unconfigured (development/test)
    this.sentHistory.push(record);

    this.logger.log(
      `[Email Dispatch] Verification email queued for recipient: ${maskedEmail} | Token ID: [${options.tokenMasked}] | Expiry: ${options.expiresInHours}h`,
    );

    return true;
  }

  /**
   * Safe inspection mechanism for local development and integration tests.
   * Fails closed in production and all non-permitted environments.
   */
  getDevSentHistory(): SentEmailRecord[] {
    if (!isDevTokenInspectionEnabled(this.configService)) {
      throw new ForbiddenException('Development email inspection is disabled in this environment');
    }
    return [...this.sentHistory];
  }

  /**
   * Look up latest dev verification token for a given email address.
   * Fails closed in production and all non-permitted environments.
   */
  getDevLatestToken(email: string): string | null {
    if (!isDevTokenInspectionEnabled(this.configService)) {
      throw new ForbiddenException('Development email inspection is disabled in this environment');
    }
    const normalized = email.toLowerCase().trim();
    for (let i = this.sentHistory.length - 1; i >= 0; i--) {
      if (this.sentHistory[i].recipientEmail.toLowerCase().trim() === normalized) {
        return this.sentHistory[i].rawToken || null;
      }
    }
    return null;
  }

  /**
   * For test assertions: returns dispatched history without exposing raw secrets.
   */
  getSentHistory(): SentEmailRecord[] {
    return [...this.sentHistory];
  }

  clearHistory(): void {
    this.sentHistory.length = 0;
  }
}
