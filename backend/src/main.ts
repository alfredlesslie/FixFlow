import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('FixFlowBootstrap');
  const app = await NestFactory.create(AppModule);

  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
  app.enableCors({
    origin: [corsOrigin, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
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
