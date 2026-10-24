export interface SendVerificationEmailOptions {
  recipientEmail: string;
  recipientName: string;
  tokenMasked: string; // Truncated or SHA-256 identifier for logs
  rawToken?: string; // High-entropy unhashed token for local development verification and email link
  verificationUrl?: string;
  expiresInHours: number;
}

export interface SentEmailRecord {
  recipientEmail: string;
  recipientName: string;
  tokenMasked: string;
  rawToken?: string; // Only retained in memory in non-production environments
  verificationUrl?: string;
  sentAt: Date;
  deliveryStatus?: 'ACCEPTED' | 'FAILED' | 'LOGGED_MOCK';
  errorMessage?: string;
}

export interface IMailService {
  sendVerificationEmail(options: SendVerificationEmailOptions): Promise<boolean>;
}
