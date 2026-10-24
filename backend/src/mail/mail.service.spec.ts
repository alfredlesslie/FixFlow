import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';

describe('MailService', () => {
  let service: MailService;
  let configService: ConfigService;

  beforeEach(() => {
    configService = {
      get: jest.fn((key: string) => {
        if (key === 'NODE_ENV') return 'development';
        return null;
      }),
    } as unknown as ConfigService;

    service = new MailService(configService);
  });

  afterEach(() => {
    service.clearHistory();
  });

  it('masks recipient email in logs and prevents secret exposure', () => {
    const masked = MailService.maskEmail('vikram.singhania@fixflow.edu');
    expect(masked).toBe('v***a@fixflow.edu');
    expect(masked).not.toContain('singhania');
  });

  it('records email dispatch in history with masked token ID', async () => {
    const success = await service.sendVerificationEmail({
      recipientEmail: 'student.riya@fixflow.edu',
      recipientName: 'Riya Sharma',
      tokenMasked: 'sha256-abc12345...',
      expiresInHours: 24,
    });

    expect(success).toBe(true);
    const history = service.getSentHistory();
    expect(history.length).toBe(1);
    expect(history[0].recipientEmail).toBe('student.riya@fixflow.edu');
    expect(history[0].tokenMasked).toBe('sha256-abc12345...');
  });

  it('retains rawToken in non-production environments and allows dev inspection', async () => {
    await service.sendVerificationEmail({
      recipientEmail: 'student.riya@fixflow.edu',
      recipientName: 'Riya Sharma',
      tokenMasked: 'sha256-abc12345...',
      rawToken: 'dev-raw-secret-token-12345',
      expiresInHours: 24,
    });

    const devHistory = service.getDevSentHistory();
    expect(devHistory[0].rawToken).toBe('dev-raw-secret-token-12345');

    const token = service.getDevLatestToken('student.riya@fixflow.edu');
    expect(token).toBe('dev-raw-secret-token-12345');
  });

  it('fails closed in production: does not retain rawToken and rejects dev inspection', async () => {
    (configService.get as jest.Mock).mockReturnValue('production');

    await service.sendVerificationEmail({
      recipientEmail: 'student.riya@fixflow.edu',
      recipientName: 'Riya Sharma',
      tokenMasked: 'sha256-abc12345...',
      rawToken: 'dev-raw-secret-token-12345',
      expiresInHours: 24,
    });

    const history = service.getSentHistory();
    expect(history[0].rawToken).toBeUndefined();

    expect(() => service.getDevSentHistory()).toThrow(
      'Development email inspection is disabled in this environment',
    );
    expect(() => service.getDevLatestToken('student.riya@fixflow.edu')).toThrow(
      'Development email inspection is disabled in this environment',
    );
  });

  it('fails closed when NODE_ENV is missing or undefined', async () => {
    (configService.get as jest.Mock).mockReturnValue(undefined);

    await service.sendVerificationEmail({
      recipientEmail: 'student.riya@fixflow.edu',
      recipientName: 'Riya Sharma',
      tokenMasked: 'sha256-abc12345...',
      rawToken: 'secret-token-unconfigured',
      expiresInHours: 24,
    });

    expect(service.getSentHistory()[0].rawToken).toBeUndefined();
    expect(() => service.getDevSentHistory()).toThrow(
      'Development email inspection is disabled in this environment',
    );
    expect(() => service.getDevLatestToken('student.riya@fixflow.edu')).toThrow(
      'Development email inspection is disabled in this environment',
    );
  });

  it('fails closed when NODE_ENV is empty string', async () => {
    (configService.get as jest.Mock).mockReturnValue('');

    await service.sendVerificationEmail({
      recipientEmail: 'student.riya@fixflow.edu',
      recipientName: 'Riya Sharma',
      tokenMasked: 'sha256-abc12345...',
      rawToken: 'secret-token-empty-env',
      expiresInHours: 24,
    });

    expect(service.getSentHistory()[0].rawToken).toBeUndefined();
    expect(() => service.getDevSentHistory()).toThrow(
      'Development email inspection is disabled in this environment',
    );
  });

  it('fails closed when NODE_ENV is set to non-permitted environments (e.g. staging, qa)', async () => {
    for (const invalidEnv of ['staging', 'qa', 'prod', 'uat']) {
      (configService.get as jest.Mock).mockReturnValue(invalidEnv);

      await service.sendVerificationEmail({
        recipientEmail: 'student.riya@fixflow.edu',
        recipientName: 'Riya Sharma',
        tokenMasked: 'sha256-abc12345...',
        rawToken: `secret-token-${invalidEnv}`,
        expiresInHours: 24,
      });

      expect(service.getSentHistory()[service.getSentHistory().length - 1].rawToken).toBeUndefined();
      expect(() => service.getDevSentHistory()).toThrow(
        'Development email inspection is disabled in this environment',
      );
    }
  });

  it('permits inspection when NODE_ENV=test', async () => {
    (configService.get as jest.Mock).mockReturnValue('test');

    await service.sendVerificationEmail({
      recipientEmail: 'test.user@fixflow.edu',
      recipientName: 'Test User',
      tokenMasked: 'sha256-test...',
      rawToken: 'test-token-valid',
      expiresInHours: 24,
    });

    expect(service.getDevLatestToken('test.user@fixflow.edu')).toBe('test-token-valid');
  });
});
