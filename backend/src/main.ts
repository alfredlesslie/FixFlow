import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { parseTrustProxyConfig } from './common/config/environment.helper';

async function bootstrap() {
  const logger = new Logger('FixFlowBootstrap');
  const app = await NestFactory.create(AppModule);

  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
  app.enableCors({
    origin: [corsOrigin, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  });

  // Configure reverse proxy trust safely (fails closed by default)
  const expressApp = app.getHttpAdapter().getInstance();
  const trustProxySetting = parseTrustProxyConfig(process.env.TRUST_PROXY);
  if (trustProxySetting !== false) {
    expressApp.set('trust proxy', trustProxySetting);
    logger.log(`Reverse proxy trust configured: ${JSON.stringify(trustProxySetting)}`);
  } else {
    expressApp.set('trust proxy', false);
    logger.log('Direct connection mode: reverse proxy trust disabled (fails closed).');
  }

  // Remove Express server banner and configure baseline HTTP security headers
  expressApp.disable('x-powered-by');
  expressApp.use((_req: any, res: any, next: any) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });


  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // REST API prefix (GraphQL remains at /graphql)
  app.setGlobalPrefix('api', {
    exclude: ['graphql'],
  });

  const port = process.env.PORT || 4000;
  await app.listen(port);

  logger.log(`FixFlow Backend is running on: http://localhost:${port}`);
  logger.log(`GraphQL Playground ready at: http://localhost:${port}/graphql`);
  logger.log(`REST Health endpoint: http://localhost:${port}/api/health`);
}

bootstrap();
